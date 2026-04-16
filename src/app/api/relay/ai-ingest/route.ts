import { NextRequest, NextResponse } from 'next/server';
import {
  ingestContentAction,
  saveIngestedItemsAction,
} from '@/actions/ai-ingest';
import type {
  ExtractedItem,
  IngestInput,
  IngestSource,
} from '@/lib/relay/ai-ingest/types';

// AI calls + occasional PDF parsing push us past the default 30s cap.
// Not needed for Edge — these handlers run in Node.
export const maxDuration = 60;

type PostBody =
  | ({ action: 'ingest' } & IngestInput)
  | {
      action: 'save';
      partnerId: string;
      moduleId: string;
      items: ExtractedItem[];
      userId: string;
      source: IngestSource;
    };

export async function POST(request: NextRequest) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  try {
    if (body.action === 'ingest') {
      const { action, ...input } = body as { action: 'ingest' } & IngestInput;
      void action;
      const result = await ingestContentAction(input);
      return NextResponse.json(result);
    }

    if (body.action === 'save') {
      const result = await saveIngestedItemsAction(
        body.partnerId,
        body.moduleId,
        body.items,
        body.userId,
        body.source,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${String((body as { action?: string }).action)}` },
      { status: 400 },
    );
  } catch (err) {
    console.error('[ai-ingest route] failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Request failed',
      },
      { status: 500 },
    );
  }
}
