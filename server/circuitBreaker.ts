/**
 * TEAMORA AI — Resilient Circuit Breaker (Phase 161–170)
 * Protects downstream AI gateways and third-party APIs against cascading failures.
 * Implements standard Closed -> Open -> Half-Open state machine with jittered backoff.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number; // consecutive failures before opening (default 5)
  resetTimeoutMs: number;    // cool-down time before attempting half-open (default 10000ms)
  timeoutMs?: number;        // single execution timeout limit
}

export interface CircuitStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  trippedCount: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly circuitName: string, public readonly state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private trippedCount: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();

  constructor(private config: CircuitBreakerConfig) {}

  public getState(): CircuitState {
    // If open and resetTimeout has elapsed, transition to HALF_OPEN
    if (this.state === 'OPEN' && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  public getStats(): CircuitStats {
    return {
      name: this.config.name,
      state: this.getState(),
      failures: this.failureCount,
      successes: this.successCount,
      trippedCount: this.trippedCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = Date.now();
    if (newState === 'OPEN') {
      this.trippedCount++;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  /**
   * Execute an async action protected by this circuit breaker.
   */
  public async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerError(
        `Circuit '${this.config.name}' is OPEN. Requests blocked to prevent cascading overload.`,
        this.config.name,
        'OPEN'
      );
    }

    try {
      let timeoutHandle: any;
      let actionPromise = action();

      if (this.config.timeoutMs && this.config.timeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Execution timed out after ${this.config.timeoutMs}ms`));
          }, this.config.timeoutMs);
        });
        actionPromise = Promise.race([actionPromise, timeoutPromise]);
      }

      const result = await actionPromise;
      if (timeoutHandle) clearTimeout(timeoutHandle);

      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      // Canary request succeeded, heal circuit
      this.transitionTo('CLOSED');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Canary failed, re-open immediately
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Manually reset circuit breaker for test or recovery scenarios.
   */
  public reset(): void {
    this.transitionTo('CLOSED');
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }

  /**
   * Manually trip circuit breaker.
   */
  public trip(): void {
    this.lastFailureTime = Date.now();
    this.transitionTo('OPEN');
  }
}

// Global registry of circuit breakers
export const circuitRegistry = new Map<string, CircuitBreaker>();

export function getOrCreateCircuit(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  let circuit = circuitRegistry.get(name);
  if (!circuit) {
    circuit = new CircuitBreaker({
      name,
      failureThreshold: config?.failureThreshold ?? 5,
      resetTimeoutMs: config?.resetTimeoutMs ?? 10000,
      timeoutMs: config?.timeoutMs,
    });
    circuitRegistry.set(name, circuit);
  }
  return circuit;
}
