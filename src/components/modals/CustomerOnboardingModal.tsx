import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface CustomerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 7;

export const CustomerOnboardingModal: React.FC<CustomerOnboardingModalProps> = ({ isOpen, onClose }) => {
  const {
    currentOrg,
    language,
    setLanguage,
    currency,
    setCurrency,
    addDocument,
    addTask,
    setActiveTab,
    setBannerMessage,
  } = useApp();

  const storageKey = `teamora_onboarding_step_${currentOrg.id}`;
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? Number(saved) : 1;
      return parsed >= 1 && parsed <= TOTAL_STEPS ? parsed : 1;
    } catch {
      return 1;
    }
  });

  const [industry, setIndustry] = useState('SaaS & Digital Services');
  const [firstTaskTitle, setFirstTaskTitle] = useState('Summarize weekly operational KPIs and pending risks');
  const [knowledgeNote, setKnowledgeNote] = useState(
    'Standard refund approvals above $50 require Manager or Admin sign-off in Approvals Gate.'
  );
  const [taskDispatched, setTaskDispatched] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(step));
    } catch {
      // Ignore storage failures
    }
  }, [step, storageKey]);

  if (!isOpen) return null;

  const handleLaunchFirstTask = () => {
    addDocument({
      name: 'Onboarding_Policy_Guide.txt',
      size: '2 KB',
      type: 'txt',
      category: 'sop',
      status: 'indexed',
      tags: ['Onboarding', 'Governance'],
      summary: knowledgeNote,
    });
    addTask({
      agentId: 'workforce-manager',
      agentName: 'Atlas',
      title: firstTaskTitle,
      prompt: `${firstTaskTitle}\nIndustry Context: ${industry}`,
      status: 'queued',
      priority: 'medium',
      createdBy: 'Onboarding Setup',
      modelUsed: 'gemini-3.8-flash',
    });
    setTaskDispatched(true);
    setBannerMessage({
      title: 'Onboarding starter policy & first Atlas task created.',
      type: 'success',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-[#211B2C] dark:text-[#F5F1E9]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-3">
          <div>
            <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
              Workspace Setup · Step {step} of {TOTAL_STEPS} · Progress auto-saved
            </p>
            <h2 id="onboarding-title" className="text-lg font-extrabold mt-0.5">
              {currentOrg.name} Onboarding Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close onboarding wizard"
            className="p-1.5 rounded-lg text-[#77717D] hover:bg-[#EBE5DB] dark:hover:bg-[#2C2438] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="min-h-[180px] space-y-3 text-xs">
          {step === 1 && (
            <>
              <h3 className="text-sm font-bold">1. Language & Regional Currency</h3>
              <p className="text-[#77717D] dark:text-[#AFA8B8]">
                Select your workspace display direction (English LTR or اردو RTL) and billing currency.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    language === 'en' ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 font-bold' : 'border-[#E2DBD0] dark:border-[#382F47]'
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  onClick={() => setLanguage('ur')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    language === 'ur' ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 font-bold' : 'border-[#E2DBD0] dark:border-[#382F47]'
                  }`}
                >
                  اردو (RTL Layout)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    currency === 'USD' ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 font-bold' : 'border-[#E2DBD0] dark:border-[#382F47]'
                  }`}
                >
                  USD ($) Global
                </button>
                <button
                  onClick={() => setCurrency('PKR')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    currency === 'PKR' ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 font-bold' : 'border-[#E2DBD0] dark:border-[#382F47]'
                  }`}
                >
                  PKR (₨) Pakistan
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-sm font-bold">2. Organization & Industry Profile</h3>
              <p className="text-[#77717D] dark:text-[#AFA8B8]">
                Active tenant <span className="font-mono font-semibold">{currentOrg.id}</span> keeps all CRM, tasks, and documents strictly isolated.
              </p>
              <label className="block font-semibold pt-2">Primary Business Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
              />
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-sm font-bold">3. Team Roles & Approval Governance</h3>
              <p className="text-[#77717D] dark:text-[#AFA8B8]">
                Assign Owner, Admin, Manager, Member, or Viewer seats under Team & Permissions. High-impact actions (payouts, external emails, contracts) always pause in the Approvals Gate.
              </p>
              <button
                onClick={() => {
                  setActiveTab('team');
                  onClose();
                }}
                className="mt-2 px-3 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] font-semibold text-[#8B5CF6] cursor-pointer"
              >
                Open Team & Permissions
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-sm font-bold">4. Meet Your 15 Canonical AI Employees</h3>
              <ul className="space-y-1.5 text-[#77717D] dark:text-[#AFA8B8] list-disc pl-4">
                <li><strong>Atlas</strong> — Workforce Orchestrator decomposing multi-department plans</li>
                <li><strong>Echo</strong> — Customer Support Lead with sentiment & ticket workflows</li>
                <li><strong>Ledger</strong> — Finance & Compliance Specialist with treasury checks</li>
                <li><strong>Scout</strong> — Market Intelligence Researcher with Search Grounding</li>
              </ul>
            </>
          )}

          {step === 5 && (
            <>
              <h3 className="text-sm font-bold">5. Seed Your Knowledge Hub</h3>
              <p className="text-[#77717D] dark:text-[#AFA8B8]">
                Add an initial operating rule to your tenant Knowledge Hub:
              </p>
              <textarea
                rows={3}
                value={knowledgeNote}
                onChange={(e) => setKnowledgeNote(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
              />
            </>
          )}

          {step === 6 && (
            <>
              <h3 className="text-sm font-bold">6. Launch Your First Orchestrator Task</h3>
              <input
                type="text"
                value={firstTaskTitle}
                onChange={(e) => setFirstTaskTitle(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]"
              />
              <button
                onClick={handleLaunchFirstTask}
                disabled={taskDispatched}
                className="mt-2 px-4 py-2 rounded-lg bg-[#8B5CF6] text-white font-semibold cursor-pointer disabled:opacity-60"
              >
                {taskDispatched ? 'Starter Policy & Task Created' : 'Create Starter Policy & Task'}
              </button>
            </>
          )}

          {step === 7 && (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Workspace Onboarding Ready</span>
              </div>
              <p className="text-[#77717D] dark:text-[#AFA8B8]">
                You can reopen this guide anytime from the header or Help & Support center.
              </p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2DBD0] dark:border-[#382F47]">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E2DBD0] dark:border-[#382F47] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#8B5CF6] text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#10B981] text-white cursor-pointer"
            >
              Finish Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
