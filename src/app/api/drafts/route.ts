import { NextResponse } from 'next/server';
import type { CreateDraftResponse, DraftsResponse } from '@/types/draft';

export async function GET() {
  const body: DraftsResponse = { drafts: [] };
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { title?: string };
  const now = new Date().toISOString();

  const body: CreateDraftResponse = {
    draft: {
      id: crypto.randomUUID(),
      title: payload.title?.trim() || 'Untitled draft',
      items: [],
      createdAt: now,
      updatedAt: now,
    },
  };

  return NextResponse.json(body, { status: 201 });
}
