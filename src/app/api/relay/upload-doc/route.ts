import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getPartnerId } from '@/utils/auth';
import { indexRelayDoc } from '@/lib/relay/retrieval/index-docs';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization') || '';
  const userData = await getPartnerId(authHeader);

  if (!userData.success) {
    return NextResponse.json({ error: 'Could not authenticate user' }, { status: 401 });
  }
  const partnerId = userData.partnerId as string;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart request' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const fileId = (formData.get('fileId') as string | null) ?? uuidv4();

  if (!file) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'PDF exceeds 10 MB limit' }, { status: 413 });
  }

  // Write to temp file for indexing; caller cleans up after fire-and-forget completes.
  const tempFilePath = `/tmp/${uuidv4()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, buffer);

  // Record in vaultFiles so relay-knowledge-actions can surface it.
  await db.collection(`partners/${partnerId}/vaultFiles`).doc(fileId).set({
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    state: 'ACTIVE',
    source: 'relay-upload',
    createdAt: FieldValue.serverTimestamp(),
  });

  // NOTE: Duplicate upload (same fileId) will accumulate chunks — MR-5 owns
  // the delete-on-re-upload path. Log a warning so the gap is visible.
  console.info(
    `[relay-upload] doc ${fileId} partner ${partnerId}: received (${file.size} bytes), indexing async`,
  );

  void indexRelayDoc(partnerId, fileId, tempFilePath)
    .catch((e) => {
      console.error('[relay-index] doc indexing failed:', { partnerId, fileId, error: e });
    })
    .finally(() => {
      fs.unlink(tempFilePath).catch(() => {});
    });

  return NextResponse.json({ success: true, fileId });
}
