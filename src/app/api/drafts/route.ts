import { NextResponse } from 'next/server';
import { createDraft, listDrafts } from '@/lib/drafts';
import type { CreateDraftResponse, DraftsResponse } from '@/types/draft';

export async function GET() {
  try {
    const body: DraftsResponse = { drafts: await listDrafts() };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load drafts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { title?: string };

  try {
    const body: CreateDraftResponse = { draft: await createDraft(payload.title) };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
