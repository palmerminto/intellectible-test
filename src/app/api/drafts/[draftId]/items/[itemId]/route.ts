import { NextResponse } from 'next/server';
import { DraftItemNotFoundError, DraftNotFoundError, removeDraftItem } from '@/lib/drafts';

interface RouteContext {
  params: Promise<{ draftId: string; itemId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { draftId, itemId } = await context.params;

  try {
    await removeDraftItem(draftId, itemId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DraftNotFoundError || error instanceof DraftItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Failed to remove draft item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
