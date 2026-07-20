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
const musicPlayButton = document.querySelector('#musicPlayButton');
const musicVideo = document.querySelector('#musicVideo');
const recordPlayer = document.querySelector('#recordPlayer');
const secretButton = document.querySelector('#secretButton');
const secretReveal = document.querySelector('#secretReveal');
const scrollProgress = document.querySelector('#scrollProgress');
const cursorGlow = document.querySelector('#cursorGlow');

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

musicPlayButton.addEventListener('click', () => {
  const playing = musicPlayButton.getAttribute('aria-expanded') === 'true';
  musicPlayButton.setAttribute('aria-expanded', String(!playing));
  if (playing) {
    musicVideo.replaceChildren();
    musicVideo.hidden = true;
    recordPlayer.hidden = false;
    musicPlayButton.querySelector('.music-play__icon').textContent = '▶';
    musicPlayButton.querySelector('.music-play__label').textContent = 'Phát bài “Love”';
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/9PBZy9j3H3I?autoplay=1&rel=0';
  iframe.title = 'Love — Keyshia Cole (Official Music Video)';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  musicVideo.replaceChildren(iframe);
  musicVideo.hidden = false;
  recordPlayer.hidden = true;
  musicPlayButton.querySelector('.music-play__icon').textContent = '■';
  musicPlayButton.querySelector('.music-play__label').textContent = 'Dừng bài nhạc';
  showToast('Đang phát “Love” — Keyshia Cole ♫');
});

secretButton.addEventListener('click', () => {
  const open = secretButton.getAttribute('aria-expanded') === 'true';
  secretButton.setAttribute('aria-expanded', String(!open));
  secretReveal.hidden = open;
  secretButton.textContent = open ? 'Mở lời nhắn ✦' : 'Cất lời nhắn ♡';
  if (!open) { launchConfetti(); playTone(784); }
});

function updateScrollProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

window.addEventListener('pointermove', (event) => {
  cursorGlow.style.setProperty('--pointer-x', `${event.clientX}px`);
  cursorGlow.style.setProperty('--pointer-y', `${event.clientY}px`);
});

function setSending(sending) {
  submitButton.disabled = sending;
  submitButton.querySelector('.submit-text').hidden = sending;
  submitButton.querySelector('.submit-loading').hidden = !sending;
}

replyForm.addEventListener('submit', (event) => {
  if (!state.answer || document.querySelector('#websiteField').value) {
    event.preventDefault();
    return;
  }
  setSending(true);
  formStatus.hidden = true;

  const guestName = document.querySelector('#guestName').value.trim() || 'Không ghi tên';
  const preferredDate = dateField.hidden ? 'Không áp dụng' : document.querySelector('#preferredDate').value || 'Chưa chọn ngày';
  const guestMessage = messageInput.value.trim() || 'Không có lời nhắn';
  replyForm.querySelectorAll('input[data-generated]').forEach((input) => input.remove());
  const fields = {
    _subject: `💌 Có phản hồi mới: ${state.answer}`,
    _template: 'table',
    _captcha: 'false',
    'Người trả lời': guestName,
    'Câu trả lời': state.answer,
    'Kế hoạch được chọn': state.plan || 'Chưa chọn kế hoạch',
    'Ngày đề xuất': preferredDate,
    'Lời nhắn': guestMessage,
    'Trang gửi': window.location.href,
    'Thời điểm gửi': new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  };
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value;
    input.dataset.generated = 'true'; replyForm.appendChild(input);
  });
  window.setTimeout(() => {
    replyForm.hidden = true;
    formStatus.className = 'form-status form-status--success';
    formStatus.innerHTML = '<span class="status-emoji" aria-hidden="true">💌</span><strong>Đã gửi câu trả lời!</strong><p>Cảm ơn cậu nha. Chiếc thông báo đang bay đến hộp thư rồi.</p>';
    formStatus.hidden = false;
    setSending(false);
    launchConfetti();
    playSuccess();
  }, 700);
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
document.querySelectorAll('.section-heading, .plan-card, .soundtrack__card, .secret-note__card, .reply__card').forEach((element) => {
  element.classList.add('reveal'); observer.observe(element);
});
