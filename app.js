const planButtons = [...document.querySelectorAll('.plan-card')];
const answerButtons = [...document.querySelectorAll('.answer-pill')];
const selectionHint = document.querySelector('#selectionHint');
const replyForm = document.querySelector('#replyForm');
const formMessage = document.querySelector('#formMessage');
const dateField = document.querySelector('#dateField');
const replySummary = document.querySelector('#replySummary');
const messageInput = document.querySelector('#guestMessage');
const messageCount = document.querySelector('#messageCount');
const submitButton = document.querySelector('#submitButton');
const formStatus = document.querySelector('#formStatus');
const soundButton = document.querySelector('#soundButton');
const toast = document.querySelector('#toast');

const state = { plan: '', answer: '', soundOn: false };
const answerCopy = {
  'Đồng ý đi chơi': { message: 'Yay! Tớ đang vui hơn một chút rồi đó. Cho tớ biết thêm nha ✨', dateVisible: true },
  'Cần xem lại lịch': { message: 'Tất nhiên rồi! Nếu muốn, cậu có thể gợi ý một ngày dễ sắp xếp hơn.', dateVisible: true },
  'Hẹn một dịp khác': { message: 'Không sao hết nha. Cảm ơn cậu đã trả lời thật lòng ♡', dateVisible: false },
};

function selectRadio(buttons, selected) {
  buttons.forEach((button) => {
    const active = button === selected;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-checked', String(active));
    const check = button.querySelector('.plan-card__check');
    if (check) check.textContent = active ? 'đã chọn plan này ♥' : 'chọn plan này ♡';
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  })[character]);
}

function updateSummary() {
  if (!state.answer) return;
  replySummary.innerHTML = `<span>Tóm tắt chiếc hẹn</span><strong>${escapeHtml(state.answer)}</strong><small>${escapeHtml(state.plan || 'Mình sẽ chọn kế hoạch sau')}</small>`;
}

planButtons.forEach((button) => button.addEventListener('click', () => {
  selectRadio(planButtons, button);
  state.plan = button.dataset.plan;
  selectionHint.textContent = `Đã chọn: ${state.plan}. Nghe vui đó!`;
  updateSummary();
  playTone(440);
}));

answerButtons.forEach((button) => button.addEventListener('click', () => {
  selectRadio(answerButtons, button);
  state.answer = button.dataset.answer;
  const copy = answerCopy[state.answer];
  formMessage.textContent = copy.message;
  dateField.hidden = !copy.dateVisible;
  replyForm.hidden = false;
  formStatus.hidden = true;
  updateSummary();
  playTone(state.answer === 'Đồng ý đi chơi' ? 660 : 520);
  window.setTimeout(() => replyForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}));

messageInput.addEventListener('input', () => { messageCount.textContent = messageInput.value.length; });

function setSending(sending) {
  submitButton.disabled = sending;
  submitButton.querySelector('.submit-text').hidden = sending;
  submitButton.querySelector('.submit-loading').hidden = !sending;
}

replyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.answer || document.querySelector('#websiteField').value) return;
  setSending(true);
  formStatus.hidden = true;

  const guestName = document.querySelector('#guestName').value.trim() || 'Không ghi tên';
  const preferredDate = dateField.hidden ? 'Không áp dụng' : document.querySelector('#preferredDate').value || 'Chưa chọn ngày';
  const guestMessage = messageInput.value.trim() || 'Không có lời nhắn';
  const formData = new FormData();
  formData.append('_subject', `💌 Có phản hồi mới: ${state.answer}`);
  formData.append('_template', 'table');
  formData.append('_captcha', 'false');
  formData.append('_honey', '');
  formData.append('_url', window.location.href);
  formData.append('Người trả lời', guestName);
  formData.append('Câu trả lời', state.answer);
  formData.append('Kế hoạch được chọn', state.plan || 'Chưa chọn kế hoạch');
  formData.append('Ngày đề xuất', preferredDate);
  formData.append('Lời nhắn', guestMessage);
  formData.append('Thời điểm gửi', new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));

  try {
    // FormSubmit's AJAX response can be blocked by browser CORS on static hosts.
    // A no-cors form POST still delivers the response without exposing its body.
    await fetch('https://formsubmit.co/lequocanhaz@gmail.com', {
      method: 'POST', mode: 'no-cors', body: formData,
    });
    replyForm.hidden = true;
    formStatus.className = 'form-status form-status--success';
    formStatus.innerHTML = '<span class="status-emoji" aria-hidden="true">💌</span><strong>Gửi thành công rồi!</strong><p>Cảm ơn cậu đã trả lời. Chiếc thông báo đang bay đến hộp thư nè.</p>';
    formStatus.hidden = false;
    launchConfetti();
    playSuccess();
  } catch {
    const subject = encodeURIComponent(`Phản hồi lời mời: ${state.answer}`);
    const body = encodeURIComponent(`Tên: ${guestName}\nCâu trả lời: ${state.answer}\nKế hoạch: ${state.plan || 'Chưa chọn'}\nNgày: ${preferredDate}\nLời nhắn: ${guestMessage}`);
    formStatus.className = 'form-status form-status--error';
    formStatus.innerHTML = `<span class="status-emoji" aria-hidden="true">🥺</span><strong>Chiếc thư chưa bay đi được.</strong><p>Cậu có thể <a href="mailto:lequocanhaz@gmail.com?subject=${subject}&body=${body}">gửi bằng ứng dụng email</a> giúp tớ nhé.</p>`;
    formStatus.hidden = false;
  } finally { setSending(false); }
});

let audioContext;
function playTone(frequency, delay = 0, duration = 0.12, force = false) {
  if (!state.soundOn && !force) return;
  const AudioApi = window.AudioContext || window.webkitAudioContext;
  if (!AudioApi) return;
  audioContext ||= new AudioApi();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + delay;
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration + 0.02);
}
function playSuccess(force = false) { [523, 659, 784].forEach((frequency, index) => playTone(frequency, index * 0.09, 0.18, force)); }

soundButton.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundButton.setAttribute('aria-pressed', String(state.soundOn));
  soundButton.classList.toggle('is-on', state.soundOn);
  soundButton.querySelector('.sound-button__label').textContent = state.soundOn ? 'đã bật âm thanh' : 'bật chút vui';
  if (state.soundOn) { playSuccess(true); showToast('Đã bật những tiếng “ting” bé xíu ♫'); }
});

function showToast(message) {
  toast.textContent = message; toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function launchConfetti() {
  const layer = document.querySelector('#confettiLayer');
  const colors = ['#ef6f61', '#f5b84b', '#7da384', '#8172b2', '#ffb8ad'];
  for (let index = 0; index < 55; index += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    piece.style.setProperty('--duration', `${2.2 + Math.random() * 1.8}s`);
    piece.style.setProperty('--spin', `${360 + Math.random() * 720}deg`);
    piece.style.background = colors[index % colors.length];
    piece.className = index % 4 === 0 ? 'confetti confetti--heart' : 'confetti';
    layer.appendChild(piece); window.setTimeout(() => piece.remove(), 4600);
  }
}

const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
document.querySelector('#preferredDate').min = today.toISOString().split('T')[0];

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add('is-revealed');
}), { threshold: 0.12 });
document.querySelectorAll('.section-heading, .plan-card, .reply__card').forEach((element) => {
  element.classList.add('reveal'); observer.observe(element);
});
