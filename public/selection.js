const caseIds = ['HS-1103', 'HS-2507', 'HS-4109', 'HS-5204'];
const ranks = { 'HS-1103': 1, 'HS-2507': 2, 'HS-4109': 3, 'HS-5204': 4 };
const grid = document.querySelector('#caseGrid');

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[char]);

function caseCard(caseData) {
  const rank = ranks[caseData.id] || 1;
  const bars = Array.from({ length: 4 }, (_, index) => `<i class="${index < rank ? 'active' : ''}"></i>`).join('');
  const facts = caseData.facts || {};
  return `<article class="case-card" data-rank="${rank}">
    <div class="card-top">
      <span class="case-code">HỒ SƠ ${escapeHtml(caseData.id)}</span>
      <span class="difficulty"><b>${escapeHtml(caseData.difficulty)}</b><span>${bars}</span></span>
    </div>
    <div class="case-number">0${rank}</div>
    <h2>${escapeHtml(caseData.title)}</h2>
    <p>${escapeHtml(caseData.lede)}</p>
    <dl>
      <div><dt>ĐỊA ĐIỂM</dt><dd>${escapeHtml(facts.location || 'Chưa xác định')}</dd></div>
      <div><dt>NẠN NHÂN</dt><dd>${escapeHtml(facts.victim || 'Chưa xác định')}</dd></div>
    </dl>
    <a class="start-btn" href="/game.html?case=${encodeURIComponent(caseData.id)}"><span>BẮT ĐẦU ĐIỀU TRA</span><b>→</b></a>
  </article>`;
}

(async function loadCases() {
  try {
    const cases = await Promise.all(caseIds.map(async id => {
      const response = await fetch(`/api/case/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`API ${response.status}`);
      return response.json();
    }));
    grid.innerHTML = cases.map(caseCard).join('');
  } catch {
    grid.innerHTML = '<div class="load-error"><strong>KHÔNG THỂ MỞ KHO HỒ SƠ</strong><span>Kiểm tra kết nối rồi thử tải lại trang.</span></div>';
  }
})();
