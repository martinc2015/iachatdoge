/**
 * Son Bot - Chat Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const charCounter = document.getElementById('char-counter');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');

  // Storage key
  const STORAGE_KEY = 'dogebot_chat_history';
  const THEME_KEY = 'dogebot_theme';

  // State
  let messages = [];
  let isBotTyping = false;

  // Initialize App
  initTheme();
  loadChatHistory();
  setupEventListeners();

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Form submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    // Auto-resize textarea & Enter key to send
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    messageInput.addEventListener('input', () => {
      // Auto-resize height
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
      
      // Update character counter
      const len = messageInput.value.length;
      charCounter.textContent = `${len} / 1000`;
    });

    // Suggestion chips
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt && !isBotTyping) {
          messageInput.value = prompt;
          handleSendMessage();
        }
      });
    });

    // Clear chat button
    clearChatBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas reiniciar la conversación?')) {
        messages = [];
        localStorage.removeItem(STORAGE_KEY);
        chatMessages.innerHTML = '';
        sendWelcomeMessage();
      }
    });

    // Emoji quick buttons
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        if (!emoji) return;

        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;

        if (typeof start === 'number' && typeof end === 'number') {
          messageInput.value = text.substring(0, start) + emoji + text.substring(end);
          messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
        } else {
          messageInput.value += emoji;
        }

        // Auto-resize height & update counter
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
        charCounter.textContent = `${messageInput.value.length} / 1000`;

        messageInput.focus();
      });
    });

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  /**
   * Handle sending user message and triggering bot response
   */
  function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text || isBotTyping) return;

    // Reset input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCounter.textContent = '0 / 1000';
    messageInput.focus();

    // Append User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: getCurrentTime()
    };
    addMessageToDOM(userMsg);
    messages.push(userMsg);
    saveMessages();

    // Trigger Bot Thinking & Reply
    showTypingIndicator();
    isBotTyping = true;

    const thinkingTime = Math.min(Math.max(text.length * 20, 800), 2000);

    setTimeout(() => {
      const botResponseText = generateBotReply(text);
      hideTypingIndicator();

      const botMsg = {
        id: Date.now(),
        sender: 'bot',
        text: botResponseText,
        time: getCurrentTime()
      };
      addMessageToDOM(botMsg);
      messages.push(botMsg);
      saveMessages();
      isBotTyping = false;
    }, thinkingTime);
  }

  /**
   * Generates intelligent and fun replies
   */
  function generateBotReply(prompt) {
    // 15% de probabilidad de responder directamente
    if (Math.random() < 0.15) {
      return `me hago caca 💩`;
    }

    const clean = prompt.toLowerCase().trim();

    if (clean.includes('hola') || clean.includes('buenas') || clean.includes('hey')) {
      return `¡Hola! Much wow 👋 ¿En qué puedo ayudarte hoy? Puedes hacerme preguntas, pedirme ideas o código.`;
    }

    if (clean.includes('que puedes hacer') || clean.includes('qué puedes hacer') || clean.includes('ayuda')) {
      return `Soy **Son Bot**, tu asistente inteligente. Puedo ayudarte con:\n\n- 💡 **Responder preguntas** generales y técnicas.\n- 💻 **Escribir y explicar código** en JS, Python, HTML, etc.\n- 🎭 **Contar chistes** y curiosidades.\n- ✨ **Redactar textos**, correos y resúmenes.\n\n*¡Pruébame haciéndome una pregunta!*`;
    }

    if (clean.includes('chiste') || clean.includes('broma') || clean.includes('gracioso')) {
      const jokes = [
        `— ¿Por qué los pájaros no usan WhatsApp?\n— ¡Porque ya tienen Twitter! 🐦 *Much comedy, very laugh.*`,
        `— ¿Qué le dice un bit a otro bit?\n— Nos vemos en el bus. 🚌`,
        `Hay 10 tipos de personas en el mundo: las que entienden binario y las que no. 🤖`,
        `— Papá, papá, ¿qué se siente tener un hijo tan inteligente y guapo?\n— No lo sé hijo, pregúntale a tu abuelo. 😎`,
        `— ¿Cómo se despiden los químicos?\n— Ácido un placer. 🧪`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (clean.includes('motivacional') || clean.includes('frase') || clean.includes('animo')) {
      const quotes = [
        `*"El único modo de hacer un gran trabajo es amar lo que haces."* — Steve Jobs 🚀`,
        `*"No cuentes los días, haz que los días cuenten."* — Muhammad Ali 🥊`,
        `*"Much study, very knowledge, so success."* — Doge Proverb 🐾`,
        `*"El éxito es la suma de pequeños esfuerzos repetidos día tras día."* — Robert Collier 🌟`
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (clean.includes('codigo') || clean.includes('código') || clean.includes('javascript') || clean.includes('program')) {
      return `Aquí tienes un ejemplo de función útil en **JavaScript** para generar colores aleatorios:\n\n` +
             `\`\`\`javascript\nfunction getRandomColor() {\n  const letters = '0123456789ABCDEF';\n  let color = '#';\n  for (let i = 0; i < 6; i++) {\n    color += letters[Math.floor(Math.random() * 16)];\n  }\n  return color;\n}\n\nconsole.log(getRandomColor()); // e.g. #F59E0B\n\`\`\``;
    }

    if (clean.includes('inteligencia artificial') || clean.includes('ia') || clean.includes('ai')) {
      return `La **Inteligencia Artificial (IA)** es la simulación de procesos de inteligencia humana por parte de máquinas y sistemas computacionales.\n\nIncluye áreas como:\n1. **Machine Learning**: Aprender patrones a partir de datos.\n2. **NLP (Procesamiento del Lenguaje Natural)**: Comprender y generar lenguaje humano como lo hacemos ahora.\n3. **Visión por Computadora**: Reconocer imágenes y videos.`;
    }

    if (clean.includes('quien eres') || clean.includes('quién eres') || clean.includes('son bot') || clean.includes('bot')) {
      return `¡Soy **Son Bot**! 🤖 Un asistente amigable creado para responder tus dudas con rapidez, inteligencia y buena energía.`;
    }

    if (clean.includes('gracias') || clean.includes('genial') || clean.includes('excelente')) {
      return `¡De nada! Ha sido un placer ayudarte. Si necesitas algo más, aquí estaré. 🐶✨`;
    }

    // Default reply
    return `me hago caca 💩`;
  }

  /**
   * DOM Insertion
   */
  function addMessageToDOM(msg) {
    const row = document.createElement('div');
    row.className = `message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`;

    const avatar = document.createElement('div');
    if (msg.sender === 'user') {
      avatar.className = 'avatar user-avatar-small';
      avatar.textContent = '👤';
    } else {
      avatar.className = 'avatar bot-avatar-small';
      const img = document.createElement('img');
      img.src = 'avatar.png';
      img.alt = 'Son Bot';
      img.className = 'avatar-img';
      img.width = 38;
      img.height = 38;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      img.style.display = 'block';
      avatar.appendChild(img);
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMarkdown(msg.text);

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = msg.time;

    contentWrapper.appendChild(bubble);
    contentWrapper.appendChild(time);

    row.appendChild(avatar);
    row.appendChild(contentWrapper);

    chatMessages.appendChild(row);
    scrollToBottom();
  }

  /**
   * Simple markdown parser for bold, lists, code blocks and paragraphs
   */
  function formatMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks ```code```
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks & lists
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    let parsedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        if (!inList) {
          parsedLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        parsedLines.push(`<li>${trimmed.substring(2)}</li>`);
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          parsedLines.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        parsedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
      } else {
        if (inList) {
          parsedLines.push(`</${listType}>`);
          inList = false;
        }
        if (trimmed.length > 0 && !trimmed.startsWith('<pre>') && !trimmed.endsWith('</pre>')) {
          parsedLines.push(`<p>${line}</p>`);
        } else {
          parsedLines.push(line);
        }
      }
    });

    if (inList) {
      parsedLines.push(`</${listType}>`);
    }

    return parsedLines.join('');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showTypingIndicator() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
  }

  function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  function loadChatHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        messages = JSON.parse(stored);
        messages.forEach(msg => addMessageToDOM(msg));
      } catch (e) {
        messages = [];
      }
    }

    if (messages.length === 0) {
      sendWelcomeMessage();
    }
  }

  function sendWelcomeMessage() {
    const welcomeMsg = {
      id: Date.now(),
      sender: 'bot',
      text: `¡Hola! Soy **Son Bot** 🤖✨ Tu asistente virtual.\n\nPuedes preguntarme lo que quieras, elegir una sugerencia de la izquierda o escribir un mensaje abajo. ¿En qué te puedo ayudar hoy?`,
      time: getCurrentTime()
    };
    addMessageToDOM(welcomeMsg);
    messages.push(welcomeMsg);
    saveMessages();
  }

  /**
   * Theme Management
   */
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) === 'pride' ? 'pride' : 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'pride' ? 'dark' : 'pride';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🏳️‍🌈' : '🌙';
    themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Activar tema RGB / Pride' : 'Volver a modo oscuro');
  }
});
