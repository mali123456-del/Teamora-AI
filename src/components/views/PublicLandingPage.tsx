import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TeamoraWorkforceCanvas } from '../three/TeamoraWorkforceCanvas.tsx';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Cpu,
  Layers,
  ChevronRight,
  TrendingUp,
  Headset,
  Wallet,
  Zap,
} from 'lucide-react';

export const PublicLandingPage: React.FC = () => {
  const { setActiveTab, setSelectedAgentId, formatCurrency, currency, language } = useApp();
  const [selectedAgentPreview, setSelectedAgentPreview] = useState(TEAMORA_AGENTS[0]);

  const plans = [
    {
      name: 'Starter',
      priceUSD: 49,
      period: '/month',
      desc: 'Ideal for fast-moving startups and small teams automating operations.',
      features: [
        '5 AI Agents (Support, Sales, Email, Docs, Content)',
        'Up to 2,500 autonomous tasks / month',
        'Human-in-the-loop approvals gate',
        'Standard Google Search Grounding',
        'Email & community support',
      ],
      popular: false,
      cta: 'Start Starter Trial',
    },
    {
      name: 'Pro',
      priceUSD: 149,
      period: '/month',
      desc: 'The complete AI Workforce for scaling companies and mid-market teams.',
      features: [
        'All 15 Specialized AI Employees active',
        'Unlimited agent tasks & subtask delegation',
        'Orchestration Center with 3D Neural Core',
        'Deep reasoning with Gemini 4 Argon',
        'CRM, Invoicing, Inventory & Automation Studio',
        'Google Workspace & Google Keep integration',
        'Priority 24/7 dedicated assistance',
      ],
      popular: true,
      cta: 'Deploy Pro Workforce',
    },
    {
      name: 'Enterprise',
      priceUSD: 499,
      period: '/month',
      desc: 'Dedicated multi-tenant infrastructure with custom RBAC and SLAs.',
      features: [
        'Dedicated compute instance & custom model fine-tuning',
        'Unlimited organizations and team seats',
        'Zero-trust Firestore & audit log vault',
        'Custom webhook & ERP integration pipelines',
        '99.99% uptime SLA with dedicated architect',
      ],
      popular: false,
      cta: 'Contact Enterprise Sales',
    },
  ];

  const handleLaunchAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('agent-workspace');
  };

  return (
    <div className="w-full bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors overflow-hidden">
      {/* Hero Section with Interactive 3D Canvas */}
      <section className="relative min-h-[92vh] flex flex-col justify-between pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DBD0] dark:border-[#382F47]">
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#8B5CF6]/15 via-[#C7F36B]/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#C7F36B]" />
              <span className="text-xs font-semibold text-[#8B5CF6] dark:text-[#A78BFA] tracking-wide">
                TEAMORA AI 2.4 — Autonomous Workforce Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#211B2C] dark:text-[#F5F1E9]">
              Your AI Team. <br />
              <span className="text-[#8B5CF6] dark:text-[#A78BFA]">One Smart</span> Workspace.
            </h1>

            <p className="text-base sm:text-lg text-[#77717D] dark:text-[#AFA8B8] leading-relaxed">
              Empower your business with 15 specialized autonomous AI employees. From Customer Support and
              Sales to Finance, Inventory, and Deep Research — coordinated by an intelligent 3D neural
              orchestrator with human-in-the-loop safety.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3.5 rounded-xl bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] font-bold text-sm hover:opacity-90 shadow-lg cursor-pointer flex items-center gap-2 transition-transform hover:-translate-y-0.5"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('orchestrator')}
                className="px-6 py-3.5 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-[#211B2C] dark:text-[#F5F1E9] font-semibold text-sm hover:border-[#8B5CF6] cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Workflow className="w-4 h-4 text-[#8B5CF6]" />
                <span>Explore 3D Orchestrator</span>
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#E2DBD0] dark:border-[#382F47]">
              <div>
                <div className="font-heading font-extrabold text-xl text-[#211B2C] dark:text-[#F5F1E9]">
                  15 Agents
                </div>
                <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">Specialized Roles</div>
              </div>
              <div>
                <div className="font-heading font-extrabold text-xl text-[#8B5CF6]">Zero AI Slop</div>
                <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">Verified Outputs</div>
              </div>
              <div>
                <div className="font-heading font-extrabold text-xl text-[#10B981]">100% Safe</div>
                <div className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">Human Gate</div>
              </div>
            </div>
          </div>

          {/* Right: Embedded Interactive 3D Canvas */}
          <div className="lg:col-span-7 h-[460px] sm:h-[540px] rounded-2xl overflow-hidden border border-[#E2DBD0] dark:border-[#382F47] shadow-2xl relative bg-[#211B2C]">
            <TeamoraWorkforceCanvas
              onSelectAgent={(agentId) => {
                const found = TEAMORA_AGENTS.find((a) => a.id === agentId);
                if (found) setSelectedAgentPreview(found);
              }}
            />
          </div>
        </div>
      </section>

      {/* 15 Autonomous Agents Interactive Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Meet The Full Roster
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            15 Autonomous AI Employees, Ready On Day One
          </h2>
          <p className="text-sm sm:text-base text-[#77717D] dark:text-[#AFA8B8]">
            Not generic chatbots with different labels. Each employee has distinct permissions, allowed
            tools, human-approval thresholds, and dedicated workflows.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAMORA_AGENTS.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentPreview(agent)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedAgentPreview.id === agent.id
                  ? 'border-[#8B5CF6] bg-[#FFFEFC] dark:bg-[#2C2438] shadow-lg ring-1 ring-[#8B5CF6]'
                  : 'border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC]/70 dark:bg-[#211B2C] hover:border-[#8B5CF6]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                  >
                    {agent.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">{agent.name}</h3>
                    <div className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{agent.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBE5DB] dark:bg-[#382F47] text-[#211B2C] dark:text-[#F5F1E9] font-medium">
                  {agent.department}
                </span>
              </div>

              <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] line-clamp-2 mb-4 leading-relaxed">
                {agent.description}
              </p>

              <div className="space-y-1.5 pt-3 border-t border-[#E2DBD0] dark:border-[#382F47] text-[11px]">
                <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8]">
                  <span>Preferred Model:</span>
                  <span className="font-mono font-medium text-[#8B5CF6]">{agent.preferredModel}</span>
                </div>
                <div className="flex items-center justify-between text-[#77717D] dark:text-[#AFA8B8]">
                  <span>Success Rate:</span>
                  <span className="font-mono font-semibold text-[#10B981]">{agent.metrics[0].value}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchAgent(agent.id);
                }}
                className="w-full mt-4 py-2 px-3 rounded-lg bg-[#EBE5DB]/70 dark:bg-[#382F47] hover:bg-[#8B5CF6] hover:text-white text-xs font-semibold text-[#211B2C] dark:text-[#F5F1E9] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Launch Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Pricing Grid with live USD / PKR toggle */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#E2DBD0] dark:border-[#382F47] bg-[#EBE5DB]/40 dark:bg-[#1E1727]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#C7F36B]/25 text-[#162700] dark:text-[#C7F36B]">
              Transparent SaaS Plans
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Invest in Capacity, Not Per-Seat Penalties
            </h2>
            <p className="text-sm sm:text-base text-[#77717D] dark:text-[#AFA8B8]">
              Switch effortlessly between USD and PKR. Every tier includes multi-tenant organization
              isolation, audit trail preservation, and human-in-the-loop protection.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'border-2 border-[#8B5CF6] bg-[#FFFEFC] dark:bg-[#2C2438] shadow-2xl relative'
                    : 'border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C]'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#8B5CF6] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl text-[#211B2C] dark:text-[#F5F1E9]">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] mt-1">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-extrabold text-4xl sm:text-5xl text-[#211B2C] dark:text-[#F5F1E9]">
                      {formatCurrency(p.priceUSD)}
                    </span>
                    <span className="text-xs text-[#77717D] dark:text-[#AFA8B8] font-mono">{p.period}</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[#E2DBD0] dark:border-[#382F47]">
                    {p.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span className="text-[#211B2C] dark:text-[#F5F1E9]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`w-full mt-8 py-3.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    p.popular
                      ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-lg'
                      : 'bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] hover:opacity-90'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#77717D] dark:text-[#AFA8B8]">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-[#211B2C] dark:text-[#F5F1E9]">TEAMORA AI</span>
            <span>— Your AI Team. One Smart Workspace.</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('security')} className="hover:text-[#8B5CF6] cursor-pointer">
              Security Policy
            </button>
            <button onClick={() => setActiveTab('integrations')} className="hover:text-[#8B5CF6] cursor-pointer">
              Google Keep & Workspace
            </button>
            <button onClick={() => setActiveTab('dashboard')} className="hover:text-[#8B5CF6] cursor-pointer">
              Direct Workspace Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
