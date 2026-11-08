import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  Check,
} from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const { currentOrg, formatCurrency, currency } = useApp();

  const tiers = [
    {
      id: 'free',
      name: 'Free Community',
      priceUSD: 0,
      description: 'Explore autonomous AI workflows with core agent capabilities.',
      features: [
        '2 AI Agents (Support & Docs)',
        '300 autonomous tasks / month',
        'Standard execution speed',
        'Community forum support',
      ],
      current: currentOrg.plan === 'free',
    },
    {
      id: 'starter',
      name: 'Starter',
      priceUSD: 49,
      description: 'Perfect for small teams automating routine operations and inbox dispatch.',
      features: [
        '5 AI Agents (Support, Sales, Email, Docs, Content)',
        '2,500 autonomous tasks / month',
        'Human-in-the-loop approvals gate',
        'Google Search Grounding',
        'Email support',
      ],
      current: currentOrg.plan === 'starter',
    },
    {
      id: 'pro',
      name: 'Pro Workforce',
      priceUSD: 149,
      description: 'The complete AI Workforce with all 15 specialized agents and 3D Orchestrator.',
      features: [
        'All 15 Specialized AI Employees',
        'Unlimited agent tasks & subtasks',
        '3D Neural Workforce Orchestrator',
        'Gemini 4 Argon High-Thinking Mode',
        'CRM, Invoicing, Inventory & Automation Studio',
        'Google Workspace Keep Integration',
        '24/7 Priority Support',
      ],
      current: currentOrg.plan === 'pro',
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      priceUSD: 299,
      description: 'For growing enterprises requiring advanced multi-tenant RBAC and custom SLAs.',
      features: [
        'All 15 AI Employees + Dedicated capacity',
        'Multi-tenant team role governance (RBAC)',
        'Zero-trust Firestore & audit log vault',
        'Custom webhooks & ERP connectors',
        'Dedicated onboarding specialist',
      ],
      current: currentOrg.plan === 'business',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Dedicated',
      priceUSD: 499,
      description: 'Custom infrastructure, dedicated regional VPC, and 99.99% uptime guarantee.',
      features: [
        'Custom model fine-tuning & private embeddings',
        'Unlimited seats & organizations',
        'Direct VPC peering & private endpoints',
        'Custom legal agreements & BAA/DPA',
        'Dedicated Solutions Architect',
      ],
      current: currentOrg.plan === 'enterprise',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Plan Entitlements & Usage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Subscription & Capacity Management
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Current Organization: <strong className="text-[#8B5CF6]">{currentOrg.name}</strong> • Active Tier:{' '}
            <strong className="uppercase font-mono text-[#10B981]">{currentOrg.plan}</strong>
          </p>
        </div>
      </div>

      {/* Quota Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Agent Task Quota
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
            Unlimited
          </div>
          <p className="text-[11px] text-[#10B981] font-mono">Enterprise Tier Active</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            High-Thinking Quota (Gemini 4 Argon)
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#8B5CF6]">
            Active
          </div>
          <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
            ThinkingLevel.HIGH enabled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm space-y-2">
          <span className="text-xs font-mono uppercase text-[#77717D] dark:text-[#AFA8B8]">
            Google Search Grounding
          </span>
          <div className="font-heading font-extrabold text-2xl text-[#06B6D4]">
            Enabled
          </div>
          <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
            Real-time web citations active
          </p>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`p-6 rounded-2xl flex flex-col justify-between border transition-all ${
              t.current
                ? 'border-2 border-[#10B981] bg-[#FFFEFC] dark:bg-[#2C2438] shadow-xl relative'
                : t.popular
                ? 'border-2 border-[#8B5CF6] bg-[#FFFEFC] dark:bg-[#2C2438] shadow-md'
                : 'border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C]'
            }`}
          >
            {t.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#10B981] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Active Organization Plan
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-extrabold text-xl text-[#211B2C] dark:text-[#F5F1E9]">
                  {t.name}
                </h3>
                <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">{t.description}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#211B2C] dark:text-[#F5F1E9]">
                  {formatCurrency(t.priceUSD)}
                </span>
                <span className="text-xs text-[#77717D] dark:text-[#AFA8B8] font-mono">/month</span>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E2DBD0] dark:border-[#382F47]">
                {t.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="text-[#211B2C] dark:text-[#F5F1E9]">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={t.current}
              className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                t.current
                  ? 'bg-[#10B981]/20 text-[#10B981] cursor-default'
                  : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
              }`}
            >
              {t.current ? 'Current Plan' : `Upgrade to ${t.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
