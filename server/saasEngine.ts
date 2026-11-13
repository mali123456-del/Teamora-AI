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

// ==========================================
// Phase 369–370: Trial, Cancellation, Feature Entitlements & Billing Webhooks
// ==========================================

export type EntitledFeature =
  | 'highThinking'
  | 'searchGrounding'
  | 'orchestrator3d'
  | 'ragStudio'
  | 'customWebhooks'
  | 'auditExport';

const FEATURE_MIN_PLAN: Record<EntitledFeature, PlanTier[]> = {
  highThinking: ['starter', 'pro', 'business', 'enterprise'],
  searchGrounding: ['starter', 'pro', 'business', 'enterprise'],
  orchestrator3d: ['pro', 'business', 'enterprise'],
  ragStudio: ['pro', 'business', 'enterprise'],
  customWebhooks: ['business', 'enterprise'],
  auditExport: ['free', 'starter', 'pro', 'business', 'enterprise'], // Always available for portability
};

export function enforceFeatureEntitlement(
  orgId: string,
  feature: EntitledFeature
): { allowed: boolean; plan: PlanTier; status: SubscriptionStatus; reason?: string } {
  const sub = getTenantSubscription(orgId);
  // Data portability export remains permitted even if canceled or past_due (Phase 365 / 369)
  if (feature === 'auditExport') {
    return { allowed: true, plan: sub.plan, status: sub.status };
  }
  if (sub.status === 'canceled') {
    return {
      allowed: false,
      plan: sub.plan,
      status: sub.status,
      reason: 'Subscription is canceled. Data export remains available, but active automation features are paused.',
    };
  }
  const permittedPlans = FEATURE_MIN_PLAN[feature];
  const allowed = permittedPlans.includes(sub.plan);
  return {
    allowed,
    plan: sub.plan,
    status: sub.status,
    reason: allowed
      ? undefined
      : `Feature '${feature}' requires plan: ${permittedPlans[0].toUpperCase()} or higher (current: ${sub.plan.toUpperCase()}).`,
  };
}

export function startTrialSubscription(
  context: VerifiedSecurityContext,
  trialPlan: PlanTier = 'pro',
  trialDays: number = 14
): { success: true; subscription: SubscriptionRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  const sub = getTenantSubscription(context.orgId);
  sub.plan = trialPlan;
  sub.status = 'trialing';
  sub.cancelAtPeriodEnd = false;
  sub.currentPeriodStart = new Date().toISOString();
  sub.currentPeriodEnd = new Date(Date.now() + trialDays * 86400000).toISOString();

  recordAuditLog(context, 'subscription_trial_started', context.orgId, 'executed', {
    trialPlan,
    trialDays,
  });
  return { success: true, subscription: sub };
}

export function scheduleSubscriptionCancellation(
  context: VerifiedSecurityContext,
  immediate: boolean = false
): { success: true; subscription: SubscriptionRecord } | { success: false; status: number; error: string } {
  if (context.role !== 'owner' && context.role !== 'admin') {
    return { success: false, status: 403, error: 'Forbidden: Requires Owner or Admin.' };
  }
  const sub = getTenantSubscription(context.orgId);
  if (immediate) {
    sub.status = 'canceled';
    sub.cancelAtPeriodEnd = true;
  } else {
    sub.cancelAtPeriodEnd = true;
  }
  recordAuditLog(context, 'subscription_cancellation_updated', context.orgId, 'executed', {
    immediate,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
  return { success: true, subscription: sub };
}

export interface BillingWebhookEventInput {
  eventId: string;
  eventType: 'invoice.paid' | 'invoice.payment_failed' | 'subscription.canceled' | 'charge.refunded';
  orgId: string;
  invoiceId?: string;
  amountUsd?: number;
  provider?: SubscriptionRecord['paymentProvider'];
  mode?: 'sandbox' | 'live';
}

const processedWebhookEvents = new Set<string>();

export function signBillingWebhookPayload(rawPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
}

export function verifyBillingWebhookSignature(
  rawPayload: string,
  providedSignature: string,
  secret: string
): boolean {
  if (!providedSignature || !secret) return false;
  const normalizedProvided = providedSignature.replace(/^sha256=/i, '').trim();
  const expected = signBillingWebhookPayload(rawPayload, secret);
  if (normalizedProvided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(normalizedProvided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function processBillingWebhookEvent(
  event: BillingWebhookEventInput,
  rawPayload: string,
  signatureHeader: string,
  configuredSecret?: string
): {
  success: boolean;
  status: number;
  deduplicated?: boolean;
  message: string;
  billingMode: 'sandbox' | 'live';
} {
  const billingMode = (process.env.BILLING_MODE || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const secret = configuredSecret || process.env.SAAS_WEBHOOK_SECRET || 'teamora_sandbox_webhook_secret';

  if (!verifyBillingWebhookSignature(rawPayload, signatureHeader, secret)) {
    return {
      success: false,
      status: 401,
      message: 'Webhook HMAC-SHA256 signature verification failed.',
      billingMode,
    };
  }

  if (processedWebhookEvents.has(event.eventId)) {
    return {
      success: true,
      status: 200,
      deduplicated: true,
      message: `Webhook event '${event.eventId}' already reconciled (idempotent noop).`,
      billingMode,
    };
  }

  processedWebhookEvents.add(event.eventId);
  const sub = getTenantSubscription(event.orgId);

  if (event.eventType === 'invoice.paid') {
    sub.status = 'active';
    sub.cancelAtPeriodEnd = false;
  } else if (event.eventType === 'invoice.payment_failed') {
    sub.status = 'past_due';
  } else if (event.eventType === 'subscription.canceled') {
    sub.status = 'canceled';
    sub.cancelAtPeriodEnd = true;
  } else if (event.eventType === 'charge.refunded' && event.invoiceId) {
    const invoices = tenantInvoices.get(event.orgId) || [];
    const targetInv = invoices.find((inv) => inv.id === event.invoiceId);
    if (targetInv) {
      targetInv.status = 'void';
    }
  }

  return {
    success: true,
    status: 200,
    deduplicated: false,
    message: `[${billingMode === 'sandbox' ? 'SANDBOX_WEBHOOK' : 'LIVE_WEBHOOK'}] Processed '${event.eventType}' for org '${event.orgId}'.`,
    billingMode,
  };
}

