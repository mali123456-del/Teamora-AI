import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import {
  AgentTask,
  ApprovalRequest,
  Customer,
  ProductInventory,
  Invoice,
  Expense,
  Project,
  DocumentItem,
  AutomationWorkflow,
  SecurityAuditLog,
  Organization,
} from '../types/index.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation connection to Firestore on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection: Client is currently operating in offline mode.');
    }
    return false;
  }
}

// Generic Local Storage Persistence Helper for Refresh-Safe Tenant Sessions
export function getStoredTenantData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`teamora_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredTenantData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`teamora_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`LocalStorage write failed for ${key}:`, err);
  }
}

// ==========================================
// Centralized Data Access Operations
// ==========================================

export async function persistTask(orgId: string, task: AgentTask): Promise<void> {
  const path = `organizations/${orgId}/tasks`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, task.id), task, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${task.id}`);
  }
}

export async function persistApproval(orgId: string, approval: ApprovalRequest): Promise<void> {
  const path = `organizations/${orgId}/approvals`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, approval.id), approval, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${approval.id}`);
  }
}

export async function persistCustomer(orgId: string, customer: Customer): Promise<void> {
  const path = `organizations/${orgId}/customers`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, customer.id), customer, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${customer.id}`);
  }
}

export async function deleteCustomerFromDb(orgId: string, customerId: string): Promise<void> {
  const path = `organizations/${orgId}/customers`;
  try {
    if (auth.currentUser) {
      await deleteDoc(doc(db, path, customerId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${customerId}`);
  }
}

export async function persistInventoryItem(orgId: string, item: ProductInventory): Promise<void> {
  const path = `organizations/${orgId}/inventory`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, item.id), item, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${item.id}`);
  }
}

export async function persistInvoice(orgId: string, invoice: Invoice): Promise<void> {
  const path = `organizations/${orgId}/invoices`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, invoice.id), invoice, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${invoice.id}`);
  }
}

export async function persistExpense(orgId: string, expense: Expense): Promise<void> {
  const path = `organizations/${orgId}/expenses`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, expense.id), expense, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${expense.id}`);
  }
}

export async function persistProject(orgId: string, project: Project): Promise<void> {
  const path = `organizations/${orgId}/projects`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, project.id), project, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${project.id}`);
  }
}

export async function persistDocument(orgId: string, documentItem: DocumentItem): Promise<void> {
  const path = `organizations/${orgId}/documents`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, documentItem.id), documentItem, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${documentItem.id}`);
  }
}

export async function persistWorkflow(orgId: string, workflow: AutomationWorkflow): Promise<void> {
  const path = `organizations/${orgId}/workflows`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, workflow.id), { ...workflow, orgId }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${workflow.id}`);
  }
}

export async function persistAuditLog(orgId: string, log: SecurityAuditLog): Promise<void> {
  const path = `organizations/${orgId}/auditLogs`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, path, log.id), { ...log, orgId });
    }
  } catch (error) {
    // Non-blocking for audit logs to not crash user UI
    console.warn('Audit log write error:', error);
  }
}

export async function createNewOrganization(org: Organization, ownerUid: string): Promise<void> {
  const path = `organizations/${org.id}`;
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, 'organizations', org.id), {
        ...org,
        ownerUid,
        createdAt: new Date().toISOString(),
      });
      // Add owner to members subcollection
      await setDoc(doc(db, `organizations/${org.id}/members`, ownerUid), {
        uid: ownerUid,
        email: auth.currentUser.email || 'owner@teamora.ai',
        role: 'owner',
        joinedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function ensureOrganizationSynced(org: Organization, user: { uid: string; email: string }): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const orgRef = doc(db, 'organizations', org.id);
    const orgSnap = await getDoc(orgRef);
    if (!orgSnap.exists()) {
      await setDoc(orgRef, {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        ownerUid: user.uid,
        currency: org.currency,
        createdAt: org.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    const memberRef = doc(db, `organizations/${org.id}/members`, user.uid);
    await setDoc(memberRef, {
      uid: user.uid,
      email: user.email,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not ensure organization synced to Firestore:', err);
  }
}
