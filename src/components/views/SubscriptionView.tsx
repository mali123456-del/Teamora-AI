import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Check, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface PlanEntitlementClient {
  tier: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  name: string;
  priceUsd: number;
  pricePkr: number;
  maxAiExecutionsPerMonth: number;
  maxMembers: number;
  maxKnowledgeMb: number;
  allowedAgentsCount: number;
  features: string[];
}

interface SubscriptionSnapshot {
  orgId: string;
  plan: PlanEntitlementClient['tier'];
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  currency: 'USD' | 'PKR';
  paymentProvider: string;
}

interface UsageSnapshot {
  billingCycleMonth: string;
  aiExecutionsUsed: number;
  tokensUsedEstimate: number;
  storageUsedMb: number;
  activeMembersCount: number;
}

interface InvoiceSnapshot {
  id: string;
  plan: string;
  amountUsd: number;
  amountPkr: number;
  currency: 'USD' | 'PKR';
  status: string;
  gatewayReference: string;
  issuedAt: string;
}

const FALLBACK_PLANS: PlanEntitlementClient[] = [
  {
    tier: 'free',
    name: 'Teamora Free',
    priceUsd: 0,
    pricePkr: 0,
    maxAiExecutionsPerMonth: 100,
    maxMembers: 2,
    maxKnowledgeMb: 50,
    allowedAgentsCount: 3,
    features: ['3 Core AI Agents (Echo, Atlas, Scribe)', '50 MB Knowledge Hub', 'Standard Gemini 3.1 Flash-Lite'],
  },
  {
    tier: 'starter',
    name: 'Teamora Starter',
    priceUsd: 49,
    pricePkr: 13500,
    maxAiExecutionsPerMonth: 1000,
    maxMembers: 5,
    maxKnowledgeMb: 250,
    allowedAgentsCount: 7,
    features: ['7 Specialized AI Agents', 'Gemini 3.8 Flash + High Thinking', 'Basic Approvals Gate'],
  },
  {
    tier: 'pro',
    name: 'Teamora Professional',
    priceUsd: 149,
    pricePkr: 41000,
    maxAiExecutionsPerMonth: 5000,
    maxMembers: 15,
    maxKnowledgeMb: 1000,
    allowedAgentsCount: 15,
    features: ['All 15 Specialized AI Employees', '3D Neural Orchestrator', 'Search Grounding & RAG Studio'],
  },
  {
    tier: 'business',
    name: 'Teamora Business Scale',
    priceUsd: 399,
    pricePkr: 110000,
    maxAiExecutionsPerMonth: 25000,
    maxMembers: 50,
    maxKnowledgeMb: 5000,
    allowedAgentsCount: 15,
    features: ['25,000 AI executions / month', '50 Team seats + strict RBAC', 'Custom Webhooks & Audit Export'],
  },
  {
    tier: 'enterprise',
    name: 'Teamora Enterprise Sovereign',
    priceUsd: 999,
    pricePkr: 275000,
    maxAiExecutionsPerMonth: 100000,
    maxMembers: 500,
    maxKnowledgeMb: 50000,
    allowedAgentsCount: 15,
    features: ['100,000 AI executions / month', '500 Team seats', 'Dedicated SLA & Audit Archive'],
  },
];

