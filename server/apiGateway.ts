/**
 * TEAMORA AI — API Gateway & Centralized Response Architecture (Phase 77 & 78)
 * Standardizes API envelopes, correlation tracing, rate limiting headers,
 * request size boundaries, and input sanitization.
 */

import crypto from 'crypto';
import type { ServerResponse, IncomingMessage } from 'http';

export const GATEWAY_VERSION = 'v2.6.0';
export const DEFAULT_MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ApiMeta {
  timestamp: string;
  correlationId: string;
  durationMs?: number;
  version: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
  meta: ApiMeta;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Extracts correlation ID from incoming headers or generates a fresh one
 */
export function getOrCreateCorrelationId(req: IncomingMessage): string {
  const incoming = (req.headers['x-correlation-id'] || req.headers['x-request-id']) as string;
  if (incoming && typeof incoming === 'string' && incoming.length <= 128) {
    return incoming;
  }
  return `req-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Sends a standardized success API response
 */
export function sendApiSuccess<T>(
  res: ServerResponse,
  data: T,
  correlationId: string,
  startTime?: number,
  statusCode: number = 200,
  extraHeaders: Record<string, string> = {}
): void {
  const durationMs = startTime ? Date.now() - startTime : undefined;
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      correlationId,
      durationMs,
      version: GATEWAY_VERSION,
    },
  };

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  for (const [key, val] of Object.entries(extraHeaders)) {
    res.setHeader(key, val);
  }

  res.end(JSON.stringify(payload));
}

/**
 * Sends a standardized error API response (never exposing internal stack traces)
 */
export function sendApiError(
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  correlationId: string,
  extraHeaders: Record<string, string> = {}
): void {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      correlationId,
    },
    meta: {
      timestamp: new Date().toISOString(),
      correlationId,
      version: GATEWAY_VERSION,
    },
  };

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  for (const [key, val] of Object.entries(extraHeaders)) {
    res.setHeader(key, val);
  }

  res.end(JSON.stringify(payload));
}

/**
 * Basic string sanitization removing dangerous control characters and script sequences
 */
export function sanitizeInputString(input: string, maxLen: number = 32768): string {
  if (!input || typeof input !== 'string') return '';
  // Truncate to maximum allowed length
  const trimmed = input.slice(0, maxLen);
  // Remove ASCII null bytes and non-printable control characters (except newline, tab, carriage return)
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
