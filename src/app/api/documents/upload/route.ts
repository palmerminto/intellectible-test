import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { chunkPdfPages } from '@/lib/rag/chunk';
import {
  buildPdfStoragePath,
  createProcessingDocument,
  markDocumentFailed,
  markDocumentReady,
  replaceDocumentChunks,
} from '@/lib/rag/documents';
import { embedChunks } from '@/lib/rag/openrouter';
import { parsePdfPages } from '@/lib/rag/pdf';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  MAX_PDF_SIZE_BYTES,
  PDF_TOO_LARGE_ERROR,
  PDF_TYPE_ERROR,
  isAcceptedPdfUpload,
} from '@/lib/upload/upload-utils';
import type { UploadDocumentResponse } from '@/types/document';

export const runtime = 'nodejs';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Document ingestion failed';
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: PDF_TOO_LARGE_ERROR }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isAcceptedPdfUpload(file, buffer)) {
    return NextResponse.json({ error: PDF_TYPE_ERROR }, { status: 400 });
  }

  const documentId = crypto.randomUUID();
  const storagePath = buildPdfStoragePath(documentId, file.name);

  try {
    await createProcessingDocument({
      id: documentId,
      filename: file.name,
      storagePath,
      mimeType: file.type || 'application/pdf',
      sizeBytes: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start document ingestion: ${toErrorMessage(error)}` },
      { status: 500 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const pages = await parsePdfPages(buffer);
    const chunks = chunkPdfPages(pages);

    if (chunks.length === 0) {
      throw new Error('No searchable text chunks found');
    }

    const embeddedChunks = await embedChunks(chunks);
    await replaceDocumentChunks(documentId, embeddedChunks);
    await markDocumentReady(documentId, pages.length);
  } catch (error) {
    const message = toErrorMessage(error);

    try {
      await markDocumentFailed(documentId, message);
    } catch (markFailedError) {
      console.error('Failed to mark document ingestion as failed', markFailedError);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const body: UploadDocumentResponse = {
    documentId,
    filename: file.name,
  };

  return NextResponse.json(body, { status: 201 });
}
