import 'server-only';

// ── PDF source adapter ─────────────────────────────────────────────────
//
// `extractPageTextFromPdf` (in `src/ai/fireRagSetup.ts`) takes a file
// path — so we stream the incoming base64 to a temp file, parse it,
// and clean up. Keeps the adapter isolated so a future swap to an
// in-memory pdf parser is a one-file change.

import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { extractPageTextFromPdf } from '@/ai/fireRagSetup';
import type { SourceExtractionResult } from './types';

function stripDataUri(raw: string): string {
  const idx = raw.indexOf(',');
  return idx >= 0 && raw.startsWith('data:') ? raw.slice(idx + 1) : raw;
}

export async function extractFromPdf(
  pdfBase64: string,
  filename: string,
): Promise<SourceExtractionResult> {
  let tempDir: string | undefined;
  try {
    tempDir = await mkdtemp(path.join(tmpdir(), 'relay-ingest-'));
    const tempPath = path.join(tempDir, `${randomUUID()}.pdf`);
    await writeFile(tempPath, Buffer.from(stripDataUri(pdfBase64), 'base64'));

    const parsed = await extractPageTextFromPdf(tempPath);
    const text =
      parsed && typeof parsed === 'object' && 'text' in parsed
        ? String((parsed as { text?: string }).text ?? '')
        : '';

    return {
      success: text.length > 0,
      content: text,
      sourceLabel: filename,
      error: text.length === 0 ? 'PDF contained no extractable text' : undefined,
    };
  } catch (err) {
    return {
      success: false,
      content: '',
      sourceLabel: filename,
      error: err instanceof Error ? err.message : 'PDF extraction failed',
    };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
