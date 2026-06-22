import { NextResponse } from 'next/server';
import type { UploadDocumentResponse } from '@/types/document';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }

  // Skeleton: upload and ingestion pipeline not wired yet.
  const body: UploadDocumentResponse = {
    documentId: crypto.randomUUID(),
    filename: file.name,
  };

  return NextResponse.json(body, { status: 501 });
}
