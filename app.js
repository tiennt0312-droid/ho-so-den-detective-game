let caseData = null;
let activeView = 'overview', activeSuspect = 'chef', selectedAccused = null, concluded = false;
const start = Date.now(), view = document.querySelector('#view');
const suspectById = id => caseData.suspects.find(s => s.id === id);
const defaultQuestions = [
  { id: 'alibi', label: 'Bạn đã ở đâu vào thời điểm xảy ra án mạng?' },
  { id: 'motive', label: 'Mối quan hệ của bạn với nạn nhân thế nào?' },
  { id: 'clock', label: 'Bạn biết gì về chiếc đồng hồ trong bếp?' },
  { id: 'dessert', label: 'Bạn có chạm vào món tráng miệng không?' }
];
const interviewHistory = Object.create(null);
const questionsForCase = () => caseData.questions?.length ? caseData.questions : defaultQuestions;

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

function render() {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === activeView));
  if (activeView === 'overview') {
    const overview = caseData.overview || { heading: 'Cánh cửa khóa từ bên trong', report: '22:15, nhân viên phá cửa phòng VIP số 3. Trần Minh Khang gục bên bàn, cạnh phần tráng miệng còn dang dở.', quote: '“Không ai bước vào căn phòng đó sau 22 giờ.”', hint: 'Một lời khai đúng vẫn có thể che giấu một giả định sai.' };
    view.innerHTML = `<div class="overview-grid"><article class="paper-card"><div class="eyebrow">BÁO CÁO HIỆN TRƯỜNG</div><h3>${escapeHtml(overview.heading)}</h3><p>${escapeHtml(overview.report)}</p><div class="quote">${escapeHtml(overview.quote)}</div></article><aside class="objective"><div class="eyebrow">NHIỆM VỤ CỦA BẠN</div><h3>Tìm ra sự thật trước khi quá muộn.</h3><div class="check-row"><i>01</i><span>Xem hồ sơ và động cơ của từng nghi phạm.</span></div><div class="check-row"><i>02</i><span>Đối chiếu lời khai với toàn bộ vật chứng.</span></div><div class="check-row"><i>03</i><span>Hỏi cung, tìm mâu thuẫn và đưa ra kết luận.</span></div><div class="hint">GỢI Ý — ${escapeHtml(overview.hint)}</div></aside></div>`;
  }
  if (activeView === 'suspects') view.innerHTML = `<div class="section-head"><h2>Danh sách nghi phạm</h2><p>Chọn một hồ sơ để đưa vào phòng hỏi cung</p></div><div class="suspect-grid">${caseData.suspects.map((s, i) => `<article class="suspect-card" data-id="${s.id}"><div class="portrait"><img src="${s.portrait || `assets/suspects/${s.id}.png`}" alt="Nhân vật ${s.name}" loading="lazy"><span>0${i + 1} / SUBJECT</span></div><div class="suspect-info"><h3>${s.name}</h3><p>${s.role.toUpperCase()}</p><small>${s.motive}</small></div></article>`).join('')}</div>`;
  if (activeView === 'evidence') view.innerHTML = `<div class="section-head"><h2>Kho bằng chứng</h2><p>Tất cả vật chứng đã được niêm phong</p></div><div class="evidence-grid">${caseData.evidence.map((e, i) => `<article class="evidence-card"><span class="ev-num">EV–0${i + 1}</span><span class="tag">${e.tag}</span><h3>${e.title}</h3><p>${e.text}</p></article>`).join('')}</div>`;
  if (activeView === 'interrogate') renderInterrogation();
  bindDynamic();
}

