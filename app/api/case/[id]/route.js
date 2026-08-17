import { NextResponse } from 'next/server';
import { getPublicCase } from '../../../../lib/cases';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const { id } = await params;
  return NextResponse.json(getPublicCase(id), {
    headers: { 'Cache-Control': 'no-store' }
  });
}
