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
import {
  getStoredTenantData,
  setStoredTenantData,
  persistTask,
  persistApproval,
  persistCustomer,
  deleteCustomerFromDb,
  persistInventoryItem,
  persistInvoice,
  persistExpense,
  persistProject,
  persistDocument,
  persistWorkflow,
  persistAuditLog,
  testFirestoreConnection,
  createNewOrganization,
  ensureOrganizationSynced,
} from '../lib/firestoreService.ts';
import { notificationService } from '../lib/notificationService.ts';

interface AppContextType {
  // Theme & Locale
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;

  // Auth & Org State
  isAuthReady: boolean;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  user: UserProfile | null;
  firebaseUser: User | null;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  currentOrg: Organization;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  createOrganization: (name: string, plan: Organization['plan'], currency: CurrencyCode) => Promise<void>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;

  // Domain State & Persistence
  tasks: AgentTask[];
  addTask: (task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>) => AgentTask;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;

  approvals: ApprovalRequest[];
  resolveApproval: (id: string, decision: 'approved' | 'rejected', notes?: string) => Promise<void>;
  executeApproval: (id: string) => Promise<{ success: boolean; result: string }>;

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

  // System Notification Toast
  bannerMessage: { title: string; type: 'success' | 'info' | 'warning' } | null;
  setBannerMessage: (msg: { title: string; type: 'success' | 'info' | 'warning' } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Clean Seed Data for New Tenants
const DEFAULT_ORGS: Organization[] = [
  {
    id: 'org-apex',
    name: 'Apex Global Enterprises',
    slug: 'apex-global',
    plan: 'enterprise',
    ownerUid: 'user-demo-sulaiman',
    currency: 'USD',
    createdAt: '2026-01-15T08:00:00Z',
    membersCount: 24,
  },
  {
    id: 'org-crescent',
    name: 'Crescent Dynamics Pakistan',
    slug: 'crescent-dynamics',
    plan: 'pro',
    ownerUid: 'user-demo-sulaiman',
    currency: 'PKR',
    createdAt: '2026-02-01T10:30:00Z',
    membersCount: 12,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getStoredTenantData('dark_mode', false));
  const [language, setLanguageState] = useState<SupportedLanguage>(() => getStoredTenantData('language', 'en'));
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => getStoredTenantData('currency', 'USD'));
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => getStoredTenantData('demo_mode', false));

