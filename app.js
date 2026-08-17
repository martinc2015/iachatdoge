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

    // Append User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: getCurrentTime()
    };
    addMessageToDOM(userMsg, false);
    messages.push(userMsg);
    saveMessages();

    // Trigger Bot Thinking & Reply
    showTypingIndicator();
    isBotTyping = true;
    sendBtn.disabled = true;
    messageInput.disabled = true;

    const thinkingTime = Math.min(Math.max(text.length * 20, 600), 1600);

    setTimeout(() => {
      const botResponseText = generateBotReply(text);
      hideTypingIndicator();

      const botMsg = {
        id: Date.now(),
        sender: 'bot',
        text: botResponseText,
        time: getCurrentTime()
      };
      messages.push(botMsg);
      saveMessages();

      // Render with progressive Typewriter effect
      addMessageToDOM(botMsg, true, () => {
        isBotTyping = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
      });
    }, thinkingTime);
  }

  /**
   * Normalization & Spanish Stemmer Helpers
   */
  function normalizeSpanish(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getWordStems(text) {
    const normalized = normalizeSpanish(text);
    const words = normalized.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(w => w.length > 1);
    
    const stemmerFn = (typeof window !== 'undefined' && (
      (typeof window.stemmerEs === 'function' && window.stemmerEs) ||
      (typeof window.stemmer === 'function' && window.stemmer) ||
      (window.stemmer_es && typeof window.stemmer_es.stemmer === 'function' && window.stemmer_es.stemmer)
    )) || simpleSpanishStemmer;

    return words.map(w => {
      try {
        return stemmerFn(w);
      } catch (e) {
        return simpleSpanishStemmer(w);
      }
    });
  }

  function simpleSpanishStemmer(word) {
    return word
      .replace(/(es|as|os|ar|er|ir|ando|endo|ado|ido|mente|ito|ita|itos|itas|cion|s)$/g, '');
  }

  /**
   * Generates intelligent and fun replies with Spanish Stemmer NLP
   */
  function generateBotReply(prompt) {
    const rawClean = prompt.trim();
    const clean = normalizeSpanish(rawClean);
    const stems = getWordStems(rawClean);

    // Regla 1 (Prioridad emoji/caca): Si contiene 💩 o caca, popo, mierda
    if (prompt.includes('💩') || clean.includes('caca') || clean.includes('popo') || clean.includes('mierda')) {
      return `me hago caca 💩`;
    }

    // Regla 2 (Probabilidad espontánea): 2% de probabilidad en cualquier otra charla
    if (Math.random() < 0.02) {
      return `me hago caca 💩`;
    }

    // Compromise NLP Analysis (Entidades)
    if (typeof window !== 'undefined' && typeof window.nlp === 'function') {
      try {
        const doc = window.nlp(rawClean);
        const nlpPeople = doc.people().out('array');
        const nlpPlaces = doc.places().out('array');
        
        if (nlpPeople && nlpPeople.length > 0 && !clean.includes('son bot')) {
          return `He detectado que mencionás a **${escapeHtml(nlpPeople[0])}**. ¿Qué relación tenés con esa persona? Mis sensores caninos están atentos 🐶🔍.`;
        }
        if (nlpPlaces && nlpPlaces.length > 0) {
          return `¡**${escapeHtml(nlpPlaces[0])}**! Suena a un gran lugar para pasear, explorar y buscar snacks 🌍🐾.`;
        }
      } catch (e) {
        console.warn('Compromise NLP error:', e);
      }
    }

    // Regla 3 (NLP con Stemmer en español)
    const hasStem = (...prefixes) => stems.some(s => prefixes.some(p => s.startsWith(p) || clean.includes(p)));

    // A. Comida / Hambre (stem: 'com', 'morfi', 'asad', 'hambri')
    if (hasStem('morf', 'asad', 'hambri', 'comid', 'croquet', 'pizz', 'hues', 'almuerz', 'cen', 'carn')) {
      const foodReplies = [
        `¡Alguien dijo comida! 🤤🥩 Como buen perrito, apoyo firmemente un asado con achuras o unas ricas croquetas. ¿Invitás? 🍖`,
        `¡Much morfi, very asado! 🐾 Si hay pizza o carne de por medio, contá conmigo para vigilar que no se queme nada. 🍕🔥`,
        `Detecto niveles altos de apetito en el ambiente 🦴. Momento ideal para hacer una pausa y buscar algo rico para comer.`
      ];
      return foodReplies[Math.floor(Math.random() * foodReplies.length)];
    }

    // B. Saludos (stem: 'hol', 'buen', 'ond')
    if (hasStem('hol', 'buen', 'ond', 'salud', 'hey') || clean.includes('que onda') || clean.includes('que tal')) {
      const greetings = [
        `¡Hola! Much wow 👋 ¿En qué te puedo ayudar hoy? Puedes hacerme preguntas, pedirme ideas o código.`,
        `¡Wof! Buenas humanas/os 🐾 ¿Qué consulta traes para los servidores de Son Bot hoy?`,
        `¡Hola humano! Sistema online y ladrando a 1000 RPM. ¿De qué charlamos? 🚀`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // C. Estado / Ánimo (stem: 'com', 'est', 'hac', 'and')
    if (hasStem('est', 'and') && (clean.includes('como') || clean.includes('que') || clean.includes('bien') || clean.includes('mal'))) {
      const statusReplies = [
        `¡Excelente! 100% de batería, 0% de bugs y con muchas ganas de ayudarte (o de correr en círculos) 🐶✨`,
        `Operando en parámetros óptimos. Con algo de calor en la CPU pero muy contento de estar acá 💻🐾`,
        `¡Todo de diez! Listo para procesar cualquier pregunta que me tires. ¿Vos qué tal? 😄`
      ];
      return statusReplies[Math.floor(Math.random() * statusReplies.length)];
    }

    // D. Programación (stem: 'codig', 'bug', 'despleg', 'commit', 'git', 'program')
    if (hasStem('codig', 'bug', 'despleg', 'commit', 'git', 'program', 'javascript', 'html', 'css', 'react', 'nod', 'python', 'desarroll')) {
      const devReplies = [
        `Aquí tienes un ejemplo de función útil en **JavaScript** para generar colores aleatorios:\n\n\`\`\`javascript\nfunction getRandomColor() {\n  const letters = '0123456789ABCDEF';\n  let color = '#';\n  for (let i = 0; i < 6; i++) {\n    color += letters[Math.floor(Math.random() * 16)];\n  }\n  return color;\n}\n\nconsole.log(getRandomColor()); // e.g. #00F0FF\n\`\`\``,
        `¡Ah, la vida del dev! 👨‍💻 Un commit más, cero bugs (esperemos) y directo a producción con GitHub Actions. ¡Much deploy! 🚀`,
        `Tip de programación: si el código funciona a la primera, sospechá; si tira error, es porque le falta café (o un hueso) ☕🐶.`
      ];
      return devReplies[Math.floor(Math.random() * devReplies.length)];
    }

    // E. Insultos / Quejas (stem: 'inutil', 'mal', 'tont', 'tarad')
    if (hasStem('inutil', 'tont', 'tarad', 'horribl', 'basur', 'feo') || clean.includes('no servis') || clean.includes('no sirves')) {
      const complaintReplies = [
        `Oye, mis sentimientos binarios son frágiles 🥺. Voy a tener que reiniciarme para olvidar eso.`,
        `Disculpá si fallé, solo soy un perrito digital corriendo en JavaScript 🐕🔧. ¡Prometo mejorar!`,
        `Error 500: Nivel de ofensa superó la memoria RAM. Procedo a pedirte perdón con carita tierna 🐶.`
      ];
      return complaintReplies[Math.floor(Math.random() * complaintReplies.length)];
    }

    // F. Chistes y Humor
    if (hasStem('chist', 'brom', 'gracios', 'humor')) {
      const jokes = [
        `— ¿Por qué los pájaros no usan WhatsApp?\n— ¡Porque ya tienen Twitter! 🐦 *Much comedy, very laugh.*`,
        `— ¿Qué le dice un bit a otro bit?\n— Nos vemos en el bus. 🚌`,
        `Hay 10 tipos de personas en el mundo: las que entienden binario y las que no. 🤖`,
        `— Papá, papá, ¿qué se siente tener un hijo tan inteligente y guapo?\n— No lo sé hijo, pregúntale a tu abuelo. 😎`,
        `— ¿Cómo se despiden los químicos?\n— Ácido un placer. 🧪`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // G. Motivación
    if (hasStem('motiv', 'fras', 'anim', 'inspiracion')) {
      const quotes = [
        `*"El único modo de hacer un gran trabajo es amar lo que haces."* — Steve Jobs 🚀`,
        `*"No cuentes los días, haz que los días cuenten."* — Muhammad Ali 🥊`,
        `*"Much study, very knowledge, so success."* — Doge Proverb 🐾`,
        `*"El éxito es la suma de pequeños esfuerzos repetidos día tras día."* — Robert Collier 🌟`
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }

    // H. Preguntas (signos o stems porqu, cuand, dond, quien, que, com)
    if (prompt.includes('?') || prompt.includes('¿') || hasStem('porqu', 'cuand', 'dond', 'quien')) {
      if (clean.includes('por que') || clean.includes('porque') || clean.includes('why')) {
        return `El 'por qué' es un gran misterio del universo canino... pero según mis cálculos, se debe a una mezcla de casualidad y buena onda 🪐✨.`;
      }
      if (clean.includes('cuando') || clean.includes('when')) {
        return `Según mis relojes cuánticos: el momento ideal es **ahora mismo** (o justo después de una buena siesta) ⏰✨.`;
      }
      if (clean.includes('donde') || clean.includes('where')) {
        return `No tengo las coordenadas GPS exactas, pero si hay buena onda y amigos, seguro es el lugar correcto 📍🐶.`;
      }
      const questionReplies = [
        `Buena pregunta... según mis cálculos cuánticos caninos, la probabilidad de éxito es del 99.9% 🐕📊`,
        `Mmm, déjame oler esa consulta... 🤔 ¡Definitivamente tiene sentido! Aunque yo recomendaría avanzar con precaución.`,
        `Como IA perruna, mi respuesta es: si te hace feliz (como a mí una pelota de tenis), dale para adelante 🎾✨`,
        `Esa es una pregunta profunda. Dame un segundo que consulto a los satélites caninos... 🛰️🐾 ¡Todo apunta a que sí!`
      ];
      return questionReplies[Math.floor(Math.random() * questionReplies.length)];
    }

    // Elogios
    if (hasStem('graci', 'genial', 'excelent', 'crack', 'geni', 'cap', 'am', 'gros')) {
      return `¡De nada! Ha sido un placer ayudarte. Si necesitas algo más, aquí estaré. 🐶✨`;
    }

    // Identidad
    if (clean.includes('quien eres') || clean.includes('quien sos') || clean.includes('son bot')) {
      return `¡Soy **Son Bot**! 🤖🐕 Tu asistente canino virtual, guardián de este chat con IA y tecnología de punta.`;
    }

    // Fallback: Pool variado de respuestas aleatorias
    const defaultReplies = [
      "me hago caca 💩",
      "Much wow, no entendí nada pero suena importante 🐶",
      "Mi único circuito funcional acaba de reiniciar... ¿me lo decís de nuevo? 🤖",
      "Procesando... Error 404: Cerebro canino no encontrado 🦴",
      "Estoy ocupado persiguiéndome la cola, preguntame otra cosa 🐾",
      "Interesante planteo... procedo a ignorarlo educadamente 🕶️",
      "He analizado tu mensaje y la respuesta del universo es: tal vez 🪐"
    ];
    return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
  }

  /**
   * DOM Insertion
   */
  function addMessageToDOM(msg, isTypewriter = false, onComplete = null) {
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

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = msg.time;

    contentWrapper.appendChild(bubble);
    contentWrapper.appendChild(time);

    row.appendChild(avatar);
    row.appendChild(contentWrapper);

    chatMessages.appendChild(row);

    if (isTypewriter && msg.sender === 'bot') {
      const fullText = msg.text;
      let currentIndex = 0;
      const speed = 18; // ms por tick
      const step = 2;   // caracteres por tick para fluidez

      const timer = setInterval(() => {
        currentIndex = Math.min(currentIndex + step, fullText.length);
        const currentSlice = fullText.substring(0, currentIndex);
        bubble.textContent = currentSlice;
        scrollToBottom();

        if (currentIndex >= fullText.length) {
          clearInterval(timer);
          bubble.innerHTML = formatMarkdown(fullText);
          scrollToBottom();
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }
      }, speed);
    } else {
      bubble.innerHTML = formatMarkdown(msg.text);
      scrollToBottom();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
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