function renderInterrogation() {
  const s = suspectById(activeSuspect);
  const presetQuestions = questionsForCase();
  const history = interviewHistory[activeSuspect] || [];
  const messages = history.length
    ? history.map(item => `<div class="message ${item.role === 'user' ? 'user' : ''}">${escapeHtml(item.text)}</div>`).join('')
    : '<div class="message">Tôi đã khai những gì mình biết. Điều tra viên muốn hỏi gì?</div>';
  const asked = new Set(history.filter(item => item.questionId).map(item => item.questionId));
  view.innerHTML = `<div class="section-head"><h2>Phòng hỏi cung</h2><p>Chọn câu hỏi — lời khai được lưu theo từng nghi phạm</p></div><div class="interrogate-layout"><div class="person-list">${caseData.suspects.map(x => `<button class="person-btn ${x.id === activeSuspect ? 'active' : ''}" data-person="${x.id}">${x.name}<small>${x.role}</small></button>`).join('')}</div><div class="chat"><div class="chat-head"><span>●</span>Đang hỏi cung: <strong>${s.name}</strong> · thái độ ${s.tone}</div><div class="messages" id="messages">${messages}</div><div class="question-panel"><div class="question-panel-head"><span>CHỌN CÂU HỎI</span><small id="questionProgress">${asked.size}/${presetQuestions.length} đã hỏi</small></div><div class="question-grid">${presetQuestions.map((q, i) => `<button class="question-choice ${asked.has(q.id) ? 'asked' : ''}" data-question="${q.id}" ${asked.has(q.id) ? 'disabled' : ''}><b>0${i + 1}</b><span>${q.label}</span><i>${asked.has(q.id) ? '✓' : '→'}</i></button>`).join('')}</div></div></div></div>`;
}