  // Multi-Tenant Organizations
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    getStoredTenantData('organizations', DEFAULT_ORGS)
  );
  const [currentOrg, setCurrentOrgState] = useState<Organization>(() => {
    const stored = getStoredTenantData<Organization | null>('current_org', null);
    return stored || organizations[0];
  });

  // User Profile
  const [user, setUser] = useState<UserProfile | null>(() => {
    const isDemo = getStoredTenantData('demo_mode', false);
    if (isDemo) {
      return {
        uid: 'user-demo-sulaiman',
        email: 'm.sulaiman10thclass@gmail.com',
        displayName: 'Sulaiman Khan (Demo Sandbox)',
        role: 'owner',
        orgId: 'org-apex',
        language: 'en',
      };
    }
    return null;
  });

  const [bannerMessage, setBannerMessage] = useState<{ title: string; type: 'success' | 'info' | 'warning' } | null>(
    null
  );

  // Domain Collections with Refresh-Safe Persistence
  const [tasks, setTasks] = useState<AgentTask[]>(() =>
    getStoredTenantData('tasks', [
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
        modelUsed: 'gemini-3.8-flash',
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
        modelUsed: 'gemini-3.8-flash',
      },
    ])
  );

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() =>
    getStoredTenantData('approvals', [
      {
        id: 'appr-301',
        orgId: 'org-apex',
        agentId: 'finance-agent',
        agentName: 'Ledger',
        actionType: 'payout',
        title: 'Disburse $4,200 Vendor Invoice to ServerHub Cloud',
        description:
          'Ledger has verified invoice #SH-9082 against monthly Cloud compute logs. Requires human sign-off before electronic transfer.',
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
    ])
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    getStoredTenantData('customers', [
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
    ])
  );

  const [inventory, setInventory] = useState<ProductInventory[]>(() =>
    getStoredTenantData('inventory', [
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
    ])
  );

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

  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getStoredTenantData('invoices', [
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
    ])
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    getStoredTenantData('expenses', [
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
    ])
  );

  const [projects] = useState<Project[]>(() =>
    getStoredTenantData('projects', [
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
    ])
  );

  const [documents, setDocuments] = useState<DocumentItem[]>(() =>
    getStoredTenantData('documents', [
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
    ])
  );

  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(() =>
    getStoredTenantData('workflows', [
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
    ])
  );

  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() =>
    getStoredTenantData('audit_logs', [
      {
        id: 'log-1',
        orgId: 'org-apex',
        action: 'SECURITY_AUDIT_INITIALIZED',
        actor: 'Security Kernel',
        resource: 'Centralized RBAC & Zero-Trust Gateways',
        ipAddress: '127.0.0.1',
        status: 'success',
        timestamp: '2026-11-07T19:00:00Z',
      },
    ])
  );

  // Sync to local tenant storage on mutations for resilience
  useEffect(() => {
    setStoredTenantData('tasks', tasks);
  }, [tasks]);
  useEffect(() => {
    setStoredTenantData('approvals', approvals);
  }, [approvals]);
  useEffect(() => {
    setStoredTenantData('customers', customers);
  }, [customers]);
  useEffect(() => {
    setStoredTenantData('inventory', inventory);
  }, [inventory]);
  useEffect(() => {
    setStoredTenantData('invoices', invoices);
  }, [invoices]);
  useEffect(() => {
    setStoredTenantData('expenses', expenses);
  }, [expenses]);
  useEffect(() => {
    setStoredTenantData('documents', documents);
  }, [documents]);
  useEffect(() => {
    setStoredTenantData('workflows', workflows);
  }, [workflows]);
  useEffect(() => {
    setStoredTenantData('audit_logs', auditLogs);
  }, [auditLogs]);
  useEffect(() => {
    setStoredTenantData('organizations', organizations);
  }, [organizations]);
  useEffect(() => {
    setStoredTenantData('current_org', currentOrg);
  }, [currentOrg]);
  useEffect(() => {
    setStoredTenantData('demo_mode', isDemoMode);
  }, [isDemoMode]);

  // Boot connection check
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthReady(true);

      if (fbUser) {
        // Real authenticated user session
        setIsDemoMode(false);
        const isOwner = currentOrg.ownerUid === fbUser.uid || currentOrg.ownerUid === 'user-demo-sulaiman';
        if (currentOrg.ownerUid === 'user-demo-sulaiman') {
          setCurrentOrgState((prev) => ({ ...prev, ownerUid: fbUser.uid }));
        }
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || 'user@teamora.ai',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Teamora Member',
          photoURL: fbUser.photoURL || undefined,
          role: isOwner ? 'owner' : 'admin',
          orgId: currentOrg.id,
          language,
        });
        ensureOrganizationSynced(currentOrg, {
          uid: fbUser.uid,
          email: fbUser.email || 'user@teamora.ai',
        }).catch((err) => console.warn('Sync org failed:', err));
      } else {
        // If not logged in and not explicitly demo mode, user is unauthenticated
        if (!isDemoMode) {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, [currentOrg.id, currentOrg.ownerUid, language, isDemoMode]);

  // Synchronize Theme & Locale
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setStoredTenantData('dark_mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    setStoredTenantData('language', language);
  }, [language]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (lang === 'ur') {
      setCurrencyState('PKR');
    }
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    setStoredTenantData('currency', c);
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'PKR') {
      const pkrAmount = currentOrg.currency === 'USD' ? amount * 278 : amount;
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

  // Switch / Toggle Demo Sandbox Mode
  const toggleDemoMode = () => {
    if (firebaseUser) {
      setBannerMessage({
        title: 'You are signed in with a verified account. Sign out first to enter Demo Sandbox.',
        type: 'info',
      });
      return;
    }
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    if (nextMode) {
      setUser({
        uid: 'user-demo-sulaiman',
        email: 'm.sulaiman10thclass@gmail.com',
        displayName: 'Sulaiman Khan (Demo Sandbox)',
        role: 'owner',
        orgId: 'org-apex',
        language: 'en',
      });
      setBannerMessage({
        title: 'Demo Sandbox enabled. Data changes are kept in isolated local state.',
        type: 'info',
      });
    } else {
      setUser(null);
      setBannerMessage({
        title: 'Exited Demo Sandbox. Please sign in with Google to access your cloud workspace.',
        type: 'info',
      });
    }
  };

  // Google Sign-In Action
  const loginGoogle = async () => {
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        setIsDemoMode(false);
        setBannerMessage({
          title: `Signed in as ${fbUser.displayName || fbUser.email}`,
          type: 'success',
        });
        logAuditAction('USER_LOGIN_GOOGLE', `User ${fbUser.email} authenticated via Firebase`, 'success');
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setBannerMessage({
        title: 'Sign in failed or cancelled. Try again.',
        type: 'warning',
      });
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsDemoMode(false);
    setBannerMessage({
      title: 'Signed out of Teamora workspace',
      type: 'info',
    });
  };

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    setCurrencyState(org.currency);
    setBannerMessage({
      title: `Switched workspace to ${org.name}`,
      type: 'info',
    });
    logAuditAction('ORG_SWITCH', `Active organization changed to ${org.name} (${org.id})`, 'success');
  };

  const createOrganization = async (name: string, plan: Organization['plan'], orgCurrency: CurrencyCode) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      slug,
      plan,
      ownerUid: user?.uid || 'user-anonymous',
      currency: orgCurrency,
      createdAt: new Date().toISOString(),
      membersCount: 1,
    };

    setOrganizations((prev) => [newOrg, ...prev]);
    setCurrentOrgState(newOrg);
    setCurrencyState(orgCurrency);

    if (firebaseUser) {
      await createNewOrganization(newOrg, firebaseUser.uid).catch((err) =>
        console.warn('Could not persist new org to Firestore:', err)
      );
    }

    setBannerMessage({
      title: `Created new organization: ${name}`,
      type: 'success',
    });
    logAuditAction('ORG_CREATE', `Created workspace: ${name} (${newOrg.id})`, 'success');
  };

  const logAuditAction = (action: string, resource: string, status: 'success' | 'warning' | 'blocked' = 'success') => {
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orgId: currentOrg.id,
      action,
      actor: user?.email || 'Anonymous',
      resource,
      ipAddress: 'Client Session',
      status,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    persistAuditLog(currentOrg.id, newLog).catch(() => {});
  };

  // Domain Actions with Real Persistence
  const addTask = (taskData: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>) => {
    const newTask: AgentTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    persistTask(currentOrg.id, newTask).catch(() => {});
    logAuditAction('AGENT_TASK_CREATE', `Agent ${taskData.agentName}: ${taskData.title}`, 'success');

    // Dispatch real-time notification
    if (newTask.requiresApproval || newTask.status === 'needs_approval') {
      notificationService.dispatchNotification({
        orgId: currentOrg.id,
        eventId: `evt-appr-req-${newTask.id}`,
        type: 'agent_approval_needed',
        title: `Approval Required: ${newTask.title}`,
        message: `Agent ${newTask.agentName} drafted an action requiring executive authorization.`,
        priority: 'urgent',
        entityType: 'approval',
        actionUrl: 'approvals',
        entityId: newTask.approvalId,
      });
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<AgentTask>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
          persistTask(currentOrg.id, updated).catch(() => {});

          // Dispatch status transition alerts
          if (updates.status === 'completed' && t.status !== 'completed') {
            notificationService.dispatchNotification({
              orgId: currentOrg.id,
              eventId: `evt-task-done-${id}`,
              type: 'task_completed',
              title: `Task Completed: ${updated.title}`,
              message: `Agent ${updated.agentName} finished execution successfully.`,
              priority: 'medium',
              entityType: 'task',
              actionUrl: 'tasks',
              entityId: id,
            });
          } else if (updates.status === 'failed' && t.status !== 'failed') {
            notificationService.dispatchNotification({
              orgId: currentOrg.id,
              eventId: `evt-task-fail-${id}`,
              type: 'task_failed',
              title: `Task Failed: ${updated.title}`,
              message: `Agent ${updated.agentName} encountered an execution error.`,
              priority: 'high',
              entityType: 'task',
              actionUrl: 'tasks',
              entityId: id,
            });
          }

          return updated;
        }
        return t;
      })
    );
  };

  // Phase 28: Human-In-The-Loop Approval Decision
  const resolveApproval = async (id: string, decision: 'approved' | 'rejected', notes?: string) => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return;

    const updatedApproval: ApprovalRequest = {
      ...target,
      status: decision,
      decidedBy: user?.displayName || user?.email || 'Human Manager',
      decidedAt: new Date().toISOString(),
    };

    setApprovals((prev) => prev.map((a) => (a.id === id ? updatedApproval : a)));
    persistApproval(currentOrg.id, updatedApproval).catch(() => {});

    if (decision === 'approved') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#C7F36B', '#FF806E'],
      });
      setBannerMessage({
        title: `Approved: ${target.title}. Ready for server-side gateway execution.`,
        type: 'success',
      });
    } else {
      // If rejected, abort linked task immediately
      setTasks((prev) =>
        prev.map((t) =>
          t.approvalId === id
            ? {
                ...t,
                status: 'failed',
                result: `[Rejected by ${user?.displayName || 'Human Manager'}] Operation aborted. Reason: ${
                  notes || 'Managerial discretion'
                }.`,
              }
            : t
        )
      );
      setBannerMessage({
        title: `Rejected: ${target.title}. Operation aborted.`,
        type: 'info',
      });
    }

    logAuditAction(
      `APPROVAL_${decision.toUpperCase()}`,
      `Approval #${id} (${target.title}) marked as ${decision}`,
      decision === 'approved' ? 'success' : 'warning'
    );
  };

  // Phase 28: Separate Server-Side Execution of Approved Action
  const executeApproval = async (id: string): Promise<{ success: boolean; result: string }> => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return { success: false, result: 'Approval not found' };

    // Set state to executing
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'executing' as const } : a))
    );

    try {
      const response = await fetch('/api/approval/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: id,
          orgId: currentOrg.id,
          actionType: target.actionType,
          reviewerId: user?.uid || firebaseUser?.uid || 'user-anonymous',
          reviewerRole: user?.role || (currentOrg.ownerUid === (firebaseUser?.uid || user?.uid) ? 'owner' : 'admin'),
          payloadSummary: target.payloadSummary || {},
          idempotencyKey: id,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server executor reported failure');
      }

      // Mark executed
      const completedApproval: ApprovalRequest = {
        ...target,
        status: 'executed',
        executionId: data.executionId,
        executionResult: data.result,
      };
      setApprovals((prev) => prev.map((a) => (a.id === id ? completedApproval : a)));
      persistApproval(currentOrg.id, completedApproval).catch(() => {});

      // Mark linked task as completed
      setTasks((prev) =>
        prev.map((t) =>
          t.approvalId === id
            ? {
                ...t,
                status: 'completed',
                result: `[Verified Execution ${data.executionId}]\n${data.result}`,
              }
            : t
        )
      );

      setBannerMessage({
        title: `Execution Confirmed: ${data.executionId}`,
        type: 'success',
      });
      logAuditAction('APPROVAL_EXECUTED', `Execution ID: ${data.executionId} (${target.title})`, 'success');

      notificationService.dispatchNotification({
        orgId: currentOrg.id,
        eventId: `evt-appr-exec-${id}`,
        type: 'agent_action_executed',
        title: `Executed: ${target.title}`,
        message: `High-impact action verified and executed with cryptographic receipt ${data.executionId}.`,
        priority: 'medium',
        entityType: 'approval',
        actionUrl: 'approvals',
        entityId: id,
      });

      return { success: true, result: data.result };
    } catch (err: any) {
      const failedApproval: ApprovalRequest = {
        ...target,
        status: 'execution_failed',
        executionError: err.message || 'Execution failed',
      };
      setApprovals((prev) => prev.map((a) => (a.id === id ? failedApproval : a)));
      persistApproval(currentOrg.id, failedApproval).catch(() => {});

      notificationService.dispatchNotification({
        orgId: currentOrg.id,
        eventId: `evt-appr-failed-${id}`,
        type: 'agent_approval_needed',
        title: `Execution Failed: ${target.title}`,
        message: err.message || 'Server execution returned an error.',
        priority: 'urgent',
        entityType: 'approval',
        actionUrl: 'approvals',
        entityId: id,
      });

      setBannerMessage({
        title: `Execution Failed: ${err.message}`,
        type: 'warning',
      });
      logAuditAction('APPROVAL_EXEC_FAILED', `Error: ${err.message}`, 'blocked');
      return { success: false, result: err.message };
    }
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'orgId' | 'createdAt'>) => {
    const newCust: Customer = {
      ...c,
      id: `cust-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    persistCustomer(currentOrg.id, newCust).catch(() => {});
    logAuditAction('CRM_CUSTOMER_ADD', `${newCust.name} (${newCust.company})`, 'success');
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          persistCustomer(currentOrg.id, updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    deleteCustomerFromDb(currentOrg.id, id).catch(() => {});
    logAuditAction('CRM_CUSTOMER_DELETE', `Customer ID: ${id}`, 'warning');
  };

  const updateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.stockQuantity + delta);
        const newStatus: ProductInventory['status'] =
          newQty === 0 ? 'out_of_stock' : newQty <= item.minThreshold ? 'low_stock' : 'in_stock';
        const updated = { ...item, stockQuantity: newQty, status: newStatus };
        persistInventoryItem(currentOrg.id, updated).catch(() => {});
        return updated;
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
    persistInvoice(currentOrg.id, newInv).catch(() => {});
    logAuditAction('INVOICE_CREATE', `${newInv.invoiceNumber} for ${newInv.customerName}`, 'success');
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const updated = { ...inv, status };
          persistInvoice(currentOrg.id, updated).catch(() => {});
          return updated;
        }
        return inv;
      })
    );
  };

  const addExpense = (exp: Omit<Expense, 'id' | 'orgId' | 'createdAt'>) => {
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      orgId: currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    persistExpense(currentOrg.id, newExp).catch(() => {});
  };

  const addDocument = (doc: Omit<DocumentItem, 'id' | 'orgId' | 'uploadedAt'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      orgId: currentOrg.id,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    persistDocument(currentOrg.id, newDoc).catch(() => {});
    logAuditAction('DOCUMENT_UPLOAD', `${newDoc.name} (${newDoc.category})`, 'success');
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, status: w.status === 'active' ? ('paused' as const) : ('active' as const) };
          persistWorkflow(currentOrg.id, updated).catch(() => {});
          return updated;
        }
        return w;
      })
    );
  };

  const runWorkflowNow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = {
            ...w,
            executionsCount: w.executionsCount + 1,
            lastRunAt: new Date().toISOString(),
          };
          persistWorkflow(currentOrg.id, updated).catch(() => {});
          return updated;
        }
        return w;
      })
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
        isAuthReady,
        isDemoMode,
        toggleDemoMode,
        user,
        firebaseUser,
        loginGoogle,
        logout,
        currentOrg,
        organizations,
        setCurrentOrg,
        createOrganization,
        activeTab,
        setActiveTab,
        selectedAgentId,
        setSelectedAgentId,
        isMobileNavOpen,
        setIsMobileNavOpen,
        tasks,
        addTask,
        updateTask,
        approvals,
        resolveApproval,
        executeApproval,
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
