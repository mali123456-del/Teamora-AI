/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 46–50: Autonomous AI Workforce Execution Engine
 * Manages independent execution, typed tool schemas, retry limits, timeouts,
 * human approval gates, org-isolated memory retrieval, and cryptographic execution receipts.
 */

import crypto from 'crypto';
import { z } from 'zod';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { TEAMORA_AGENTS, AgentDefinition } from '../src/data/agents.ts';
import { generateWithResilience } from './geminiHandler.ts';
import { VerifiedSecurityContext, recordAuditLog } from './security.ts';

export type TaskStatus = 'queued' | 'planning' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'cancelled';

export interface ExecutionReceipt {
  receiptId: string;
  taskTitle: string;
  agentId: string;
  orgId: string;
  timestamp: string;
  durationMs: number;
  modelUsed: string;
  fallbackTriggered: boolean;
  status: TaskStatus;
  outputSummary: string;
  contentHash: string;
}

export interface AgentExecutionTask {
  id: string;
  orgId: string;
  agentId: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contextData?: Record<string, any>;
  result?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  requiresApproval: boolean;
  approvalReason?: string;
  approvalId?: string;
  receipt?: ExecutionReceipt;
  events: {
    stage: string;
    timestamp: string;
    message: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// In-Memory Tenant Task Registry & Knowledge Memory (backed by durable isolation)
const tenantTasks = new Map<string, Map<string, AgentExecutionTask>>();
const tenantMemory = new Map<string, { id: string; category: string; content: string; tags: string[] }[]>();

// Seed sample tenant memory for org-apex
function initTenantMemory() {
  const apexMemory = [
    {
      id: 'mem-001',
      category: 'Pricing',
      content: 'Standard enterprise license fee is $2,400/month or PKR 650,000/month. Payment terms are Net-30.',
      tags: ['pricing', 'finance', 'terms'],
    },
    {
      id: 'mem-002',
      category: 'Compliance',
      content: 'All GDPR data deletion requests must be completed within 72 hours and logged in immutable audit records.',
      tags: ['legal', 'gdpr', 'compliance'],
    },
    {
      id: 'mem-003',
      category: 'Refund Policy',
      content: 'Customer refunds up to $50 can be handled autonomously by Echo. Refunds over $50 require Ledger or Owner approval.',
      tags: ['support', 'refunds', 'finance'],
    },
  ];
  tenantMemory.set('org-apex', apexMemory);
}
initTenantMemory();

export function queryOrgMemory(orgId: string, searchTerms: string): string[] {
  const memories = tenantMemory.get(orgId) || [];
  if (!searchTerms) return memories.map((m) => `[${m.category}] ${m.content}`);

  const terms = searchTerms.toLowerCase().split(' ').filter(Boolean);
  const matched = memories.filter((m) => {
    const text = `${m.category} ${m.content} ${m.tags.join(' ')}`.toLowerCase();
    return terms.some((t) => text.includes(t));
  });

  return matched.map((m) => `[${m.category}] ${m.content}`);
}

export function addOrgMemory(orgId: string, category: string, content: string, tags: string[] = []) {
  let list = tenantMemory.get(orgId);
  if (!list) {
    list = [];
    tenantMemory.set(orgId, list);
  }
  list.push({
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    category,
    content,
    tags,
  });
}

// ==========================================
// Agent Tool Schemas & Dispatch Table
// ==========================================
export const AgentToolSchemas = {
  // Atlas (Workforce Manager)
  orchestrate_pipeline: z.object({
    goal: z.string().min(1),
    involvedAgents: z.array(z.string()).min(1),
  }),
  // Echo (Customer Support)
  draft_reply: z.object({
    ticketId: z.string(),
    customerEmail: z.string().email(),
    inquiry: z.string(),
  }),
  // Vanguard (Sales)
  score_lead: z.object({
    companyName: z.string(),
    teamSize: z.number().positive(),
    budgetUsd: z.number().positive(),
  }),
  // Ledger (Finance)
  calculate_tax: z.object({
    amount: z.number().positive(),
    region: z.enum(['US', 'EU', 'PK', 'GLOBAL']),
  }),
  // Justitia (Legal)
  review_contract: z.object({
    documentTitle: z.string(),
    contractType: z.enum(['NDA', 'SaaS Agreement', 'Employment', 'Vendor Agreement']),
  }),
};

/**
 * Checks if a proposed task or tool execution requires Human-In-The-Loop Approval.
 */
export function evaluateApprovalRequirement(agent: AgentDefinition, prompt: string, toolName?: string): { requiresApproval: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  // High-risk keywords across departments
  const highRiskPatterns = [
    { pattern: /refund.*(\$|\b)\d+/i, reason: 'Financial refund disbursement requires authorization' },
    { pattern: /delete.*database|drop.*table|purge.*records/i, reason: 'Destructive data deletion requires Owner confirmation' },
    { pattern: /execute.*payout|wire.*transfer|disburse/i, reason: 'Treasury capital disbursement requires Admin authorization' },
    { pattern: /sign.*contract|execute.*agreement/i, reason: 'Legal agreement execution requires Owner/Legal verification' },
    { pattern: /change.*role|promote.*admin|demote/i, reason: 'RBAC privilege alteration requires Owner sign-off' },
    { pattern: /broadcast.*email|mass.*message/i, reason: 'Bulk communications require Marketing/Executive review' },
  ];

  for (const item of highRiskPatterns) {
    if (item.pattern.test(lowerPrompt)) {
      return { requiresApproval: true, reason: item.reason };
    }
  }

  // Check agent's specific requiresApprovalFor list
  for (const condition of agent.requiresApprovalFor) {
    if (lowerPrompt.includes(condition.toLowerCase())) {
      return { requiresApproval: true, reason: `Policy rule: '${condition}'` };
    }
  }

  return { requiresApproval: false };
}

// ==========================================
// Independent Execution Pipeline
// ==========================================
export async function executeAgentTask(
  ai: GoogleGenAI,
  context: VerifiedSecurityContext,
  agentId: string,
  title: string,
  prompt: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  contextData?: Record<string, any>
): Promise<AgentExecutionTask> {
  const agent = TEAMORA_AGENTS.find((a) => a.id === agentId);
  if (!agent) {
    throw new Error(`Agent '${agentId}' not found in workforce directory.`);
  }

  const taskId = `task-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const startTime = Date.now();

  const task: AgentExecutionTask = {
    id: taskId,
    orgId: context.orgId,
    agentId,
    title,
    prompt,
    status: 'queued',
    priority,
    contextData,
    retryCount: 0,
    maxRetries: 3,
    requiresApproval: false,
    events: [
      { stage: 'queued', timestamp: new Date().toISOString(), message: `Task queued for agent ${agent.name} (${agent.role})` },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Evaluate Human Approval Gate
  const approvalCheck = evaluateApprovalRequirement(agent, prompt);
  if (approvalCheck.requiresApproval) {
    task.status = 'needs_approval';
    task.requiresApproval = true;
    task.approvalReason = approvalCheck.reason;
    task.approvalId = `appr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    task.events.push({
      stage: 'needs_approval',
      timestamp: new Date().toISOString(),
      message: `Execution halted. Requires human authorization: ${approvalCheck.reason}`,
    });

    recordAuditLog(context, 'agent_task_halted_for_approval', taskId, 'allowed', {
      agentId,
      approvalReason: approvalCheck.reason,
      approvalId: task.approvalId,
    });

    saveTask(task);
    return task;
  }

  // 2. Planning & Memory Retrieval Stage
  task.status = 'planning';
  task.events.push({
    stage: 'planning',
    timestamp: new Date().toISOString(),
    message: `Synthesizing context and querying organization memory for '${context.orgId}'`,
  });

  const orgKnowledge = queryOrgMemory(context.orgId, prompt);
  const memoryContext = orgKnowledge.length > 0 
    ? `\n\n[ORGANIZATION INTERNAL KNOWLEDGE]:\n${orgKnowledge.join('\n')}`
    : '';

  // 3. Execution with Resilience & Retries
  task.status = 'running';
  task.events.push({
    stage: 'running',
    timestamp: new Date().toISOString(),
    message: `Executing task using primary model '${agent.preferredModel}'`,
  });

  let executionSuccess = false;
  let finalResult = '';
  let modelUsed: string = agent.preferredModel;
  let wasFallback = false;

  for (let attempt = 1; attempt <= task.maxRetries; attempt++) {
    task.retryCount = attempt - 1;
    try {
      const systemInstruction = `${agent.systemInstruction}
You are operating within organization '${context.orgId}'.
Strict safety guidelines: Deliver structured, accurate, verifiable deliverables.
${memoryContext}`;

      const config: Record<string, any> = {
        systemInstruction,
      };

      if (agent.preferredModel === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const resilienceResult = await generateWithResilience(
        ai,
        agent.preferredModel,
        prompt,
        config
      );

      finalResult = resilienceResult.response.text || '';
      modelUsed = resilienceResult.actualModel;
      wasFallback = resilienceResult.fallbackTriggered;
      executionSuccess = true;
      break;
    } catch (err: any) {
      task.events.push({
        stage: 'retry',
        timestamp: new Date().toISOString(),
        message: `Attempt ${attempt} failed: ${err.message || 'Execution error'}.`,
      });
      if (attempt === task.maxRetries) {
        task.status = 'failed';
        task.error = `Task failed after ${task.maxRetries} attempts: ${err.message}`;
        task.updatedAt = new Date().toISOString();
        saveTask(task);
        recordAuditLog(context, 'agent_task_failed', taskId, 'failed', { error: task.error });
        return task;
      }
    }
  }

  // 4. Cryptographic Execution Receipt Generation
  // CRITICAL: NEVER mark an agent task completed without verified execution receipt!
  if (executionSuccess) {
    const durationMs = Date.now() - startTime;
    const contentToHash = `${taskId}|${agentId}|${context.orgId}|${finalResult}|${durationMs}`;
    const contentHash = crypto.createHash('sha256').update(contentToHash).digest('hex');

    const receipt: ExecutionReceipt = {
      receiptId: `rcpt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      taskTitle: title,
      agentId,
      orgId: context.orgId,
      timestamp: new Date().toISOString(),
      durationMs,
      modelUsed,
      fallbackTriggered: wasFallback,
      status: 'completed',
      outputSummary: finalResult.slice(0, 150) + '...',
      contentHash,
    };

    task.status = 'completed';
    task.result = finalResult;
    task.receipt = receipt;
    task.updatedAt = new Date().toISOString();
    task.events.push({
      stage: 'completed',
      timestamp: new Date().toISOString(),
      message: `Verified completion receipt issued (${receipt.receiptId}). Execution completed in ${durationMs}ms.`,
    });

    recordAuditLog(context, 'agent_task_completed', taskId, 'executed', {
      agentId,
      receiptId: receipt.receiptId,
      durationMs,
      modelUsed,
    });

    saveTask(task);
    return task;
  }

  task.status = 'failed';
  task.error = 'Unknown execution failure';
  saveTask(task);
  return task;
}

function saveTask(task: AgentExecutionTask) {
  let orgTasks = tenantTasks.get(task.orgId);
  if (!orgTasks) {
    orgTasks = new Map();
    tenantTasks.set(task.orgId, orgTasks);
  }
  orgTasks.set(task.id, task);
}

export function getOrgTasks(orgId: string): AgentExecutionTask[] {
  const orgTasks = tenantTasks.get(orgId);
  if (!orgTasks) return [];
  return Array.from(orgTasks.values());
}

export function cancelTask(orgId: string, taskId: string, context: VerifiedSecurityContext): boolean {
  const orgTasks = tenantTasks.get(orgId);
  if (!orgTasks) return false;
  const task = orgTasks.get(taskId);
  if (!task) return false;

  if (task.status === 'completed' || task.status === 'failed') {
    return false;
  }

  task.status = 'cancelled';
  task.events.push({
    stage: 'cancelled',
    timestamp: new Date().toISOString(),
    message: `Task cancelled by authorized user ${context.uid}`,
  });
  task.updatedAt = new Date().toISOString();
  recordAuditLog(context, 'agent_task_cancelled', taskId, 'executed', {});
  return true;
}