function bindDynamic() {
  document.querySelectorAll('.suspect-card').forEach(c => c.onclick = () => { activeSuspect = c.dataset.id; activeView = 'interrogate'; render(); });
  document.querySelectorAll('.person-btn').forEach(b => b.onclick = () => { activeSuspect = b.dataset.person; render(); });
  document.querySelectorAll('.question-choice:not(:disabled)').forEach(button => button.onclick = async () => {
    const presetQuestions = questionsForCase();
    const suspectId = activeSuspect;
    const option = presetQuestions.find(q => q.id === button.dataset.question);
    const history = interviewHistory[suspectId] || (interviewHistory[suspectId] = []);
    const messages = document.querySelector('#messages');
    document.querySelectorAll('.question-choice').forEach(x => x.disabled = true);
    button.classList.add('loading');
    messages.insertAdjacentHTML('beforeend', `<div class="message user">${escapeHtml(option.label)}</div>`);
    try {
      const result = await api('/api/interrogate', { method: 'POST', body: JSON.stringify({ caseId: caseData.id, suspectId, questionId: option.id, question: option.label }) });
      history.push({ role: 'user', text: option.label, questionId: option.id }, { role: 'answer', text: result.answer });
      messages.insertAdjacentHTML('beforeend', `<div class="message">${escapeHtml(result.answer)}</div>`);
      button.classList.remove('loading'); button.classList.add('asked'); button.querySelector('i').textContent = '✓';
      const count = history.filter(item => item.questionId).length;
      document.querySelector('#questionProgress').textContent = `${count}/${presetQuestions.length} đã hỏi`;
    } catch {
      messages.insertAdjacentHTML('beforeend', '<div class="message">Mất kết nối với phòng điều tra. Hãy thử lại.</div>');
      button.classList.remove('loading');
    }
    document.querySelectorAll('.question-choice').forEach(x => { x.disabled = x.classList.contains('asked'); });
    messages.scrollTop = messages.scrollHeight;
  });
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]); }
function applyCaseMeta() {
  const accent = caseData.titleAccent;
  const title = caseData.title || 'Hồ sơ chưa đặt tên';
  document.querySelector('#caseTitle').innerHTML = accent && title.includes(accent)
    ? `${escapeHtml(title.replace(accent, ''))}<em>${escapeHtml(accent)}</em>`
    : escapeHtml(title);
  document.querySelector('#caseCode').textContent = caseData.id.replace('-', '–');
  document.querySelector('#difficultySelect').value = caseData.id;
  document.querySelector('#caseLede').textContent = caseData.lede || 'Một căn phòng khóa kín. Năm người có động cơ. Một người đang nói dối.';
  const facts = caseData.facts || {};
  document.querySelector('#caseLocation').textContent = facts.location || 'Nhà hàng La Lune Rouge';
  document.querySelector('#caseTime').textContent = facts.time || '22:15 · 24.07.2025';
  document.querySelector('#caseVictim').textContent = facts.victim || 'Trần Minh Khang, 42';
  document.querySelector('#caseCause').textContent = facts.cause || 'Nghi ngộ độc';
  document.querySelector('#suspectCount').textContent = caseData.suspects.length;
  document.querySelector('#evidenceCount').textContent = caseData.evidence.length;
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => { activeView = t.dataset.view; render(); });
setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); document.querySelector('#timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }, 1000);

const accuseDialog = document.querySelector('#accuseDialog'), resultDialog = document.querySelector('#resultDialog');
document.querySelector('#accuseBtn').onclick = () => {
  if (concluded) return resultDialog.showModal();
  document.querySelector('#accuseList').innerHTML = caseData.suspects.map(s => `<button class="accuse-option" data-id="${s.id}">${s.name}<br><small>${s.role}</small></button>`).join('');
  accuseDialog.showModal();
  document.querySelectorAll('.accuse-option').forEach(option => option.onclick = () => { selectedAccused = option.dataset.id; document.querySelectorAll('.accuse-option').forEach(x => x.classList.toggle('selected', x === option)); document.querySelector('#confirmAccuse').disabled = false; });
};
document.querySelector('.dialog-close').onclick = () => accuseDialog.close();
document.querySelector('#confirmAccuse').onclick = async () => {
  if (!selectedAccused) return;
  const button = document.querySelector('#confirmAccuse'); button.disabled = true; button.textContent = 'ĐANG ĐỐI CHIẾU HỒ SƠ...';
  try {
    const result = await api('/api/accuse', { method: 'POST', body: JSON.stringify({ caseId: caseData.id, suspectId: selectedAccused }) });
    concluded = true; accuseDialog.close();
    document.querySelector('#resultContent').innerHTML = `<div class="result-icon">${result.correct ? '✓' : '×'}</div><div class="eyebrow">${result.correct ? 'PHÁ ÁN THÀNH CÔNG' : 'KẾT LUẬN SAI'}</div><h2>${result.correct ? 'Sự thật đã sáng tỏ.' : 'Hung thủ đã thoát.'}</h2><p>${escapeHtml(result.message)}</p><div class="solution"><strong>CHUỖI SUY LUẬN ĐÃ KHÓA</strong><br>${escapeHtml(result.explanation)}</div><button class="confirm-btn" onclick="location.reload()">CHƠI LẠI VỤ ÁN</button>`;
    resultDialog.showModal();
  } catch { button.disabled = false; button.textContent = 'BUỘC TỘI NGHI PHẠM'; }
};
document.querySelector('#newCaseBtn').onclick = () => {
  const next = caseData?.nextCaseId || (caseData?.id === 'HS-4109' ? 'HS-2507' : 'HS-4109');
  location.href = `/index.html?case=${encodeURIComponent(next)}`;
};
document.querySelector('#difficultySelect').onchange = event => {
  location.href = `/index.html?case=${encodeURIComponent(event.target.value)}`;
};

(async function startApp() {
  try {
    const requestedCase = new URLSearchParams(location.search).get('case') || 'HS-2507';
    caseData = await api(`/api/case/${encodeURIComponent(requestedCase)}`);
    activeSuspect = caseData.suspects[0].id;
    applyCaseMeta();
    render();
  }
  catch { view.innerHTML = '<div class="objective"><h3>Không thể kết nối API</h3><p>Hãy chạy file run.ps1 rồi tải lại trang.</p></div>'; }
})();
