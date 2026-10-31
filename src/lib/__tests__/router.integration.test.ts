import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runWithFallback } from '@/lib/router';
import { recordFailure, recordSuccess, isOpen, getRetryAfter } from '@/lib/circuit';

describe('Router Integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should succeed on first tier', async () => {
    const result = await runWithFallback([
      async () => 'tier1',
      async () => 'tier2',
    ], 'test-success');
    expect(result).toBe('tier1');
  });

  it('should fallback on 5xx error', async () => {
    const result = await runWithFallback([
      async () => { throw { status: 500 }; },
      async () => 'tier2',
    ], 'test-fallback-5xx');
    expect(result).toBe('tier2');
  });

  it('should fallback on 429', async () => {
    const result = await runWithFallback([
      async () => { throw { status: 429 }; },
      async () => 'tier2',
    ], 'test-fallback-429');
    expect(result).toBe('tier2');
  });

  it('should NOT fallback on 400', async () => {
    await expect(runWithFallback([
      async () => { throw { status: 400 }; },
      async () => 'tier2',
    ], 'test-no-fallback-400')).rejects.toThrow();
  });

  it('should exhaust all tiers and throw with tried info', async () => {
    try {
      await runWithFallback([
        async () => { throw { status: 500 }; },
        async () => { throw { status: 500 }; },
      ], 'test-exhaust');
    } catch (e: any) {
      expect(e.tried).toBeDefined();
      expect(e.soonest).toBeDefined();
    }
  });

  it('circuit breaker opens after 3 failures', async () => {
    for (let i = 0; i < 3; i++) {
      try { await runWithFallback([async () => { throw { status: 500 }; }], 'cb-test-open'); } catch {}
    }
    expect(isOpen('cb-test-open:tier:0')).toBe(true);
  });
});

describe('Circuit Breaker', () => {
  it('should record failure and success', () => {
    recordFailure('key1');
    recordFailure('key1');
    recordFailure('key1');
    expect(isOpen('key1')).toBe(true);
    recordSuccess('key1');
    expect(isOpen('key1')).toBe(false);
  });

  it('getRetryAfter returns cooldown when open', () => {
    recordFailure('key2');
    recordFailure('key2');
    recordFailure('key2');
    const ra = getRetryAfter('key2');
    expect(ra).toBeGreaterThan(0);
    expect(ra).toBeLessThanOrEqual(30000);
  });
});
