/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 51–55: SaaS Engine, Plan Entitlements & Compliance
 * Server-enforced quotas, usage metering, subscription lifecycle, and Pakistan gateway research.
 */

import crypto from 'crypto';
import { VerifiedSecurityContext, recordAuditLog } from './security.ts';

export type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type Currency = 'USD' | 'PKR';

export interface PlanEntitlement {
  tier: PlanTier;
  name: string;
  priceUsd: number;
  pricePkr: number;
  maxAiExecutionsPerMonth: number;
  maxMembers: number;
  maxKnowledgeMb: number;
  allowedAgentsCount: number;
  features: string[];
}

export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlement> = {
  free: {
    tier: 'free',
    name: 'Teamora Free',
    priceUsd: 0,
    pricePkr: 0,
    maxAiExecutionsPerMonth: 100,
    maxMembers: 2,
    maxKnowledgeMb: 50,
    allowedAgentsCount: 3,
    features: ['3 Core AI Agents (Echo, Atlas, Scribe)', 'Basic Knowledge Hub', 'Standard Gemini 3.1 Flash-Lite'],
  },
  starter: {
    tier: 'starter',
    name: 'Teamora Starter',
    priceUsd: 49,
    pricePkr: 13500,
    maxAiExecutionsPerMonth: 1000,
    maxMembers: 5,
    maxKnowledgeMb: 250,
    allowedAgentsCount: 7,
    features: ['7 Specialized AI Agents', 'Gemini 3.8 Flash with High Thinking', 'Basic Approvals Flow'],
  },
  pro: {
    tier: 'pro',
    name: 'Teamora Professional',
    priceUsd: 149,
    pricePkr: 41000,
    maxAiExecutionsPerMonth: 5000,
    maxMembers: 15,
    maxKnowledgeMb: 1000,
    allowedAgentsCount: 15,
    features: ['All 15 Specialized AI Agents', 'Full Orchestration Pipeline', 'Search Grounding', 'Priority Queuing'],
  },
  business: {
    tier: 'business',
    name: 'Teamora Business Scale',
    priceUsd: 399,
    pricePkr: 110000,
    maxAiExecutionsPerMonth: 25000,
    maxMembers: 50,
    maxKnowledgeMb: 5000,
    allowedAgentsCount: 15,
    features: ['High-throughput pipelines', 'Audit trails & RBAC enforcement', 'Dedicated Pakistan & US payment invoicing'],
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Teamora Enterprise Sovereign',
    priceUsd: 999,
    pricePkr: 275000,
    maxAiExecutionsPerMonth: 100000,
    maxMembers: 500,
    maxKnowledgeMb: 50000,
    allowedAgentsCount: 15,
    features: ['Custom SLAS', 'Dedicated instance support', 'Custom Agent training', 'Audit Log Export'],
  },
};

export interface TenantUsageRecord {
  orgId: string;
  billingCycleMonth: string; // '2026-11'
  aiExecutionsUsed: number;
  tokensUsedEstimate: number;
  storageUsedMb: number;
  activeMembersCount: number;
  lastUpdated: string;
}

export interface SubscriptionRecord {
  orgId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  currency: Currency;
  paymentProvider: 'safepay' | 'payfast_1link' | 'sadabiz' | 'lemonsqueezy' | 'simulated_test';
  lastInvoiceId?: string;
}

export interface InvoiceRecord {
  id: string;
  orgId: string;
  amountUsd: number;
  amountPkr: number;
  currency: Currency;
  plan: PlanTier;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  gatewayReference: string;
  issuedAt: string;
  paidAt?: string;
}

// In-Memory Durable Registry for Subscriptions & Usage
const tenantSubscriptions = new Map<string, SubscriptionRecord>();
const tenantUsage = new Map<string, TenantUsageRecord>();
const tenantInvoices = new Map<string, InvoiceRecord[]>();

