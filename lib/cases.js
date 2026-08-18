import easyCase from '../data/cases/easy.json';
import mediumCase from '../data/cases/medium.json';
import hardCase from '../data/cases/hard.json';

const cases = [easyCase, mediumCase, hardCase];

export function getCase(caseId) {
  return cases.find(item => item.id === caseId) || mediumCase;
}

export function getPublicCase(caseId) {
  const item = getCase(caseId);
  return {
    id: item.id,
    nextCaseId: item.nextCaseId,
    title: item.title,
    titleAccent: item.titleAccent,
    difficulty: item.difficulty,
    lede: item.lede,
    facts: item.facts,
    overview: item.overview,
    questions: item.questions || null,
    evidence: item.evidence,
    suspects: item.suspects.map(({ answers, ...suspect }) => suspect)
  };
}