export const SubscriptionView: React.FC = () => {
  const { currentOrg, currency, user, setBannerMessage, setCurrentOrg } = useApp();
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [plans, setPlans] = useState<PlanEntitlementClient[]>(FALLBACK_PLANS);
  const [invoices, setInvoices] = useState<InvoiceSnapshot[]>([]);
  const [billingMode, setBillingMode] = useState<'sandbox' | 'live'>('sandbox');
  const [isUpdating, setIsUpdating] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-teamora-org': currentOrg.id,
      'x-teamora-sandbox': 'true',
      'x-teamora-uid': user?.uid || 'user-admin-002',
    }),
    [currentOrg.id, user?.uid]
  );

  const loadSubscriptionData = useCallback(async () => {
    try {
      const headers = authHeaders();
      const [subRes, invRes] = await Promise.all([
        fetch(`/api/saas/subscription?orgId=${currentOrg.id}`, { headers }),
        fetch(`/api/saas/invoices?orgId=${currentOrg.id}`, { headers }),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
        setUsage(data.usage);
        setBillingMode(data.billingMode || 'sandbox');
        if (data.allPlans) {
          setPlans(Object.values(data.allPlans));
        }
      }
      if (invRes.ok) {
        const iData = await invRes.json();
        setInvoices(iData.invoices || []);
      }
    } catch {
      // Non-fatal fallback
    }
  }, [authHeaders, currentOrg.id]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const handleSelectPlan = async (targetPlan: PlanEntitlementClient['tier']) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/saas/subscription', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orgId: currentOrg.id,
          targetPlan,
          currency,
          paymentProvider: 'simulated_test',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscription(data.subscription);
        setCurrentOrg({ ...currentOrg, plan: targetPlan });
        await loadSubscriptionData();
        setBannerMessage({
          title: `[${billingMode.toUpperCase()}] Plan updated to ${targetPlan.toUpperCase()}. Invoice ${data.invoice.id} recorded.`,
          type: 'success',
        });
      } else {
        setBannerMessage({ title: data.error || 'Plan update blocked.', type: 'warning' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScheduleCancel = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orgId: currentOrg.id, immediate: false }),
      });
      if (res.ok) {
        await loadSubscriptionData();
        setBannerMessage({
          title: 'Cancellation scheduled for period end. Full data export remains enabled.',
          type: 'info',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const activeTier = subscription?.plan || currentOrg.plan;
  const activeEntitlement = plans.find((p) => p.tier === activeTier) || plans[2];

  const formatPlanPrice = (plan: PlanEntitlementClient) => {
    if (currency === 'PKR') {
      return `₨ ${plan.pricePkr.toLocaleString()}`;
    }
    return `$${plan.priceUsd.toLocaleString()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-4">
        <div>
          <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Subscriptions & Entitlements / {currentOrg.name} · Billing Mode: {billingMode.toUpperCase()}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Subscription & Capacity Management
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Server-authoritative plan quotas, metering, cancellation lifecycle, and regional gateway transparency.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadSubscriptionData}
            disabled={isUpdating}
            className="px-3.5 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>Sync Quotas</span>
          </button>
          {activeTier !== 'free' && subscription?.status !== 'canceled' && !subscription?.cancelAtPeriodEnd && (
            <button
              onClick={handleScheduleCancel}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-lg border border-[#FF806E]/50 text-[#FF806E] text-xs font-semibold cursor-pointer hover:bg-[#FF806E]/10 whitespace-nowrap"
            >
              Cancel at Period End
            </button>
          )}
        </div>
      </div>

      {/* Live Quota Metering Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5">
          <div className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">Monthly AI Executions</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums">
            {usage ? usage.aiExecutionsUsed.toLocaleString() : '0'} /{' '}
            {activeEntitlement.maxAiExecutionsPerMonth.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Cycle: {usage?.billingCycleMonth || 'Current'} · Status: {(subscription?.status || 'active').toUpperCase()}
            {subscription?.cancelAtPeriodEnd ? ' (Cancels at end)' : ''}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5">
          <div className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">Team Seats & AI Agents</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-[#8B5CF6]">
            {usage?.activeMembersCount ?? 1} / {activeEntitlement.maxMembers} Seats
          </div>
          <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
            {activeEntitlement.allowedAgentsCount} / 15 AI Employees Entitled
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5">
          <div className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">Knowledge Vault Storage</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-[#10B981]">
            {usage?.storageUsedMb ?? 0} / {activeEntitlement.maxKnowledgeMb} MB
          </div>
          <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Data export (JSON/CSV) always permitted
          </div>
        </div>
      </div>

      {/* Authoritative Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {plans.map((plan) => {
          const isCurrent = activeTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`p-6 rounded-xl flex flex-col justify-between border transition-colors ${
                isCurrent
                  ? 'border-2 border-[#10B981] bg-[#FFFEFC] dark:bg-[#2C2438]'
                  : 'border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] uppercase">
                    {isCurrent ? 'Current Active Plan' : `${plan.allowedAgentsCount} Agents · ${plan.maxMembers} Seats`}
                  </div>
                  <h3 className="font-bold text-lg mt-0.5">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="font-extrabold text-3xl">{formatPlanPrice(plan)}</span>
                  <span className="text-xs text-[#77717D] dark:text-[#AFA8B8]">/month</span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E2DBD0] dark:border-[#382F47]">
                  <div className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8] tabular-nums">
                    {plan.maxAiExecutionsPerMonth.toLocaleString()} AI tasks/mo · {plan.maxKnowledgeMb} MB storage
                  </div>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={isCurrent || isUpdating}
                onClick={() => handleSelectPlan(plan.tier)}
                className={`w-full mt-6 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#10B981]/15 text-[#10B981] cursor-default'
                    : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50'
                }`}
              >
                {isCurrent ? 'Active Plan' : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice Ledger */}
      <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8B5CF6]" />
          Billing & Sandbox Invoice History
        </h3>
        {invoices.length === 0 ? (
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
            No invoices recorded yet for this organization.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2DBD0] dark:border-[#382F47] text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8]">
                <tr>
                  <th className="py-2 pr-4">Invoice ID</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Gateway Ref</th>
                  <th className="py-2 text-right">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0]/60 dark:divide-[#382F47]">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 pr-4 font-mono">{inv.id}</td>
                    <td className="py-2.5 pr-4 uppercase font-mono">{inv.plan}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums">
                      {currency === 'PKR' ? `₨ ${inv.amountPkr.toLocaleString()}` : `$${inv.amountUsd.toLocaleString()}`}
                    </td>
                    <td className="py-2.5 pr-4 font-mono uppercase text-[#10B981]">{inv.status}</td>
                    <td className="py-2.5 pr-4 font-mono text-[#77717D] dark:text-[#AFA8B8]">
                      {inv.gatewayReference}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pakistan & Regional Payment Gateways */}
      <div className="p-6 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
        <div className="border-b border-[#E2DBD0] dark:border-[#382F47] pb-3">
          <div className="text-xs font-mono text-[#10B981]">SBP Regulated & Global MoR Options</div>
          <h3 className="font-bold text-lg mt-0.5">Pakistan Electronic Payment & Global Gateways</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Safepay', type: 'SBP PSP · PKR & USD', desc: 'Visa/Mastercard, 1Link, EasyPaisa, JazzCash, Raast QR.' },
            { name: 'PayFast by APPS', type: '1Link Direct · PKR', desc: 'UnionPay, PayPak, and 18+ Pakistani commercial banks.' },
            { name: 'SadaBiz (SadaPay)', type: 'SME Invoicing', desc: 'USD/GBP/EUR card links settled into PKR accounts.' },
            { name: 'LemonSqueezy', type: 'Global MoR · USD', desc: 'Merchant of Record handling global tax compliance.' },
          ].map((gw) => (
            <div
              key={gw.name}
              className="p-4 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-1.5"
            >
              <div className="font-bold text-sm">{gw.name}</div>
              <div className="text-[11px] font-mono text-[#8B5CF6]">{gw.type}</div>
              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{gw.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-[#FFF8E7] dark:bg-[#2A2315] border border-[#F3E2B8] dark:border-[#4D3F20] text-xs text-[#8A6A1C] dark:text-[#E8C56B] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Sandbox Billing Protection Active:</strong> Live payment charging is disabled in mode{' '}
            <code className="font-mono">[SANDBOX_PAYMENT_GATEWAY]</code> until production merchant keys are verified and approved.
          </span>
        </div>
      </div>
    </div>
  );
};
