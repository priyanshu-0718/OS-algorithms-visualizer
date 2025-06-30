// Gemini AI Assistant for OS Process Scheduling Simulator
// WARNING: Never expose API keys in production! Use a backend proxy for real apps.

const GEMINI_API_KEY = 'AIzaSyBnt-a6Y6vYIYG1ILJyedh9b4rFk7OriYo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

const chatBtn = document.getElementById('ai-assistant-btn');
const chatWin = document.getElementById('ai-assistant-chat');
const closeBtn = document.getElementById('ai-assistant-close');
const messagesDiv = document.getElementById('ai-assistant-messages');
const form = document.getElementById('ai-assistant-form');
const input = document.getElementById('ai-assistant-input');
const headerBar = document.getElementById('ai-assistant-header');
const headerBtns = document.getElementById('ai-assistant-header-btns');

chatBtn.onclick = () => { chatWin.style.display = 'flex'; };

let minimized = false;
let expandBtn = null;

function showExpandBtn() {
  if (!expandBtn) {
    expandBtn = document.createElement('button');
    expandBtn.id = 'ai-assistant-expand';
    expandBtn.title = 'Expand';
    expandBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
    expandBtn.style.background = 'rgba(255,255,255,0.18)';
    expandBtn.style.border = 'none';
    expandBtn.style.color = 'white';
    expandBtn.style.fontSize = '18px';
    expandBtn.style.cursor = 'pointer';
    expandBtn.style.borderRadius = '8px';
    expandBtn.style.padding = '4px 10px';
    expandBtn.style.transition = 'background 0.2s';
    expandBtn.onmouseover = () => expandBtn.style.background = 'rgba(255,255,255,0.32)';
    expandBtn.onmouseout = () => expandBtn.style.background = 'rgba(255,255,255,0.18)';
    expandBtn.onclick = expandChat;
  }
  if (!headerBtns.contains(expandBtn)) {
    headerBtns.insertBefore(expandBtn, closeBtn);
  }
}

function hideExpandBtn() {
  if (expandBtn && headerBtns.contains(expandBtn)) {
    headerBtns.removeChild(expandBtn);
  }
}

function minimizeChat() {
  chatWin.style.height = '60px';
  chatWin.style.width = '200px';
  chatWin.style.maxHeight = '';
  chatWin.style.maxWidth = '';
  chatWin.style.top = '';
  chatWin.style.right = '30px';
  chatWin.style.bottom = '100px';
  chatWin.style.left = '';
  chatWin.style.position = 'fixed';
  chatWin.style.borderRadius = '16px';
  headerBar.style.padding = '0 20px';
  headerBar.style.justifyContent = 'center';
  headerBar.style.alignItems = 'center';
  headerBar.style.height = '60px';
  headerBar.style.fontSize = '';
  messagesDiv.style.display = 'none';
  form.style.display = 'none';
  minimized = true;
  showExpandBtn();
}

function expandChat() {
  chatWin.style.height = '90vh';
  chatWin.style.width = '500px';
  chatWin.style.maxHeight = '95vh';
  chatWin.style.maxWidth = '98vw';
  chatWin.style.top = '30px';
  chatWin.style.right = '30px';
  chatWin.style.bottom = '';
  chatWin.style.left = '';
  chatWin.style.position = 'fixed';
  chatWin.style.borderRadius = '16px';
  headerBar.style.padding = '12px 20px 12px 16px';
  headerBar.style.justifyContent = 'space-between';
  headerBar.style.alignItems = 'center';
  headerBar.style.height = '';
  headerBar.style.fontSize = '';
  messagesDiv.style.display = '';
  form.style.display = '';
  minimized = false;
  hideExpandBtn();
}

closeBtn.onclick = () => { chatWin.style.display = 'none'; minimized = false; /* reset state */
  expandChat();
};

// Double click header to minimize/expand
headerBar.ondblclick = () => {
  if (minimized) expandChat();
  else minimizeChat();
};

// Start expanded, but you can call minimizeChat() to start minimized if you want
expandChat();

function addMessage(text, from) {
  // Split text into paragraphs for readability
  let parts = text.split(/\n\n|\n/).filter(p => p.trim() !== '');
  if (parts.length === 0) parts = [text];
  parts.forEach(part => {
    const msg = document.createElement('div');
    msg.style.margin = '8px 0';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '8px';
    msg.style.maxWidth = '85%';
    msg.style.wordBreak = 'break-word';
    msg.style.background = from === 'user' ? '#e3f0ff' : '#f1f1f1';
    msg.style.alignSelf = from === 'user' ? 'flex-end' : 'flex-start';
    msg.textContent = part;
    messagesDiv.appendChild(msg);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, 'user');
  input.value = '';
  addMessage('Thinking...', 'ai');
  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      })
    });
    const data = await res.json();
    console.log('Gemini API response:', data);
    messagesDiv.removeChild(messagesDiv.lastChild);
    if (data && data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content && data.candidates[0].content.parts;
      if (parts && parts.length > 0 && parts[0].text) {
        addMessage(parts[0].text, 'ai');
      } else {
        addMessage('Sorry, I could not find an answer in the response.', 'ai');
      }
    } else if (data.error && data.error.message) {
      addMessage('API Error: ' + data.error.message, 'ai');
    } else {
      addMessage('Sorry, I could not understand that.', 'ai');
    }
  } catch (err) {
    messagesDiv.removeChild(messagesDiv.lastChild);
    addMessage('Error contacting Gemini API.', 'ai');
  }
}; 