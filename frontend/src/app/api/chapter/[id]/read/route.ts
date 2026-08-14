import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ success: true });
}
