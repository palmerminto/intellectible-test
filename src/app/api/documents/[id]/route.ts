import { NextResponse } from 'next/server';
import { DocumentNotFoundError } from '@/lib/rag/document-errors';
import { deleteDocument } from '@/lib/rag/documents';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
  }

  try {
    await deleteDocument(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
