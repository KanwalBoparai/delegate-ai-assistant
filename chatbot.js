/**
 * AI Chat Voice Bot Assistant
 * A beautiful, voice-enabled AI assistant widget for websites
 */

class AIChatbot {
  constructor(options = {}) {
    // Configuration
    this.config = {
      apiUrl: options.apiUrl || 'http://localhost:3000/api/chat',
      position: options.position || 'bottom-right',
      theme: options.theme || 'light',
      enableVoice: options.enableVoice !== false,
      initialMessage: options.initialMessage || "Hi! 👋 How can I help you today?",
    };

    // State
    this.isOpen = false;
    this.isMinimized = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentPage = this.detectPage();
    this.conversationHistory = this.loadConversationHistory();
    this.recognition = null;
    this.synthesis = window.speechSynthesis;

    // Initialize
    this.init();
  }

  /**
   * Initialize the chatbot
   */
  init() {
    this.createWidget();
    this.attachEventListeners();
    this.initSpeechRecognition();
    this.monitorPageChanges();
    this.showInitialGreeting();
  }

  /**
   * Create the chatbot widget UI
   */
  createWidget() {
    // Widget container
    const widget = document.createElement('div');
    widget.id = 'ai-chatbot-widget';
    widget.className = `chatbot-widget chatbot-${this.config.position} chatbot-${this.config.theme}`;
    widget.innerHTML = `
      <!-- Chat window -->
      <div class="chatbot-window">
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-content">
            <h3>⚡ Delegate AI</h3>
            <span class="chatbot-status">Online</span>
          </div>
          <div class="chatbot-controls">
            <button class="chatbot-btn-minimize" title="Minimize">−</button>
            <button class="chatbot-btn-close" title="Close">✕</button>
          </div>
        </div>

        <!-- Messages container -->
        <div class="chatbot-messages">
          <div class="chatbot-message bot initial-greeting">
            <div class="message-avatar">⚡</div>
            <div class="message-content">
              <p>${this.config.initialMessage}</p>
            </div>
          </div>
        </div>

        <!-- Input area -->
        <div class="chatbot-input-area">
          <div class="input-wrapper">
            <input 
              type="text" 
              class="chatbot-input" 
              placeholder="Ask me anything..." 
              autocomplete="off"
            />
            ${this.config.enableVoice ? `
              <button class="chatbot-btn-voice" title="Speak (Cmd+M)">
                <span class="voice-icon">🎤</span>
              </button>
            ` : ''}
            <button class="chatbot-btn-send" title="Send">↑</button>
          </div>
          <div class="input-hints">
            ${this.config.enableVoice ? '<span>⌘K to toggle · ⌘M for voice</span>' : '<span>⌘K to toggle chat</span>'}
          </div>
        </div>
      </div>

      <!-- Toggle button (when minimized) -->
      <button class="chatbot-toggle" title="Open chat (Cmd+K)">
        <span class="toggle-icon">⚡</span>
        <span class="toggle-text">Chat</span>
      </button>
    `;

    document.body.appendChild(widget);
    this.widget = widget;
    this.windowEl = widget.querySelector('.chatbot-window');
    this.messagesEl = widget.querySelector('.chatbot-messages');
    this.inputEl = widget.querySelector('.chatbot-input');
    this.sendBtn = widget.querySelector('.chatbot-btn-send');
    this.voiceBtn = widget.querySelector('.chatbot-btn-voice');
    this.closeBtn = widget.querySelector('.chatbot-btn-close');
    this.minimizeBtn = widget.querySelector('.chatbot-btn-minimize');
    this.toggleBtn = widget.querySelector('.chatbot-toggle');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Input events
    this.inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Voice button
    if (this.voiceBtn) {
      this.voiceBtn.addEventListener('click', () => this.toggleListening());
    }

    // Window controls
    this.closeBtn.addEventListener('click', () => this.close());
    this.minimizeBtn.addEventListener('click', () => this.minimize());
    this.toggleBtn.addEventListener('click', () => this.open());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.isOpen ? this.close() : this.open();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm' && this.config.enableVoice) {
        e.preventDefault();
        this.toggleListening();
      }
    });

    // Focus on input when opened
    this.widget.addEventListener('animationend', () => {
      if (this.isOpen && !this.isMinimized) {
        this.inputEl.focus();
      }
    });
  }

  /**
   * Initialize speech recognition
   */
  initSpeechRecognition() {
    if (!this.config.enableVoice) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      if (this.voiceBtn) this.voiceBtn.style.display = 'none';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.voiceBtn.classList.add('active');
      this.voiceBtn.title = 'Listening... (click to stop)';
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.inputEl.value = transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (interimTranscript) {
        this.inputEl.placeholder = `Listening: "${interimTranscript}"...`;
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.voiceBtn.classList.remove('active');
      this.voiceBtn.title = 'Speak (Cmd+M)';
      this.inputEl.placeholder = 'Type or use voice...';
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.addMessage('Sorry, I couldn\'t hear that. Please try again.', 'bot');
    };
  }

  /**
   * Toggle listening state
   */
  toggleListening() {
    if (!this.recognition) return;

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.inputEl.value = '';
      this.recognition.start();
    }
  }

  /**
   * Detect current page
   */
  detectPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('features')) return 'features';
    if (path.includes('contact')) return 'contact';
    return 'general';
  }

  /**
   * Monitor page changes
   */
  monitorPageChanges() {
    window.addEventListener('hashchange', () => {
      const newPage = this.detectPage();
      if (newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.pageChanged();
      }
    });

    // For single-page apps with history API
    window.addEventListener('popstate', () => {
      const newPage = this.detectPage();
      if (newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.pageChanged();
      }
    });
  }

  /**
   * Handle page changes
   */
  pageChanged() {
    const suggestions = {
      home: "Welcome! You're on our home page. I can help you learn about our platform. What would you like to know?",
      pricing: "You're on our pricing page. I can help explain our plans and answer billing questions.",
      features: "You're checking out our features! Want me to explain any specific feature in detail?",
      contact: "You're on the contact page. I can help guide you to the right team or answer common questions.",
      general: "I'm here to help! What can I assist you with?"
    };

    const message = suggestions[this.currentPage] || suggestions.general;
    // Only add suggestion if user hasn't interacted recently
    if (this.conversationHistory.length <= 1) {
      this.addMessage(message, 'bot', true);
    }
  }

  /**
   * Show initial greeting
   */
  showInitialGreeting() {
    // Initial message is already in the DOM
    // Auto-open on desktop only, not on mobile
    const isMobile = window.innerWidth <= 640;
    if (!isMobile) {
      this.open();
    }
  }

  /**
   * Send message
   */
  async sendMessage() {
    const message = this.inputEl.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    this.inputEl.value = '';
    this.inputEl.focus();

    // Show typing indicator
    this.showTypingIndicator();

    // Get AI response
    try {
      const response = await this.getAIResponse(message);
      this.removeTypingIndicator();
      this.addMessage(response, 'bot');

      // Speak response if voice is enabled
      if (this.config.enableVoice) {
        this.speak(response);
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      console.error('Chat error:', error);
    }
  }

  /**
   * Get AI response from backend
   */
  async getAIResponse(userMessage) {
    // Build conversation context
    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add current page context
    const contextMessage = `[User is currently on the ${this.currentPage} page]`;
    messages.push({
      role: 'user',
      content: userMessage + ' ' + contextMessage
    });

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  }

  /**
   * Add message to chat
   */
  addMessage(content, role = 'user', isSystem = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `chatbot-message ${role}`;
    if (isSystem) messageEl.classList.add('system');

    const avatar = role === 'bot' ? '⚡' : '👤';
    messageEl.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <p>${this.escapeHtml(content)}</p>
        <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    `;

    this.messagesEl.appendChild(messageEl);

    // Add to history if not system message
    if (!isSystem && role === 'user') {
      this.conversationHistory.push({ role: 'user', content });
      this.saveConversationHistory();
    } else if (!isSystem && role === 'bot') {
      this.conversationHistory.push({ role: 'assistant', content });
      this.saveConversationHistory();
    }

    // Scroll to bottom
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chatbot-message bot typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">⚡</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    this.messagesEl.appendChild(indicator);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * Speak text
   */
  speak(text) {
    if (!this.synthesis) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.voiceBtn) this.voiceBtn.classList.add('speaking');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.voiceBtn) this.voiceBtn.classList.remove('speaking');
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Open chat window
   */
  open() {
    this.isOpen = true;
    this.isMinimized = false;
    this.windowEl.style.display = 'flex';
    this.toggleBtn.style.display = 'none';
    this.widget.classList.add('open');
    this.inputEl.focus();
  }

  /**
   * Close chat window
   */
  close() {
    this.isOpen = false;
    this.windowEl.style.display = 'none';
    this.toggleBtn.style.display = 'flex';
    this.widget.classList.remove('open');
  }

  /**
   * Minimize chat window
   */
  minimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.windowEl.classList.add('minimized');
      this.minimizeBtn.textContent = '+';
    } else {
      this.windowEl.classList.remove('minimized');
      this.minimizeBtn.textContent = '−';
      this.inputEl.focus();
    }
  }

  /**
   * Save conversation history to localStorage
   */
  saveConversationHistory() {
    localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
  }

  /**
   * Load conversation history from localStorage
   */
  loadConversationHistory() {
    const stored = localStorage.getItem('chatbot_history');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    this.conversationHistory = [];
    this.saveConversationHistory();
    this.messagesEl.innerHTML = `
      <div class="chatbot-message bot">
        <div class="message-avatar">⚡</div>
        <div class="message-content">
          <p>Conversation cleared. How can I help you?</p>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new AIChatbot({
    apiUrl: 'http://localhost:3000/api/chat',
    enableVoice: true,
    theme: 'light',
    initialMessage: "Hi there! 👋 I'm Delegate AI. How can I help you today?"
  });
});
