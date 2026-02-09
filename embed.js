/**
 * AI Chat Bot Embed Script
 * Add this single line to any website to enable the AI chatbot
 * <script src="http://your-server:3000/embed.js"></script>
 */

(function() {
  // Configuration
  const CONFIG = {
    apiUrl: (() => {
      // Detect server URL from where this script is loaded
      const scripts = document.getElementsByTagName('script');
      for (let script of scripts) {
        if (script.src && script.src.includes('embed.js')) {
          return script.src.split('/embed.js')[0] + '/api/chat';
        }
      }
      return 'http://localhost:3000/api/chat';
    })(),
    serverUrl: (() => {
      const scripts = document.getElementsByTagName('script');
      for (let script of scripts) {
        if (script.src && script.src.includes('embed.js')) {
          return script.src.split('/embed.js')[0];
        }
      }
      return 'http://localhost:3000';
    })(),
    enableVoice: true,
    theme: 'light',
    position: 'bottom-right'
  };

  // Load CSS dynamically
  function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CONFIG.serverUrl + '/styles.css';
    document.head.appendChild(link);
  }

  // Load chatbot script dynamically
  function loadChatbot() {
    const script = document.createElement('script');
    script.src = CONFIG.serverUrl + '/chatbot.js';
    script.onload = function() {
      // Initialize after chatbot.js loads
      setTimeout(() => {
        if (window.AIChatbot) {
          window.chatbot = new window.AIChatbot({
            apiUrl: CONFIG.apiUrl,
            enableVoice: CONFIG.enableVoice,
            theme: CONFIG.theme,
            position: CONFIG.position,
            initialMessage: "Hi! 👋 How can I help you today?"
          });
        }
      }, 100);
    };
    document.body.appendChild(script);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      loadCSS();
      loadChatbot();
    });
  } else {
    loadCSS();
    loadChatbot();
  }
})();
