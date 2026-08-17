import { NextResponse } from 'next/server';
import { getCase } from '../../../lib/cases';

export const runtime = 'nodejs';

export async function POST(request) {
  const { caseId, suspectId, questionId } = await request.json();
  const caseData = getCase(caseId);
  const suspect = caseData.suspects.find(item => item.id === suspectId);
  const answer = suspect?.answers?.[questionId] || suspect?.answers?.default || 'Tôi không có câu trả lời cho câu hỏi này.';
  return NextResponse.json({ answer }, { headers: { 'Cache-Control': 'no-store' } });
}
