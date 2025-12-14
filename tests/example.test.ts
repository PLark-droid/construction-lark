/**
 * Example test file
 *
 * Run tests: npm test
 * Watch mode: npm test -- --watch
 * Coverage: npm test -- --coverage
 */

import { describe, it, expect } from 'vitest';
import { LarkClient, FIELD_TYPES } from '../src/index.js';

describe('construction-lark', () => {
  it('should export LarkClient', () => {
    expect(LarkClient).toBeDefined();
    expect(typeof LarkClient).toBe('function');
  });

  it('should export FIELD_TYPES', () => {
    expect(FIELD_TYPES).toBeDefined();
    expect(FIELD_TYPES.TEXT).toBe(1);
    expect(FIELD_TYPES.NUMBER).toBe(2);
  });

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should validate async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});

describe('Environment', () => {
  it('should have Node.js environment', () => {
    expect(typeof process).toBe('object');
    expect(process.env).toBeDefined();
  });
});
