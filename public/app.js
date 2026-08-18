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
const questionOffers = Object.create(null);
const questionsForCase = () => caseData.questions?.length ? caseData.questions : defaultQuestions;

function offeredQuestions(suspectId) {
  const questions = questionsForCase();
  const history = interviewHistory[suspectId] || [];
  const asked = new Set(history.filter(item => item.questionId).map(item => item.questionId));
  const current = (questionOffers[suspectId] || []).filter(id => !asked.has(id));
  const candidates = questions.filter(question => !asked.has(question.id) && !current.includes(question.id));
  while (current.length < 3 && candidates.length) {
    const index = Math.floor(Math.random() * candidates.length);
    current.push(candidates.splice(index, 1)[0].id);
  }
  questionOffers[suspectId] = current;
  return current.map(id => questions.find(question => question.id === id)).filter(Boolean);
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function typeAnswer(element, text) {
  await delay(320);
  element.classList.remove('thinking');
  element.classList.add('typing-answer');
  element.removeAttribute('aria-label');
  element.textContent = '';
  const characters = [...String(text)];
  for (let index = 0; index < characters.length; index += 1) {
    element.textContent += characters[index];
    if (index % 4 === 0) element.parentElement.scrollTop = element.parentElement.scrollHeight;
    await delay(/[.!?…]/.test(characters[index]) ? 85 : 18);
  }
  element.classList.remove('typing-answer');
}

function render() {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === activeView));
  if (activeView === 'overview') {
    const overview = caseData.overview || { heading: 'Cánh cửa khóa từ bên trong', report: '22:15, nhân viên phá cửa phòng VIP số 3. Trần Minh Khang gục bên bàn, cạnh phần tráng miệng còn dang dở.', quote: '“Không ai bước vào căn phòng đó sau 22 giờ.”', hint: 'Một lời khai đúng vẫn có thể che giấu một giả định sai.' };
    view.innerHTML = `<div class="overview-grid"><article class="paper-card"><div class="eyebrow">BÁO CÁO HIỆN TRƯỜNG</div><h3>${escapeHtml(overview.heading)}</h3><p>${escapeHtml(overview.report)}</p><div class="quote">${escapeHtml(overview.quote)}</div></article><aside class="objective"><div class="eyebrow">NHIỆM VỤ CỦA BẠN</div><h3>Tìm ra sự thật trước khi quá muộn.</h3><div class="check-row"><i>01</i><span>Xem hồ sơ và động cơ của từng nghi phạm.</span></div><div class="check-row"><i>02</i><span>Đối chiếu lời khai với toàn bộ vật chứng.</span></div><div class="check-row"><i>03</i><span>Hỏi cung, tìm mâu thuẫn và đưa ra kết luận.</span></div><div class="hint">GỢI Ý — ${escapeHtml(overview.hint)}</div></aside></div>`;
  }
  if (activeView === 'suspects') view.innerHTML = `<div class="section-head"><h2>Danh sách nghi phạm</h2><p>Chọn một hồ sơ để đưa vào phòng hỏi cung</p></div><div class="suspect-grid">${caseData.suspects.map((s, i) => `<article class="suspect-card" data-id="${s.id}"><div class="portrait"><img src="${s.portrait || `assets/suspects/${s.id}.png`}" alt="Nhân vật ${s.name}" loading="lazy"><span>${String(i + 1).padStart(2, '0')}</span></div><div class="suspect-info"><h3>${s.name}</h3><p>${s.role.toUpperCase()}</p><small>${s.motive}</small></div></article>`).join('')}</div>`;
  if (activeView === 'evidence') view.innerHTML = `<div class="section-head"><h2>Kho bằng chứng</h2><p>Tất cả vật chứng đã được niêm phong</p></div><div class="evidence-grid">${caseData.evidence.map((e, i) => `<article class="evidence-card"><span class="ev-num">EV–0${i + 1}</span><span class="tag">${e.tag}</span><h3>${e.title}</h3><p>${e.text}</p></article>`).join('')}</div>`;
  if (activeView === 'interrogate') renderInterrogation();
  bindDynamic();
}

