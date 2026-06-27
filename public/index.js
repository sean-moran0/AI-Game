const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');

/** @type {{ role: 'user' | 'assistant', content: string }[]} */
const history = [];

function appendMessage(role, content) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.textContent = content;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = '';
  inputEl.style.height = '';
  sendBtn.disabled = true;

  history.push({ role: 'user', content: text });
  appendMessage('user', text);

  const thinking = appendMessage('assistant', '…');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });

    const data = await res.json();

    if (!res.ok) {
      thinking.className = 'message error';
      thinking.textContent = data.error ?? 'Something went wrong.';
      history.pop();
      return;
    }

    thinking.textContent = data.response;
    history.push({ role: 'assistant', content: data.response });
  } catch {
    thinking.className = 'message error';
    thinking.textContent = 'Could not reach the server.';
    history.pop();
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

sendBtn.addEventListener('click', send);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = '';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
});
