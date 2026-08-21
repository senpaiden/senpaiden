import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params: _params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ success: true });
}