function renderInterrogation() {
  const s = suspectById(activeSuspect);
  const history = interviewHistory[activeSuspect] || [];
  const messages = history.length
    ? history.map(item => `<div class="message ${item.role === 'user' ? 'user' : ''}">${escapeHtml(item.text)}</div>`).join('')
    : '<div class="message">Tôi đã khai những gì mình biết. Điều tra viên muốn hỏi gì?</div>';
  const choices = offeredQuestions(activeSuspect);
  const turn = history.filter(item => item.questionId).length + 1;
  const choicePanel = choices.length
    ? `<div class="question-panel"><div class="question-panel-head"><span>CHỌN 1 CÂU HỎI</span><small>LƯỢT ${String(turn).padStart(2, '0')} · ${choices.length} LỰA CHỌN</small></div><div class="question-grid">${choices.map((q, i) => `<button class="question-choice" data-question="${q.id}"><b>0${i + 1}</b><span>${q.label}</span><i>→</i></button>`).join('')}</div></div>`
    : `<div class="question-panel question-complete"><strong>ĐÃ KHAI THÁC HẾT LỜI KHAI CỦA NGHI PHẠM NÀY</strong><span>Chọn một nghi phạm khác hoặc đối chiếu với kho bằng chứng.</span></div>`;
  const portrait = s.portrait || `assets/suspects/${s.id}.png`;
  view.innerHTML = `<div class="section-head"><h2>Phòng hỏi cung</h2></div><div class="interrogate-layout"><div class="person-list">${caseData.suspects.map(x => `<button class="person-btn ${x.id === activeSuspect ? 'active' : ''}" data-person="${x.id}">${x.name}<small>${x.role}</small></button>`).join('')}</div><div class="chat"><div class="chat-head"><span>●</span>Đang hỏi cung: <strong>${s.name}</strong></div><div class="messages" id="messages">${messages}</div>${choicePanel}</div><aside class="interrogate-portrait"><div class="interrogate-photo"><img src="${portrait}" alt="Chân dung ${escapeHtml(s.name)}"></div><span>NGHI PHẠM ĐANG HỎI CUNG</span><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.role)}</p><small>THÁI ĐỘ · ${escapeHtml(s.tone).toUpperCase()}</small></aside></div>`;
}

function bindDynamic() {
  document.querySelectorAll('.suspect-card').forEach(c => c.onclick = () => { activeSuspect = c.dataset.id; activeView = 'interrogate'; render(); });
  document.querySelectorAll('.person-btn').forEach(b => b.onclick = () => { activeSuspect = b.dataset.person; render(); });
  document.querySelectorAll('.question-choice').forEach(button => button.onclick = async () => {
    const presetQuestions = questionsForCase();
    const suspectId = activeSuspect;
    const option = presetQuestions.find(q => q.id === button.dataset.question);
    const history = interviewHistory[suspectId] || (interviewHistory[suspectId] = []);
    const messages = document.querySelector('#messages');
    document.querySelectorAll('.question-choice').forEach(x => x.disabled = true);
    document.querySelectorAll('.person-btn').forEach(x => x.disabled = true);
    button.classList.add('loading');
    messages.insertAdjacentHTML('beforeend', `<div class="message user">${escapeHtml(option.label)}</div>`);
    messages.insertAdjacentHTML('beforeend', '<div class="message thinking" aria-label="Nghi phạm đang suy nghĩ"><i></i><i></i><i></i></div>');
    const answerBubble = messages.lastElementChild;
    messages.scrollTop = messages.scrollHeight;
    try {
      const result = await api('/api/interrogate', { method: 'POST', body: JSON.stringify({ caseId: caseData.id, suspectId, questionId: option.id, question: option.label }) });
      await typeAnswer(answerBubble, result.answer);
      history.push({ role: 'user', text: option.label, questionId: option.id }, { role: 'answer', text: result.answer });
      questionOffers[suspectId] = (questionOffers[suspectId] || []).filter(id => id !== option.id);
      render();
      const updatedMessages = document.querySelector('#messages');
      updatedMessages.scrollTop = updatedMessages.scrollHeight;
    } catch {
      messages.insertAdjacentHTML('beforeend', '<div class="message">Mất kết nối với phòng điều tra. Hãy thử lại.</div>');
      answerBubble.remove();
      button.classList.remove('loading');
      document.querySelectorAll('.question-choice').forEach(choice => { choice.disabled = false; });
      document.querySelectorAll('.person-btn').forEach(person => { person.disabled = false; });
      messages.scrollTop = messages.scrollHeight;
    }
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
document.querySelector('#accuseDialog .dialog-close').onclick = () => accuseDialog.close();
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
  location.href = '/index.html';
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
