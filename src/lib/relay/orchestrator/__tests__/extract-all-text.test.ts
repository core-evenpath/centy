// Commit 1 — parser iterate all candidate parts.
//
// Unit + integration coverage for `extractAllText`, the
// `orchestrator/index.ts` helper that replaces `response.text` so
// Gemini responses whose structured payload arrives via a
// `functionCall` part are not silently dropped.
//
// Context: Phase 2 probe report (PR #196 follow-up) identified
// `response.text?.trim() ?? ''` at `callGemini` as the origin of
// "block not emitted" symptoms — the SDK accessor concatenates
// only text parts and logs "there are non-text parts" when the
// structured output lives elsewhere.

import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ db: {} }));

import { extractAllText } from '../index';
import type { GenerateContentResponse } from '@google/genai';

function responseWith(parts: unknown[]): GenerateContentResponse {
  return {
    candidates: [{ content: { parts } }],
  } as unknown as GenerateContentResponse;
}

describe('extractAllText', () => {
  // ── Text-only (backward-compat with response.text) ──────────────

  it('text-only single part → returns that text (matches response.text)', () => {
    const r = responseWith([{ text: 'hello' }]);
    expect(extractAllText(r)).toBe('hello');
  });

  it('text-only multiple parts → concatenated', () => {
    const r = responseWith([{ text: 'part-a' }, { text: 'part-b' }]);
    expect(extractAllText(r)).toBe('part-apart-b');
  });

  // ── Structured output via functionCall ──────────────────────────

  it('functionCall only → stringified args', () => {
    const r = responseWith([
      {
        functionCall: {
          name: 'emitBlock',
          args: { blockId: 'product_card', text: 'Here you go' },
        },
      },
    ]);
    const out = extractAllText(r);
    expect(JSON.parse(out)).toEqual({
      blockId: 'product_card',
      text: 'Here you go',
    });
  });

  it('text + functionCall → functionCall wins (structured output authoritative)', () => {
    const r = responseWith([
      { text: 'narrative about bonbons' },
      {
        functionCall: {
          name: 'emitBlock',
          args: { blockId: 'menu_item', suggestions: ['Drinks?'] },
        },
      },
    ]);
    const out = extractAllText(r);
    expect(JSON.parse(out)).toEqual({
      blockId: 'menu_item',
      suggestions: ['Drinks?'],
    });
  });

  it('multiple functionCall parts → all args joined with newline', () => {
    const r = responseWith([
      { functionCall: { name: 'a', args: { blockId: 'x' } } },
      { functionCall: { name: 'b', args: { blockId: 'y' } } },
    ]);
    const out = extractAllText(r);
    const lines = out.split('\n');
    expect(JSON.parse(lines[0])).toEqual({ blockId: 'x' });
    expect(JSON.parse(lines[1])).toEqual({ blockId: 'y' });
  });

  // ── Edge cases ──────────────────────────────────────────────────

  it('empty parts array → empty string', () => {
    const r = responseWith([]);
    expect(extractAllText(r)).toBe('');
  });

  it('missing candidates → empty string', () => {
    const r = { candidates: undefined } as unknown as GenerateContentResponse;
    expect(extractAllText(r)).toBe('');
  });

  it('part with neither text nor functionCall → skipped, no throw', () => {
    const r = responseWith([
      { inlineData: { mimeType: 'image/png', data: 'base64blob' } },
      { text: 'keeps going' },
    ]);
    expect(extractAllText(r)).toBe('keeps going');
  });

  it('thought parts are skipped (match response.text semantics)', () => {
    const r = responseWith([
      { text: 'reasoning here', thought: true },
      { text: 'final answer' },
    ]);
    expect(extractAllText(r)).toBe('final answer');
  });

  it('functionCall without args → skipped, falls back to text', () => {
    const r = responseWith([
      { functionCall: { name: 'emitBlock' } },
      { text: 'narrative only' },
    ]);
    expect(extractAllText(r)).toBe('narrative only');
  });

  // ── Integration-adjacent: round-trip through parseGeminiJson ────

  it('functionCall payload round-trips through parseGeminiJson to blockId', async () => {
    // Replays the full callGemini downstream: extractAllText →
    // trim → parseGeminiJson. parseGeminiJson is not exported, so
    // we exercise it indirectly: assert the string extractAllText
    // emits is valid JSON that parses to the expected shape.
    const r = responseWith([
      { text: 'Our artisanal bonbons are made fresh daily.' },
      {
        functionCall: {
          name: 'emitBlock',
          args: {
            blockId: 'menu_item',
            text: 'Our artisanal bonbons are made fresh daily.',
            suggestions: ['Show drinks', "What's popular?"],
          },
        },
      },
    ]);
    const raw = extractAllText(r).trim();
    const parsed = JSON.parse(raw);
    expect(parsed.blockId).toBe('menu_item');
    expect(parsed.suggestions).toEqual(['Show drinks', "What's popular?"]);
  });
});
