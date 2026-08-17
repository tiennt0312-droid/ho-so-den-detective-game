import { NextResponse } from 'next/server';
import { getCase } from '../../../lib/cases';

export const runtime = 'nodejs';

export async function POST(request) {
  const { caseId, suspectId } = await request.json();
  const caseData = getCase(caseId);
  const suspect = caseData.suspects.find(item => item.id === suspectId);
  const correct = suspectId === caseData.culpritId;
  const message = correct
    ? caseData.correctMessage
    : caseData.wrongMessage.replace('{name}', suspect?.name || 'nghi phạm đã chọn');
  return NextResponse.json({ correct, message, explanation: caseData.explanation }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
