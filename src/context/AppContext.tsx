import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organization,
  UserProfile,
  AgentTask,
  ApprovalRequest,
  Customer,
  ProductInventory,
  Order,
  Invoice,
  Expense,
  Project,
  DocumentItem,
  AutomationWorkflow,
  SecurityAuditLog,
  SupportedLanguage,
  CurrencyCode,
} from '../types/index.ts';
import { auth, loginWithGoogle, logoutUser } from '../lib/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Theme & Locale
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;

  // Auth & Org
  user: UserProfile | null;
  firebaseUser: User | null;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  currentOrg: Organization;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Domain State
  tasks: AgentTask[];
  addTask: (task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>) => AgentTask;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;
  
  approvals: ApprovalRequest[];
  resolveApproval: (id: string, decision: 'approved' | 'rejected', notes?: string) => void;

  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'orgId' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  inventory: ProductInventory[];
  updateStock: (id: string, delta: number) => void;

  orders: Order[];
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id' | 'orgId' | 'createdAt'>) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;

  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'orgId' | 'createdAt'>) => void;

  projects: Project[];
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'orgId' | 'uploadedAt'>) => void;

  workflows: AutomationWorkflow[];
  toggleWorkflowStatus: (id: string) => void;
  runWorkflowNow: (id: string) => void;

  auditLogs: SecurityAuditLog[];
  logAuditAction: (action: string, resource: string, status?: 'success' | 'warning' | 'blocked') => void;

  // Toast / System Banner
  bannerMessage: { title: string; type: 'success' | 'info' | 'warning' } | null;
  setBannerMessage: (msg: { title: string; type: 'success' | 'info' | 'warning' } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Seed Data
const DEFAULT_ORGS: Organization[] = [
  {
    id: 'org-apex',
    name: 'Apex Global Enterprises',
    slug: 'apex-global',
    plan: 'enterprise',
    ownerUid: 'user-demo',
    currency: 'USD',
    createdAt: '2026-01-15T08:00:00Z',
    membersCount: 24,
  },
  {
    id: 'org-crescent',
    name: 'Crescent Dynamics Pakistan',
    slug: 'crescent-dynamics',
    plan: 'pro',
    ownerUid: 'user-demo',
    currency: 'PKR',
    createdAt: '2026-02-01T10:30:00Z',
    membersCount: 12,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization>(DEFAULT_ORGS[0]);
  const [organizations] = useState<Organization[]>(DEFAULT_ORGS);
  const [bannerMessage, setBannerMessage] = useState<{ title: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Authenticated User Profile
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile>({
    uid: 'user-demo-sulaiman',
    email: 'm.sulaiman10thclass@gmail.com',
    displayName: 'Sulaiman Khan',
    role: 'owner',
    orgId: 'org-apex',
    language: 'en',
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || 'user@teamora.ai',
          displayName: fbUser.displayName || 'Authorized User',
          photoURL: fbUser.photoURL || undefined,
          role: 'owner',
          orgId: currentOrg.id,
          language,
        });
      }
    });
    return () => unsubscribe();
  }, [currentOrg.id, language]);

  // Synchronize HTML lang, dir, and dark class
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
  }, [language]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (lang === 'ur') {
      setCurrency('PKR');
    }
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'PKR') {
      // Currency conversion demonstration: roughly 280 PKR per USD
      const pkrAmount = currency === 'PKR' ? amount * 278 : amount;
      return new Intl.NumberFormat('ur-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
      }).format(pkrAmount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Google Sign-In Action
  const loginGoogle = async () => {
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        setBannerMessage({
          title: `Successfully signed in as ${fbUser.displayName || fbUser.email}`,
          type: 'success',
        });
        logAuditAction('USER_LOGIN_GOOGLE', `User ${fbUser.email} signed in via Firebase Auth`, 'success');
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setBannerMessage({
        title: 'Sign in failed. Using workspace authenticated session.',
        type: 'warning',
      });
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser({
      uid: 'user-guest',
      email: 'guest@teamora.ai',
      displayName: 'Guest Viewer',
      role: 'viewer',
      orgId: currentOrg.id,
      language: 'en',
    });
    setBannerMessage({
      title: 'Signed out of Firebase session',
      type: 'info',
    });
  };

  // 1. Initial Tasks Seed Data
  const [tasks, setTasks] = useState<AgentTask[]>([
    {
      id: 'task-101',
      orgId: 'org-apex',
      agentId: 'workforce-manager',
      agentName: 'Atlas',
      title: 'Q3 Enterprise Product Launch Orchestration',
      prompt: 'Coordinate launch steps across Marketing, Content, and Support teams with milestones.',
      status: 'completed',
      priority: 'high',
      result: `### Q3 Launch Roadmap Approved\n- **Marketing (Pulse):** 4-week ad campaign and landing page live.\n- **Content (Quill):** Release notes and press brief finalized.\n- **Support (Echo):** Help center FAQs updated and 24/7 coverage active.`,
      createdBy: 'Sulaiman Khan',
      createdAt: '2026-11-07T12:00:00Z',
      updatedAt: '2026-11-07T12:04:12Z',
      duration: '4.2s',
      modelUsed: 'gemini-4-argon',
    },
    {
      id: 'task-102',
      orgId: 'org-apex',
      agentId: 'research-agent',
      agentName: 'Scout',
      title: 'Competitive Market Benchmark: AI Agent Platforms',
      prompt: 'Synthesize market benchmarks using live Google Search Grounding for enterprise autonomous agents.',
      status: 'completed',
      priority: 'medium',
      result: `### Market Intelligence Summary\n- High enterprise demand for human-in-the-loop approval gates.\n- Autonomous agents resolving 85%+ tier-1 tickets.\n- Multilingual localized support is top differentiator in MENA and South Asia.`,
      groundingChunks: [
        { web: { uri: 'https://cloud.google.com/products/ai', title: 'Google Cloud AI & Gemini Workspaces' } },
        { web: { uri: 'https://www.gartner.com/en/information-technology/research', title: 'Gartner Autonomous Workforce Trends' } },
      ],
      createdBy: 'Sulaiman Khan',
      createdAt: '2026-11-07T14:20:00Z',
      updatedAt: '2026-11-07T14:22:15Z',
      duration: '2.1s',
      modelUsed: 'gemini-3.8-flash (Search Grounded)',
    },
    {
      id: 'task-103',
      orgId: 'org-apex',
      agentId: 'finance-agent',
      agentName: 'Ledger',
      title: 'Q2 Tax & SaaS Vendor Expense Audit',
      prompt: 'Audit cloud infrastructure expenses and flag duplications over $500.',
      status: 'needs_approval',
      priority: 'urgent',
      requiresApproval: true,
      approvalId: 'appr-301',
      createdBy: 'Sulaiman Khan',
      createdAt: '2026-11-07T17:15:00Z',
      updatedAt: '2026-11-07T17:15:02Z',
      modelUsed: 'gemini-4-argon',
    },
  ]);

  // 2. Approvals Seed Data (Human-in-the-Loop Safe Execution Center)
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    {
      id: 'appr-301',
      orgId: 'org-apex',
      agentId: 'finance-agent',
      agentName: 'Ledger',
      actionType: 'payout',
      title: 'Disburse $4,200 Vendor Invoice to ServerHub Cloud',
      description: 'Ledger has verified invoice #SH-9082 against monthly Cloud compute logs. Requires human sign-off before electronic transfer.',
      consequences: 'Funds will be transferred immediately via ACH. Irreversible debit from operational treasury.',
      payloadSummary: {
        vendor: 'ServerHub Cloud Services',
        invoiceNumber: 'SH-9082',
        amount: 4200,
        currency: 'USD',
        dueDate: '2026-11-15',
      },
      status: 'pending',
      createdAt: '2026-11-07T17:15:00Z',
    },
    {
      id: 'appr-302',
      orgId: 'org-apex',
      agentId: 'email-agent',
      agentName: 'Courier',
      actionType: 'email_send',
      title: 'Send Enterprise Contract Counter-Offer to GlobalTech Corp',
      description: 'Courier prepared customized counter-proposal with 12% discount and annual prepayment terms.',
      consequences: 'An external email will be dispatched to CEO & Legal Counsel of GlobalTech Corp.',
      payloadSummary: {
        recipient: 'r.vance@globaltech.com',
        subject: 'TEAMORA AI Enterprise Agreement - Custom Term Revision',
        contractValue: 48000,
      },
      status: 'pending',
      createdAt: '2026-11-07T18:05:00Z',
    },
  ]);

  // 3. CRM Customers & Leads Seed Data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'cust-1',
      orgId: 'org-apex',
      name: 'Sarah Chen',
      email: 'sarah.chen@novatech.io',
      company: 'NovaTech Solutions',
      status: 'customer',
      value: 36000,
      currency: 'USD',
      phone: '+1 (555) 234-5678',
      notes: 'Signed 3-year Pro contract with 15 agents enabled.',
      assignedAgent: 'Vanguard',
      createdAt: '2026-02-10T09:00:00Z',
    },
    {
      id: 'cust-2',
      orgId: 'org-apex',
      name: 'Tariq Mansoor',
      email: 'tariq@induslogistics.pk',
      company: 'Indus Logistics Hub',
      status: 'prospect',
      value: 24000,
      currency: 'PKR',
      phone: '+92 300 8472910',
      notes: 'Evaluating Inventory & Operations agents for warehouse routing.',
      assignedAgent: 'Stockwell',
      createdAt: '2026-03-01T11:15:00Z',
    },
    {
      id: 'cust-3',
      orgId: 'org-apex',
      name: 'Elena Rostova',
      email: 'elena@heliosenergy.com',
      company: 'Helios Clean Energy',
      status: 'lead',
      value: 52000,
      currency: 'USD',
      phone: '+1 (555) 987-6543',
      notes: 'Inbound demo request from webinar on Autonomous Finance.',
      assignedAgent: 'Vanguard',
      createdAt: '2026-03-04T15:30:00Z',
    },
  ]);

  // 4. Products & Inventory
  const [inventory, setInventory] = useState<ProductInventory[]>([
    {
      id: 'inv-1',
      orgId: 'org-apex',
      sku: 'SKU-NEO-01',
      name: 'Neural Edge Sensor Gateway',
      category: 'Hardware',
      stockQuantity: 420,
      minThreshold: 100,
      unitPrice: 280,
      currency: 'USD',
      supplier: 'Apex Microelectronics',
      status: 'in_stock',
    },
    {
      id: 'inv-2',
      orgId: 'org-apex',
      sku: 'SKU-IOT-08',
      name: 'Smart Telemetry Beacon',
      category: 'Sensors',
      stockQuantity: 28,
      minThreshold: 50,
      unitPrice: 65,
      currency: 'USD',
      supplier: 'Indus Components Ltd',
      status: 'low_stock',
    },
    {
      id: 'inv-3',
      orgId: 'org-apex',
      sku: 'SKU-MOD-44',
      name: 'Enterprise AI Compute Unit',
      category: 'Servers',
      stockQuantity: 0,
      minThreshold: 10,
      unitPrice: 1850,
      currency: 'USD',
      supplier: 'ServerTech Asia',
      status: 'out_of_stock',
    },
  ]);

  // 5. Orders & Invoices
  const [orders] = useState<Order[]>([
    {
      id: 'ord-1001',
      orgId: 'org-apex',
      orderNumber: 'ORD-9801',
      customerId: 'cust-1',
      customerName: 'NovaTech Solutions',
      items: [
        { name: 'Neural Edge Sensor Gateway', quantity: 20, price: 280 },
        { name: 'Annual Pro Workforce Tier', quantity: 1, price: 12000 },
      ],
      total: 17600,
      currency: 'USD',
      status: 'completed',
      createdAt: '2026-03-02T10:00:00Z',
    },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-801',
      orgId: 'org-apex',
      invoiceNumber: 'INV-2026-041',
      customerId: 'cust-1',
      customerName: 'NovaTech Solutions',
      amount: 17600,
      currency: 'USD',
      status: 'paid',
      dueDate: '2026-03-20',
      createdAt: '2026-03-02T10:05:00Z',
    },
    {
      id: 'inv-802',
      orgId: 'org-apex',
      invoiceNumber: 'INV-2026-042',
      customerId: 'cust-2',
      customerName: 'Indus Logistics Hub',
      amount: 4800,
      currency: 'USD',
      status: 'sent',
      dueDate: '2026-03-25',
      createdAt: '2026-03-05T14:20:00Z',
    },
  ]);

  // 6. Expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 'exp-501',
      orgId: 'org-apex',
      category: 'infrastructure',
      description: 'Cloud GPU Inference Clusters (asia-southeast1)',
      amount: 3240,
      currency: 'USD',
      status: 'approved',
      submittedBy: 'Ledger (Auto-Reconciled)',
      createdAt: '2026-03-01T08:00:00Z',
    },
    {
      id: 'exp-502',
      orgId: 'org-apex',
      category: 'marketing',
      description: 'Global SaaS Product Launch Sponsorship',
      amount: 2500,
      currency: 'USD',
      status: 'approved',
      submittedBy: 'Pulse (Marketing Lead)',
      createdAt: '2026-03-03T16:00:00Z',
    },
  ]);

  // 7. Projects
  const [projects] = useState<Project[]>([
    {
      id: 'proj-1',
      orgId: 'org-apex',
      title: 'Autonomous Omnichannel Customer Experience',
      description: 'Deploy Echo & Courier to automate 90% of routine client interactions with sentiment intelligence.',
      status: 'active',
      progress: 78,
      deadline: '2026-04-15',
      tasksCount: 18,
      completedTasksCount: 14,
      leadAgentId: 'support-agent',
    },
    {
      id: 'proj-2',
      orgId: 'org-apex',
      title: 'South Asia & Middle East Market Expansion',
      description: 'Deep market analysis, localization in Urdu & Arabic, and regional billing enablement.',
      status: 'active',
      progress: 45,
      deadline: '2026-05-30',
      tasksCount: 22,
      completedTasksCount: 10,
      leadAgentId: 'research-agent',
    },
  ]);

  // 8. Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      orgId: 'org-apex',
      name: 'Teamora_Enterprise_SLA_Master.pdf',
      size: '1.4 MB',
      type: 'pdf',
      category: 'contracts',
      status: 'indexed',
      uploadedAt: '2026-02-14T09:00:00Z',
      tags: ['SLA', 'Legal', 'Enterprise'],
      summary: 'Outlines 99.9% uptime guarantee, incident response tiers, and liability caps for multi-agent workflows.',
    },
    {
      id: 'doc-2',
      orgId: 'org-apex',
      name: 'Standard_Operating_Procedure_Refunds.docx',
      size: '640 KB',
      type: 'docx',
      category: 'sop',
      status: 'indexed',
      uploadedAt: '2026-02-20T11:30:00Z',
      tags: ['SOP', 'Finance', 'Echo'],
      summary: 'Rules governing automated customer refunds under $50 and managerial approvals for higher limits.',
    },
  ]);

  // 9. Workflows
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: 'wf-1',
      orgId: 'org-apex',
      name: 'High-Value Lead Escalation & Proposal Draft',
      description: 'When new lead enters CRM with estimated value > $10,000, assign Vanguard to draft custom proposal and notify Slack.',
      trigger: 'New CRM Lead Value > $10k',
      status: 'active',
      stepsCount: 4,
      executionsCount: 38,
      lastRunAt: '2026-11-07T16:20:00Z',
      requiresApproval: true,
    },
    {
      id: 'wf-2',
      orgId: 'org-apex',
      name: 'Autonomous Low-Stock Reorder Gate',
      description: 'When inventory drops below safety threshold, trigger Stockwell to create purchase order and request Ledger review.',
      trigger: 'Inventory Quantity < Minimum Threshold',
      status: 'active',
      stepsCount: 3,
      executionsCount: 12,
      lastRunAt: '2026-11-06T19:40:00Z',
      requiresApproval: true,
    },
  ]);

  // 10. Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([
    {
      id: 'log-1',
      orgId: 'org-apex',
      action: 'FIREBASE_AUTH_VERIFY',
      actor: 'm.sulaiman10thclass@gmail.com',
      resource: 'Firebase Authentication & Cloud Firestore',
      ipAddress: '192.168.1.1',
      status: 'success',
      timestamp: '2026-11-07T18:42:25Z',
    },
    {
      id: 'log-2',
      orgId: 'org-apex',
      action: 'APPROVAL_GATE_ENFORCED',
      actor: 'Finance Agent (Ledger)',
      resource: 'Disbursement > $1,000 Action',
      ipAddress: 'Internal Agent Engine',
      status: 'warning',
      timestamp: '2026-11-07T17:15:00Z',
    },
  ]);

  const logAuditAction = (action: string, resource: string, status: 'success' | 'warning' | 'blocked' = 'success') => {
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}`,
      orgId: currentOrg.id,
      action,
      actor: user?.email || 'System Agent',
      resource,
      ipAddress: 'Workspace Client',
      status,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper Actions
  const addTask = (taskData: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>) => {
    const newTask: AgentTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    logAuditAction('AGENT_TASK_CREATE', `Agent ${taskData.agentName}: ${taskData.title}`, 'success');
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<AgentTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const resolveApproval = (id: string, decision: 'approved' | 'rejected', notes?: string) => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: decision,
              decidedBy: user?.displayName || user?.email,
              decidedAt: new Date().toISOString(),
            }
          : a
      )
    );

    // If approved, trigger celebratory confetti!
    if (decision === 'approved') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#C7F36B', '#FF806E'],
      });
    }

    // Update related task if any
    setTasks((prev) =>
      prev.map((t) =>
        t.approvalId === id
          ? {
              ...t,
              status: decision === 'approved' ? 'completed' : 'failed',
              result:
                decision === 'approved'
                  ? `[Approved by ${user?.displayName || 'Human Manager'}] Action executed successfully. Verified audit recorded.`
                  : `[Rejected by ${user?.displayName || 'Human Manager'}] Operation aborted. Reason: ${notes || 'Managerial discretion'}.`,
            }
          : t
      )
    );

    setBannerMessage({
      title: `Approval Request ${decision.toUpperCase()}: ${target.title}`,
      type: decision === 'approved' ? 'success' : 'info',
    });

    logAuditAction(
      `APPROVAL_${decision.toUpperCase()}`,
      `Approval #${id} (${target.title}) decided by ${user?.email}`,
      decision === 'approved' ? 'success' : 'warning'
    );
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'orgId' | 'createdAt'>) => {
    const newCust: Customer = {
      ...c,
      id: `cust-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAuditAction('CRM_CUSTOMER_ADD', `${newCust.name} (${newCust.company})`, 'success');
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAuditAction('CRM_CUSTOMER_DELETE', `Customer ID: ${id}`, 'warning');
  };

  const updateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.stockQuantity + delta);
        const newStatus =
          newQty === 0 ? 'out_of_stock' : newQty <= item.minThreshold ? 'low_stock' : 'in_stock';
        return { ...item, stockQuantity: newQty, status: newStatus };
      })
    );
  };

  const addInvoice = (inv: Omit<Invoice, 'id' | 'orgId' | 'createdAt'>) => {
    const newInv: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInv, ...prev]);
    logAuditAction('INVOICE_CREATE', `${newInv.invoiceNumber} for ${newInv.customerName}`, 'success');
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
  };

  const addExpense = (exp: Omit<Expense, 'id' | 'orgId' | 'createdAt'>) => {
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const addDocument = (doc: Omit<DocumentItem, 'id' | 'orgId' | 'uploadedAt'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      orgId: currentOrg.id,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    logAuditAction('DOCUMENT_UPLOAD', `${newDoc.name} (${newDoc.category})`, 'success');
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
      )
    );
  };

  const runWorkflowNow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              executionsCount: w.executionsCount + 1,
              lastRunAt: new Date().toISOString(),
            }
          : w
      )
    );
    setBannerMessage({
      title: 'Workflow triggered successfully. Executing across interconnected agents.',
      type: 'success',
    });
    logAuditAction('WORKFLOW_RUN_MANUAL', `Workflow ID: ${id}`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        language,
        setLanguage,
        currency,
        setCurrency,
        formatCurrency,
        user,
        firebaseUser,
        loginGoogle,
        logout,
        currentOrg,
        organizations,
        setCurrentOrg,
        activeTab,
        setActiveTab,
        selectedAgentId,
        setSelectedAgentId,
        tasks,
        addTask,
        updateTask,
        approvals,
        resolveApproval,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        inventory,
        updateStock,
        orders,
        invoices,
        addInvoice,
        updateInvoiceStatus,
        expenses,
        addExpense,
        projects,
        documents,
        addDocument,
        workflows,
        toggleWorkflowStatus,
        runWorkflowNow,
        auditLogs,
        logAuditAction,
        bannerMessage,
        setBannerMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
