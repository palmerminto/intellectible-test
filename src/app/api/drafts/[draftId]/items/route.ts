import { NextResponse } from 'next/server';
import { parseAddDraftItemPayload } from '@/lib/draft-utils';
import { addDraftItem, DraftNotFoundError } from '@/lib/drafts';
import type { AddDraftItemResponse } from '@/types/draft';

interface RouteContext {
  params: Promise<{ draftId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { draftId } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    resultId?: string;
    contentSnapshot?: string;
    sourceFilename?: string;
    page?: number;
    position?: number;
  };

  const parsed = parseAddDraftItemPayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const body: AddDraftItemResponse = {
      item: await addDraftItem(draftId, parsed.data),
    };

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof DraftNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Failed to add draft item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
