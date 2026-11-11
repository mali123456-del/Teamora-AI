export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type CurrencyCode = 'USD' | 'PKR';
export type SupportedLanguage = 'en' | 'ur';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  ownerUid: string;
  currency: CurrencyCode;
  createdAt: string;
  membersCount: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  orgId: string;
  language: SupportedLanguage;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
  assignedAgentId?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  avatar?: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface AgentTask {
  id: string;
  orgId: string;
  agentId: string;
  agentName: string;
  title: string;
  prompt: string;
  status: 'queued' | 'planning' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  result?: string;
  groundingChunks?: Array<{ web?: { uri: string; title: string } }>;
  steps?: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
  subtasks?: SubtaskItem[];
  comments?: TaskComment[];
  dueDate?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  duration?: string;
  modelUsed?: string;
}

export interface ApprovalRequest {
  id: string;
  orgId: string;
  agentId: string;
  agentName: string;
  actionType: 'email_send' | 'refund' | 'payout' | 'contract_sign' | 'stock_writeoff' | 'workflow_live';
  title: string;
  description: string;
  consequences: string;
  payloadSummary: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'executed' | 'execution_failed' | 'cancelled';
  executionId?: string;
  executionResult?: string;
  executionError?: string;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  value: number;
  currency: CurrencyCode;
  phone?: string;
  notes?: string;
  assignedAgent?: string;
  createdAt: string;
}

export interface ProductInventory {
  id: string;
  orgId: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  minThreshold: number;
  unitPrice: number;
  currency: CurrencyCode;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Order {
  id: string;
  orgId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  currency: CurrencyCode;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: CurrencyCode;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  orgId: string;
  category: 'software' | 'marketing' | 'infrastructure' | 'operations' | 'travel' | 'other';
  description: string;
  amount: number;
  currency: CurrencyCode;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  createdAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  progress: number;
  deadline: string;
  tasksCount: number;
  completedTasksCount: number;
  leadAgentId: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeAgentId: string;
  dueDate: string;
}

export interface DocumentItem {
  id: string;
  orgId: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'sheet' | 'markdown' | 'txt';
  category: 'contracts' | 'reports' | 'sop' | 'marketing' | 'research';
  status: 'processing' | 'indexed' | 'error';
  uploadedAt: string;
  tags: string[];
  summary?: string;
}

export interface AutomationWorkflow {
  id: string;
  orgId: string;
  name: string;
  description: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  stepsCount: number;
  executionsCount: number;
  lastRunAt: string;
  requiresApproval?: boolean;
}

export interface SecurityAuditLog {
  id: string;
  orgId: string;
  action: string;
  actor: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'blocked';
  timestamp: string;
}
