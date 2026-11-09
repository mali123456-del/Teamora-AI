/**
 * TEAMORA AI — Centralized Error Management Service (Phase 73)
 * Provides typed error categories, correlation IDs, safe user-facing error messages,
 * and resilient retry policies with exponential backoff.
 */

export enum ErrorCode {
  // Authentication & Session
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_SESSION_REVOKED = 'AUTH_SESSION_REVOKED',

  // Tenant Isolation & RBAC
  TENANT_MISMATCH = 'TENANT_MISMATCH',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  INSUFFICIENT_ROLE = 'INSUFFICIENT_ROLE',
  CROSS_TENANT_BLOCKED = 'CROSS_TENANT_BLOCKED',

  // Rate Limiting & Quotas
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  USAGE_LIMIT_REACHED = 'USAGE_LIMIT_REACHED',

  // Validation & Data Integrity
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // AI & RAG Pipeline
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',
  RAG_RETRIEVAL_FAILED = 'RAG_RETRIEVAL_FAILED',

  // Web Crawler & SSRF Guard
  CRAWLER_SECURITY_BLOCKED = 'CRAWLER_SECURITY_BLOCKED',
  CRAWLER_DOMAIN_DISALLOWED = 'CRAWLER_DOMAIN_DISALLOWED',
  CRAWLER_EXTRACTION_FAILED = 'CRAWLER_EXTRACTION_FAILED',

  // Offline & Synchronization
  OFFLINE_MODE_ACTIVE = 'OFFLINE_MODE_ACTIVE',
  SYNC_CONFLICT_DETECTED = 'SYNC_CONFLICT_DETECTED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',

  // General & Network
  NETWORK_DISCONNECTED = 'NETWORK_DISCONNECTED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  userFacingMessage: string;
  correlationId: string;
  timestamp: string;
  httpStatus: number;
  retryable: boolean;
  meta?: Record<string, any>;
}

export class TeamoraError extends Error {
  public readonly code: ErrorCode;
  public readonly correlationId: string;
  public readonly httpStatus: number;
  public readonly retryable: boolean;
  public readonly userFacingMessage: string;
  public readonly meta?: Record<string, any>;

  constructor(details: {
    code: ErrorCode;
    message: string;
    userFacingMessage?: string;
    correlationId?: string;
    httpStatus?: number;
    retryable?: boolean;
    meta?: Record<string, any>;
  }) {
    super(details.message);
    this.name = 'TeamoraError';
    this.code = details.code;
    this.correlationId = details.correlationId || generateCorrelationId();
    this.httpStatus = details.httpStatus || 500;
    this.retryable = details.retryable ?? false;
    this.userFacingMessage = details.userFacingMessage || getUserFriendlyMessage(details.code);
    this.meta = details.meta;
    Object.setPrototypeOf(this, TeamoraError.prototype);
  }
}

/**
 * Generate cryptographically secure correlation ID for tracing
 */
export function generateCorrelationId(prefix: string = 'tmr'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * Maps system error codes to safe, empathetic, non-leaking user messages
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.AUTH_UNAUTHORIZED:
    case ErrorCode.AUTH_EXPIRED:
      return 'Your session has expired. Please sign in again with your Google account.';
    case ErrorCode.TENANT_MISMATCH:
    case ErrorCode.CROSS_TENANT_BLOCKED:
      return 'Access to this workspace resource was restricted to protect tenant data isolation.';
    case ErrorCode.INSUFFICIENT_ROLE:
      return 'You do not have the required role permissions (Manager or Owner) to perform this action.';
    case ErrorCode.RATE_LIMITED:
      return 'Request rate ceiling exceeded. Please wait a moment before sending more commands.';
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.USAGE_LIMIT_REACHED:
      return 'Organization monthly AI execution quota reached. Upgrade plan in Subscription settings.';
    case ErrorCode.VALIDATION_FAILED:
      return 'The submitted data was incomplete or did not match the required schema.';
    case ErrorCode.MODEL_TIMEOUT:
      return 'AI reasoning timed out. Falling back to high-speed tier or retry with simpler prompt.';
    case ErrorCode.CRAWLER_SECURITY_BLOCKED:
      return 'Destination IP address is restricted by SSRF security policy (private/loopback ranges blocked).';
    case ErrorCode.OFFLINE_MODE_ACTIVE:
      return 'Working offline. Draft saved locally in IndexedDB and will auto-sync upon reconnection.';
    case ErrorCode.SYNC_CONFLICT_DETECTED:
      return 'Version conflict detected between local draft and server. Review options to reconcile.';
    case ErrorCode.NETWORK_DISCONNECTED:
      return 'Internet connection appears offline. Operating from local cache.';
    default:
      return 'An unexpected issue occurred. Our automated error recovery kernel has recorded this event.';
  }
}

/**
 * Retry utility with exponential backoff and jitter for transient errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    retryablePredicate?: (err: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    backoffMultiplier = 2,
    retryablePredicate = (err) => {
      if (err instanceof TeamoraError) return err.retryable;
      const status = err?.status || err?.httpStatus || err?.statusCode;
      return status === 429 || status === 503 || status === 504 || err?.message?.includes('network');
    },
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries || !retryablePredicate(err)) {
        throw err;
      }
      const jitter = Math.random() * 100;
      await new Promise((res) => setTimeout(res, delay + jitter));
      delay *= backoffMultiplier;
    }
  }

  throw new TeamoraError({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Operation exceeded maximum retry attempts',
  });
}
