/**
 * Pingbox Relay Widget
 * Self-contained embeddable AI chat widget
 * Usage: <pingbox-relay id="your-widget-id"></pingbox-relay>
 */
(function () {
  'use strict';

  const BASE_URL = (function () {
    try {
      const scriptSrc = document.currentScript ? document.currentScript.src : '';
      if (scriptSrc) {
        const url = new URL(scriptSrc);
        return url.origin;
      }
    } catch (e) { /* ignore */ }
    return 'https://pingbox.io';
  })();

  // ============================================================================
  // STATE
  // ============================================================================
  function createState(widgetId) {
    return {
      widgetId,
      config: null,
      conversationId: null,
      visitorId: 'v_' + Math.random().toString(36).substring(2, 10),
      messages: [],
      isOpen: false,
      isLoading: false,
      inputValue: '',
    };
  }

  // ============================================================================
  // STYLES
  // ============================================================================
  const WIDGET_STYLES = `
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .relay-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--accent, #4F46E5);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      z-index: 999998;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .relay-fab:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
    .relay-fab.hidden { display: none; }

    .relay-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      opacity: 0;
      transform: translateY(12px) scale(0.97);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }
    .relay-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    @media (max-width: 480px) {
      .relay-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
      .relay-fab { bottom: 16px; right: 16px; }
    }

    .relay-header {
      padding: 14px 16px;
      background: var(--accent, #4F46E5);
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .relay-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .relay-header-text { flex: 1; min-width: 0; }
    .relay-brand-name { font-weight: 600; font-size: 14px; line-height: 1.2; }
    .relay-tagline { font-size: 11px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .relay-close {
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .relay-close:hover { background: rgba(255,255,255,0.25); }

    .relay-intents {
      padding: 10px 12px;
      border-bottom: 1px solid #F0F0F0;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .relay-intents::-webkit-scrollbar { display: none; }
    .relay-intent-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 20px;
      border: 1.5px solid var(--accent, #4F46E5);
      color: var(--accent, #4F46E5);
      background: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .relay-intent-chip:hover { background: var(--accent, #4F46E5); color: white; }

    .relay-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: #E0E0E0 transparent;
    }

    .relay-msg {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }
    .relay-msg.visitor { align-self: flex-end; align-items: flex-end; }
    .relay-msg.bot { align-self: flex-start; align-items: flex-start; }

    .relay-bubble {
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
    }
    .relay-msg.visitor .relay-bubble {
      background: var(--accent, #4F46E5);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .relay-msg.bot .relay-bubble {
      background: #F3F4F6;
      color: #111827;
      border-bottom-left-radius: 4px;
    }
    .relay-time {
      font-size: 10px;
      color: #9CA3AF;
      margin-top: 3px;
      padding: 0 4px;
    }

    .relay-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .relay-suggestion {
      padding: 4px 10px;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
      background: white;
      color: #374151;
      font-size: 11px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .relay-suggestion:hover { border-color: var(--accent, #4F46E5); color: var(--accent, #4F46E5); }

    .relay-typing {
      align-self: flex-start;
      padding: 8px 14px;
      background: #F3F4F6;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
    }
    .relay-typing span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #9CA3AF;
      border-radius: 50%;
      margin: 0 1px;
      animation: bounce 1.2s infinite;
    }
    .relay-typing span:nth-child(2) { animation-delay: 0.2s; }
    .relay-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    .relay-input-area {
      padding: 12px;
      border-top: 1px solid #F0F0F0;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .relay-input {
      flex: 1;
      padding: 8px 14px;
      border: 1.5px solid #E5E7EB;
      border-radius: 24px;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }
    .relay-input:focus { border-color: var(--accent, #4F46E5); }
    .relay-send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent, #4F46E5);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .relay-send:disabled { opacity: 0.5; cursor: not-allowed; }

    .relay-footer {
      padding: 6px;
      text-align: center;
      font-size: 10px;
      color: #D1D5DB;
      flex-shrink: 0;
    }
    .relay-footer a { color: #D1D5DB; text-decoration: none; }
    .relay-footer a:hover { color: #9CA3AF; }

    .relay-welcome {
      text-align: center;
      padding: 20px 16px;
      color: #6B7280;
      font-size: 13px;
    }
    .relay-welcome strong { display: block; color: #111827; font-size: 15px; margin-bottom: 4px; }
  `;

  // ============================================================================
  // WIDGET CLASS
  // ============================================================================
  class PingboxRelayWidget extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._state = null;
      this._initialized = false;
    }

    connectedCallback() {
      const widgetId = this.getAttribute('id') || this.getAttribute('widget-id');
      if (!widgetId) return;

      this._state = createState(widgetId);
      this._loadConfig();
    }

    async _loadConfig() {
      try {
        const res = await fetch(`${BASE_URL}/api/relay/config/${this._state.widgetId}`);
        if (!res.ok) return;
        const config = await res.json();
        this._state.config = config;
        this._render();
        this._initialized = true;
      } catch (e) {
        console.warn('[Pingbox Relay] Failed to load config:', e);
      }
    }

    _render() {
      const { config, messages, isOpen, isLoading } = this._state;
      if (!config) return;

      const accent = config.theme?.accentColor || '#4F46E5';
      const avatar = config.avatarEmoji || '🤖';
      const intents = (config.intents || []).filter(i => i.enabled);

      const shadow = this._shadow;
      shadow.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = WIDGET_STYLES + `
        :host { --accent: ${accent}; }
      `;
      shadow.appendChild(style);

      // FAB button
      const fab = document.createElement('button');
      fab.className = 'relay-fab';
      fab.innerHTML = isOpen ? '✕' : (avatar);
      fab.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
      fab.addEventListener('click', () => this._toggleOpen());
      shadow.appendChild(fab);

      // Panel
      const panel = document.createElement('div');
      panel.className = `relay-panel${isOpen ? ' open' : ''}`;

      // Header
      panel.innerHTML = `
        <div class="relay-header">
          <div class="relay-avatar">${avatar}</div>
          <div class="relay-header-text">
            <div class="relay-brand-name">${this._escapeHtml(config.brandName || 'Chat')}</div>
            ${config.brandTagline ? `<div class="relay-tagline">${this._escapeHtml(config.brandTagline)}</div>` : ''}
          </div>
          <button class="relay-close" aria-label="Close">✕</button>
        </div>
      `;

      panel.querySelector('.relay-close').addEventListener('click', () => this._toggleOpen());

      // Intent strip
      if (intents.length > 0) {
        const intentsEl = document.createElement('div');
        intentsEl.className = 'relay-intents';
        intents.forEach(intent => {
          const chip = document.createElement('button');
          chip.className = 'relay-intent-chip';
          chip.innerHTML = `${intent.icon} ${this._escapeHtml(intent.label)}`;
          chip.addEventListener('click', () => this._sendMessage(intent.prompt));
          intentsEl.appendChild(chip);
        });
        panel.appendChild(intentsEl);
      }

      // Messages area
      const messagesEl = document.createElement('div');
      messagesEl.className = 'relay-messages';
      messagesEl.setAttribute('role', 'log');

      if (messages.length === 0 && config.welcomeMessage) {
        messagesEl.innerHTML = `
          <div class="relay-welcome">
            <strong>${this._escapeHtml(config.brandName || 'Hi!')}</strong>
            ${this._escapeHtml(config.welcomeMessage)}
          </div>
        `;
      }

      messages.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.className = `relay-msg ${msg.role}`;

        const text = msg.text || (msg.block && msg.block.text) || '';
        const suggestions = msg.block && msg.block.suggestions ? msg.block.suggestions : [];

        msgEl.innerHTML = `
          <div class="relay-bubble">${this._escapeHtml(text)}</div>
          <div class="relay-time">${this._formatTime(msg.timestamp)}</div>
        `;

        if (suggestions.length > 0) {
          const suggestionsEl = document.createElement('div');
          suggestionsEl.className = 'relay-suggestions';
          suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'relay-suggestion';
            btn.textContent = s;
            btn.addEventListener('click', () => this._sendMessage(s));
            suggestionsEl.appendChild(btn);
          });
          msgEl.appendChild(suggestionsEl);
        }

        messagesEl.appendChild(msgEl);
      });

      if (isLoading) {
        const typingEl = document.createElement('div');
        typingEl.className = 'relay-typing';
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(typingEl);
      }

      panel.appendChild(messagesEl);

      // Input area
      const inputArea = document.createElement('div');
      inputArea.className = 'relay-input-area';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'relay-input';
      input.placeholder = 'Ask a question...';
      input.value = this._state.inputValue || '';
      input.addEventListener('input', (e) => { this._state.inputValue = e.target.value; });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._handleSend();
        }
      });

      const sendBtn = document.createElement('button');
      sendBtn.className = 'relay-send';
      sendBtn.disabled = isLoading;
      sendBtn.setAttribute('aria-label', 'Send message');
      sendBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
      sendBtn.addEventListener('click', () => this._handleSend());

      inputArea.appendChild(input);
      inputArea.appendChild(sendBtn);
      panel.appendChild(inputArea);

      // Footer
      panel.innerHTML += `
        <div class="relay-footer">Powered by <a href="https://pingbox.io" target="_blank" rel="noopener">Pingbox</a></div>
      `;

      shadow.appendChild(panel);

      // Scroll to bottom
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (isOpen && input) {
          input.focus();
        }
      });
    }

    _toggleOpen() {
      this._state.isOpen = !this._state.isOpen;
      this._render();
    }

    _handleSend() {
      const text = (this._state.inputValue || '').trim();
      if (!text || this._state.isLoading) return;
      this._state.inputValue = '';
      this._sendMessage(text);
    }

    async _sendMessage(text) {
      if (!text || this._state.isLoading) return;

      // Add visitor message
      this._state.messages.push({
        id: 'v_' + Date.now(),
        role: 'visitor',
        text,
        timestamp: new Date().toISOString(),
      });
      this._state.isLoading = true;
      this._render();

      try {
        const res = await fetch(`${BASE_URL}/api/relay/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: this._state.widgetId,
            visitorId: this._state.visitorId,
            message: text,
            conversationId: this._state.conversationId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          this._state.conversationId = data.conversationId;
          this._state.messages.push({
            id: 'b_' + Date.now(),
            role: 'bot',
            text: data.block?.text || 'I received your message.',
            block: data.block,
            timestamp: new Date().toISOString(),
          });
        } else {
          this._state.messages.push({
            id: 'err_' + Date.now(),
            role: 'bot',
            text: 'Sorry, something went wrong. Please try again.',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        this._state.messages.push({
          id: 'err_' + Date.now(),
          role: 'bot',
          text: 'Connection error. Please check your internet connection.',
          timestamp: new Date().toISOString(),
        });
      }

      this._state.isLoading = false;
      this._render();
    }

    _escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    _formatTime(timestamp) {
      try {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }
  }

  // Register custom element
  if (!customElements.get('pingbox-relay')) {
    customElements.define('pingbox-relay', PingboxRelayWidget);
  }
})();