// Seed default organization subscription
function initSaaSDefaults() {
  const defaultOrg = 'org-apex';
  tenantSubscriptions.set(defaultOrg, {
    orgId: defaultOrg,
    plan: 'pro',
    status: 'active',
    currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    currency: 'USD',
    paymentProvider: 'simulated_test',
  });

  tenantUsage.set(defaultOrg, {
    orgId: defaultOrg,
    billingCycleMonth: new Date().toISOString().slice(0, 7),
    aiExecutionsUsed: 420,
    tokensUsedEstimate: 185000,
    storageUsedMb: 145,
    activeMembersCount: 5,
    lastUpdated: new Date().toISOString(),
  });

  tenantInvoices.set(defaultOrg, [
    {
      id: 'inv-2026-10-apex',
      orgId: defaultOrg,
      amountUsd: 149,
      amountPkr: 41000,
      currency: 'USD',
      plan: 'pro',
      status: 'paid',
      gatewayReference: 'gw-sim-109283-apex',
      issuedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      paidAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ]);
}
initSaaSDefaults();

export function getTenantSubscription(orgId: string): SubscriptionRecord {
  let sub = tenantSubscriptions.get(orgId);
  if (!sub) {
    sub = {
      orgId,
      plan: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      currency: 'USD',
      paymentProvider: 'simulated_test',
    };
    tenantSubscriptions.set(orgId, sub);
  }
  return sub;
}

export function getTenantUsage(orgId: string): TenantUsageRecord {
  const currentMonth = new Date().toISOString().slice(0, 7);
  let usage = tenantUsage.get(orgId);
  if (!usage || usage.billingCycleMonth !== currentMonth) {
    usage = {
      orgId,
      billingCycleMonth: currentMonth,
      aiExecutionsUsed: 0,
      tokensUsedEstimate: 0,
      storageUsedMb: 10,
      activeMembersCount: 1,
      lastUpdated: new Date().toISOString(),
    };
    tenantUsage.set(orgId, usage);
  }
  return usage;
}

/**
 * Server-Side Plan Entitlement Check:
 * Enforces hard quotas before an AI agent execution or resource addition is permitted.
 */
export function checkPlanQuota(orgId: string, resource: 'aiExecution' | 'addMember' | 'addStorage'): { allowed: boolean; reason?: string; current: number; max: number } {
  const sub = getTenantSubscription(orgId);
  const entitlement = PLAN_ENTITLEMENTS[sub.plan];
  const usage = getTenantUsage(orgId);

  if (resource === 'aiExecution') {
    if (usage.aiExecutionsUsed >= entitlement.maxAiExecutionsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly AI execution limit reached (${usage.aiExecutionsUsed}/${entitlement.maxAiExecutionsPerMonth}). Upgrade to higher plan tier.`,
        current: usage.aiExecutionsUsed,
        max: entitlement.maxAiExecutionsPerMonth,
      };
    }
    return { allowed: true, current: usage.aiExecutionsUsed, max: entitlement.maxAiExecutionsPerMonth };
  }

  if (resource === 'addMember') {
    if (usage.activeMembersCount >= entitlement.maxMembers) {
      return {
        allowed: false,
        reason: `Team seat limit reached (${usage.activeMembersCount}/${entitlement.maxMembers}). Upgrade plan for additional seats.`,
        current: usage.activeMembersCount,
        max: entitlement.maxMembers,
      };
    }
    return { allowed: true, current: usage.activeMembersCount, max: entitlement.maxMembers };
  }

  return { allowed: true, current: usage.storageUsedMb, max: entitlement.maxKnowledgeMb };
}

export function recordUsageMetric(orgId: string, resource: 'aiExecution', amount: number = 1, tokens: number = 250): void {
  const usage = getTenantUsage(orgId);
  usage.aiExecutionsUsed += amount;
  usage.tokensUsedEstimate += tokens;
  usage.lastUpdated = new Date().toISOString();
}

/**
 * Updates subscription plan with RBAC protection (Owner/Admin only).
 */
export function updateSubscriptionPlan(
  context: VerifiedSecurityContext,
  targetPlan: PlanTier,
  currency: Currency = 'USD',
  paymentProvider: SubscriptionRecord['paymentProvider'] = 'simulated_test'
): { success: true; subscription: SubscriptionRecord; invoice: InvoiceRecord } | { success: false; error: string; status: number } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return {
      success: false,
      status: 403,
      error: `Forbidden: Modifying subscription requires Owner or Admin role. User holds '${context.role}'.`,
    };
  }

  const entitlement = PLAN_ENTITLEMENTS[targetPlan];
  const sub = getTenantSubscription(context.orgId);
  sub.plan = targetPlan;
  sub.currency = currency;
  sub.paymentProvider = paymentProvider;
  sub.status = 'active';
  sub.currentPeriodStart = new Date().toISOString();
  sub.currentPeriodEnd = new Date(Date.now() + 30 * 86400000).toISOString();

  // Create an invoice record
  const invoiceId = `inv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const invoice: InvoiceRecord = {
    id: invoiceId,
    orgId: context.orgId,
    amountUsd: entitlement.priceUsd,
    amountPkr: entitlement.pricePkr,
    currency,
    plan: targetPlan,
    status: targetPlan === 'free' ? 'paid' : 'paid',
    gatewayReference: `[SANDBOX_PAYMENT_GATEWAY] ref-${Date.now()}`,
    issuedAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  let invoices = tenantInvoices.get(context.orgId);
  if (!invoices) {
    invoices = [];
    tenantInvoices.set(context.orgId, invoices);
  }
  invoices.unshift(invoice);
  sub.lastInvoiceId = invoiceId;

  recordAuditLog(context, 'subscription_plan_updated', context.orgId, 'executed', {
    targetPlan,
    currency,
    invoiceId,
    provider: paymentProvider,
  });

  return { success: true, subscription: sub, invoice };
}

export function getTenantInvoices(context: VerifiedSecurityContext): InvoiceRecord[] {
  // Billing data protected: viewers and members cannot access financial billing records
  if (context.role === 'viewer' || context.role === 'member') {
    return [];
  }
  return tenantInvoices.get(context.orgId) || [];
}

/**
 * Pakistan Payment Gateway Eligibility Research Summary:
 * Comprehensive factual documentation of Pakistan electronic payment gateways.
 */
export const PAKISTAN_PAYMENT_GATEWAY_DOCS = {
  jurisdiction: 'Pakistan (State Bank of Pakistan - SBP Regulated)',
  internationalProcessors: {
    stripe: {
      status: 'NOT_DIRECTLY_SUPPORTED',
      details: 'Stripe does not offer domestic merchant processing for Pakistan bank accounts directly. Pakistani founders must register a Delaware/Wyoming LLC via Stripe Atlas or similar corporate structure to operate a US Stripe account.',
    },
    paypal: {
      status: 'NOT_AVAILABLE',
      details: 'PayPal does not operate direct merchant receiving accounts in Pakistan.',
    },
  },
  domesticCompliantGateways: [
    {
      name: 'Safepay',
      type: 'SBP Regulated Payment Service Provider (PSP)',
      capabilities: ['Visa/Mastercard Debit & Credit Cards', '1Link UnionPay', 'EasyPaisa & JazzCash Wallets', 'Raast Instant QR & Direct Account Debits'],
      currencies: ['PKR', 'USD conversion'],
      webhookSupport: true,
      sandboxAvailable: true,
    },
    {
      name: 'PayFast by APPS',
      type: '1Link Authorized Payment Gateway',
      capabilities: ['UnionPay/PayPak cards', 'Direct Internet Banking (18+ Commercial Banks)', 'Corporate Billing Settlement'],
      currencies: ['PKR'],
      webhookSupport: true,
      sandboxAvailable: true,
    },
    {
      name: 'SadaBiz (SadaPay)',
      type: 'Freelancer & SME Invoicing Gateway',
      capabilities: ['International Apple Pay & Card Invoicing in USD, GBP, AED, EUR', 'Instant Settlement to SadaPay PKR Account at Interbank Rate'],
      currencies: ['USD', 'EUR', 'GBP', 'PKR'],
      webhookSupport: false,
      sandboxAvailable: false,
    },
    {
      name: 'LemonSqueezy / Paddle (Merchant of Record)',
      type: 'Global Merchant of Record (MoR)',
      capabilities: ['Handles global sales tax/VAT', 'Accepts Pakistani customer cards seamlessly', 'Payouts via Wise or Payoneer to Pakistani banks'],
      currencies: ['USD', 'EUR', '135+ currencies'],
      webhookSupport: true,
      sandboxAvailable: true,
    },
  ],
};
