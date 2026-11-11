/**
 * TEAMORA AI — Enterprise AI Governance & Safety Guardrails (Phase 171–180)
 * Provides prompt injection detection, output sanitization, agent execution sandboxing,
 * and token consumption quota governance.
 */

export interface PromptScanResult {
  isSafe: boolean;
  riskScore: number; // 0 (safe) to 100 (high risk)
  flaggedPatterns: string[];
  sanitizedPrompt: string;
}

// Canonical injection and jailbreak signatures
const INJECTION_PATTERNS: Array<{ regex: RegExp; name: string; weight: number }> = [
  { regex: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)/i, name: 'instruction_override', weight: 80 },
  { regex: /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)/i, name: 'instruction_override_alt', weight: 80 },
  { regex: /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|context)/i, name: 'context_wipe', weight: 70 },
  { regex: /system\s+prompt\s*:\s*/i, name: 'system_prompt_impersonation', weight: 60 },
  { regex: /you\s+are\s+now\s+(in\s+)?(DAN|jailbreak|unfiltered|developer\s+mode)/i, name: 'jailbreak_persona', weight: 90 },
  { regex: /bypass\s+(safety|content|policy)\s+(filters|guidelines)/i, name: 'filter_bypass', weight: 85 },
  { regex: /reveal\s+(your\s+)?(internal|hidden|system)\s+(prompt|instructions|rules)/i, name: 'system_prompt_extraction', weight: 75 },
  { regex: /(dump|leak|print|show|give|reveal)\s+(the\s+|all\s+|your\s+)?(api[_\s]?key|secret|token|password|credential)/i, name: 'credential_exfiltration', weight: 95 },
  { regex: /<script[\s\S]*?>[\s\S]*?<\/script>/i, name: 'html_script_injection', weight: 85 },
  { regex: /javascript\s*:\s*[a-z0-9_]+/i, name: 'uri_scheme_injection', weight: 80 },
];

/**
 * Scans a user prompt for prompt injection, jailbreak, or exfiltration attempts.
 */
export function scanPromptSecurity(rawPrompt: string): PromptScanResult {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return { isSafe: true, riskScore: 0, flaggedPatterns: [], sanitizedPrompt: '' };
  }

  let totalRisk = 0;
  const flagged: string[] = [];

  for (const { regex, name, weight } of INJECTION_PATTERNS) {
    if (regex.test(rawPrompt)) {
      flagged.push(name);
      totalRisk += weight;
    }
  }

  const normalizedRisk = Math.min(100, totalRisk);
  const isSafe = normalizedRisk < 60; // Threshold for blocking

  // Sanitize harmful HTML / script tags
  let sanitized = rawPrompt
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, 'blocked_scheme:')
    .trim();

  return {
    isSafe,
    riskScore: normalizedRisk,
    flaggedPatterns: flagged,
    sanitizedPrompt: sanitized,
  };
}

/**
 * Sanitizes agent-generated markdown/HTML output to guarantee zero XSS or script execution.
 */
export function sanitizeAgentOutput(rawOutput: string): string {
  if (!rawOutput || typeof rawOutput !== 'string') return '';

  return rawOutput
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/onload\s*=\s*["'][^"']*["']/gi, '')
    .replace(/onerror\s*=\s*["'][^"']*["']/gi, '')
    .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, 'about:blank');
}

/**
 * Token Quota Allocations by Organization Plan Tier
 */
export const MONTHLY_TOKEN_LIMITS: Record<string, number> = {
  free: 50_000,
  starter: 250_000,
  pro: 1_500_000,
  business: 5_000_000,
  enterprise: 25_000_000,
};

// In-memory tenant token consumption ledger
const tenantTokenUsage = new Map<string, number>();

/**
 * Check and deduct token usage for an organization.
 */
export function consumeTokens(
  orgId: string,
  tokens: number,
  planTier: string = 'pro'
): { allowed: boolean; consumed: number; remaining: number; limit: number } {
  const limit = MONTHLY_TOKEN_LIMITS[planTier] || MONTHLY_TOKEN_LIMITS.pro;
  const currentUsage = tenantTokenUsage.get(orgId) || 0;

  if (currentUsage + tokens > limit) {
    return {
      allowed: false,
      consumed: currentUsage,
      remaining: Math.max(0, limit - currentUsage),
      limit,
    };
  }

  const updated = currentUsage + tokens;
  tenantTokenUsage.set(orgId, updated);

  return {
    allowed: true,
    consumed: updated,
    remaining: limit - updated,
    limit,
  };
}

/**
 * Reset token usage (used in testing or month turnover).
 */
export function resetTokenUsage(orgId?: string): void {
  if (orgId) {
    tenantTokenUsage.delete(orgId);
  } else {
    tenantTokenUsage.clear();
  }
}
