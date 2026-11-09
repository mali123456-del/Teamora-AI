# TEAMORA AI — Database Schema & Data Architecture

## 1. Overview

Database Engine: **Google Cloud Firestore (Enterprise Edition)**  
Database ID: `ai-studio-ef82aa0c-500c-4772-b17a-70d50299535a`  
Project ID: `gen-lang-client-0255849452`  
Security Paradigm: **Attribute-Based Access Control (ABAC) with Default-Deny**

All business data is strictly scoped under organization hierarchies: `/organizations/{orgId}/{collection}/{docId}`.

---

## 2. Entity Schemas

### `/organizations/{orgId}`
```typescript
interface Organization {
  id: string;               // e.g. "org-apex"
  name: string;             // max 128 chars
  slug: string;             // URL-friendly identifier
  plan: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  ownerUid: string;         // Firebase Auth UID of organization creator
  currency: 'USD' | 'PKR';  // Primary accounting currency
  createdAt: string;        // ISO 8601
  membersCount: number;
}
```

### `/organizations/{orgId}/members/{memberId}`
```typescript
interface OrganizationMember {
  uid: string;              // User UID
  email: string;            // User email
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  joinedAt: string;         // ISO 8601
}
```

### `/users/{userId}/profile`
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  currentOrgId: string;
  language: 'en' | 'ur';
}
```

### `/organizations/{orgId}/tasks/{taskId}`
```typescript
interface AgentTask {
  id: string;
  orgId: string;
  agentId: string;          // e.g. "workforce-manager", "finance-agent"
  agentName: string;
  title: string;            // max 256 chars
  prompt: string;           // max 4096 chars
  status: 'queued' | 'planning' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  result?: string;          // Model output or execution summary
  requiresApproval?: boolean;
  approvalId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  duration?: string;
  modelUsed?: string;
}
```

### `/organizations/{orgId}/approvals/{approvalId}`
```typescript
interface ApprovalRequest {
  id: string;
  orgId: string;
  agentId: string;
  agentName: string;
  actionType: 'email_send' | 'refund' | 'payout' | 'contract_sign' | 'stock_writeoff' | 'workflow_live';
  title: string;
  description: string;
  consequences: string;     // Risk disclosure
  payloadSummary: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'executed' | 'execution_failed' | 'cancelled';
  executionId?: string;     // Server gateway execution reference
  executionResult?: string;
  executionError?: string;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
}
```

### `/organizations/{orgId}/customers/{customerId}`
```typescript
interface Customer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  value: number;
  currency: 'USD' | 'PKR';
  phone?: string;
  notes?: string;
  assignedAgent?: string;
  createdAt: string;
}
```

### `/organizations/{orgId}/inventory/{itemId}`
```typescript
interface ProductInventory {
  id: string;
  orgId: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  minThreshold: number;
  unitPrice: number;
  currency: 'USD' | 'PKR';
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}
```

### `/organizations/{orgId}/invoices/{invoiceId}`
```typescript
interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: 'USD' | 'PKR';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}
```

### `/organizations/{orgId}/expenses/{expenseId}`
```typescript
interface Expense {
  id: string;
  orgId: string;
  category: 'software' | 'marketing' | 'infrastructure' | 'operations' | 'travel' | 'other';
  description: string;
  amount: number;
  currency: 'USD' | 'PKR';
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  createdAt: string;
}
```

### `/organizations/{orgId}/projects/{projectId}`
```typescript
interface Project {
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
```

### `/organizations/{orgId}/documents/{docId}`
```typescript
interface DocumentItem {
  id: string;
  orgId: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'sheet' | 'markdown' | 'txt';
  category: 'contracts' | 'reports' | 'sop' | 'marketing' | 'research';
  status: 'processing' | 'indexed' | 'error';
  tags: string[];
  summary?: string;
  uploadedAt: string;
}
```

### `/organizations/{orgId}/workflows/{workflowId}`
```typescript
interface AutomationWorkflow {
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
```

### `/organizations/{orgId}/auditLogs/{logId}`
```typescript
interface SecurityAuditLog {
  id: string;
  orgId: string;
  action: string;
  actor: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'blocked';
  timestamp: string;
}
```

---

## 3. Data Integrity & Invariants

1. **Strict Immutability:** Audit logs can never be altered or deleted.
2. **Tenant Scoping:** Every document mutation is validated against `request.resource.data.orgId == orgId`.
3. **No Unbounded Arrays:** Sub-items (tasks, members, logs) live in dedicated subcollections, preventing 1MB Firestore document overflow.
