/**
 * Pingbox Relay Widget
 * Self-contained embeddable AI chat widget
 * Usage: <script src="/relay/widget.js"></script>
 *        <pingbox-relay id="your-widget-id"></pingbox-relay>
 */
(function () {
  'use strict';

  const API_BASE = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;

  // ===== STATE FACTORY =====
  function createState(widgetId) {
    return {
      widgetId,
      config: null,
      conversationId: null,
      visitorId: getOrCreateVisitorId(),
      messages: [],
      loading: false,
      open: false,
      leadCaptured: false,
    };
  }

  function getOrCreateVisitorId() {
    const KEY = 'pb_relay_vid';
    let vid = sessionStorage.getItem(KEY);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, vid);
    }
    return vid;
  }

  // ===== CSS STYLES =====
  function buildStyles(cfg) {
    const c = cfg || {};
    const theme = c.theme || {};
    const accent = theme.accentColor || '#4F46E5';
    const accentDark = theme.accentDarkColor || '#3730A3';
    const bg = theme.backgroundColor || '#ffffff';
    const surface = theme.surfaceColor || '#f9fafb';
    const text = theme.textColor || '#111827';
    const font = theme.fontFamily || 'Inter';
    const isDark = theme.mode === 'dark';
    const br = theme.borderRadius === 'sharp' ? '4px' : theme.borderRadius === 'pill' ? '24px' : '12px';
    const brLg = theme.borderRadius === 'sharp' ? '8px' : theme.borderRadius === 'pill' ? '32px' : '20px';

    return `
      @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600;700&display=swap');
      :host { all: initial; display: block; }
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: '${font}', -apple-system, sans-serif; }

      /* Floating button */
      .pb-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${accent}, ${accentDark});
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px ${accent}55;
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 9999;
        color: white;
        font-size: 24px;
      }
      .pb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px ${accent}77; }
      .pb-fab[data-open="true"] { transform: scale(1); }

      /* Panel */
      .pb-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 380px;
        max-height: 640px;
        min-height: 480px;
        display: flex;
        flex-direction: column;
        background: ${isDark ? '#1a1a2e' : bg};
        border-radius: ${brLg};
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08);
        overflow: hidden;
        z-index: 9998;
        opacity: 0;
        transform: translateY(16px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .pb-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* Standalone mode */
      :host([data-standalone]) .pb-fab { display: none; }
      :host([data-standalone]) .pb-panel {
        position: static;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        opacity: 1;
        transform: none;
        pointer-events: all;
      }

      /* Header */
      .pb-header {
        background: linear-gradient(135deg, ${accent}, ${accentDark});
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .pb-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .pb-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .pb-header-text { flex: 1; min-width: 0; }
      .pb-brand-name { font-weight: 700; color: white; font-size: 15px; line-height: 1.2; }
      .pb-brand-tag { color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 1px; }
      .pb-online { display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.8); font-size: 10px; margin-top: 2px; }
      .pb-online-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; animation: pulse 2s infinite; }
      .pb-close-btn {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .pb-close-btn:hover { background: rgba(255,255,255,0.25); }

      /* Intent strip */
      .pb-intents {
        background: ${isDark ? '#16213e' : surface};
        padding: 10px 12px;
        display: flex;
        gap: 8px;
        overflow-x: auto;
        flex-shrink: 0;
        scrollbar-width: none;
        border-bottom: 1px solid ${isDark ? '#2d2d4e' : '#f0f0f0'};
      }
      .pb-intents::-webkit-scrollbar { display: none; }
      .pb-intent-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        border-radius: ${br};
        border: 1px solid ${isDark ? '#3d3d6e' : '#e5e7eb'};
        background: ${isDark ? '#1a1a2e' : bg};
        cursor: pointer;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 500;
        color: ${isDark ? '#e2e8f0' : text};
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .pb-intent-btn:hover {
        background: ${accent}18;
        border-color: ${accent}44;
        color: ${accent};
      }
      .pb-intent-icon { font-size: 14px; }

      /* Messages */
      .pb-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: #e5e7eb transparent;
        background: ${isDark ? '#0f0f1e' : bg};
      }
      .pb-messages::-webkit-scrollbar { width: 4px; }
      .pb-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

      /* Welcome */
      .pb-welcome {
        text-align: center;
        padding: 20px 16px;
      }
      .pb-welcome-emoji { font-size: 40px; margin-bottom: 10px; }
      .pb-welcome-text {
        font-size: 14px;
        color: ${isDark ? '#94a3b8' : '#6b7280'};
        line-height: 1.5;
      }

      /* Message rows */
      .pb-msg-row { display: flex; gap: 8px; align-items: flex-end; }
      .pb-msg-row.visitor { flex-direction: row-reverse; }
      .pb-msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${accent}22;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .pb-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }

      .pb-msg-content { max-width: 78%; display: flex; flex-direction: column; gap: 4px; }
      .pb-msg-row.visitor .pb-msg-content { align-items: flex-end; }

      .pb-bubble {
        padding: 10px 13px;
        border-radius: ${br};
        font-size: 13px;
        line-height: 1.5;
        color: ${isDark ? '#e2e8f0' : text};
        background: ${isDark ? '#1e1e3f' : surface};
        border: 1px solid ${isDark ? '#2d2d5f' : '#f0f0f0'};
        word-break: break-word;
      }
      .pb-bubble.visitor {
        background: linear-gradient(135deg, ${accent}, ${accentDark});
        color: white;
        border: none;
      }
      .pb-bubble.typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
      }
      .pb-dot {
        width: 7px; height: 7px;
        background: ${isDark ? '#6b7280' : '#9ca3af'};
        border-radius: 50%;
        animation: typingBounce 1.2s ease-in-out infinite;
      }
      .pb-dot:nth-child(2) { animation-delay: 0.2s; }
      .pb-dot:nth-child(3) { animation-delay: 0.4s; }

      .pb-timestamp {
        font-size: 9px;
        color: ${isDark ? '#4b5563' : '#9ca3af'};
        padding: 0 2px;
      }

      /* Suggestions */
      .pb-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 4px;
        padding-left: 4px;
      }
      .pb-suggestion {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: ${br};
        border: 1px solid ${isDark ? '#3d3d6e' : '#e5e7eb'};
        background: ${isDark ? '#1a1a2e' : bg};
        color: ${isDark ? '#94a3b8' : '#374151'};
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .pb-suggestion:hover {
        background: ${accent}18;
        border-color: ${accent}44;
        color: ${accent};
      }

      /* Block card */
      .pb-block-card {
        background: ${isDark ? '#1a1a2e' : bg};
        border: 1px solid ${isDark ? '#2d2d5f' : '#e5e7eb'};
        border-radius: ${br};
        padding: 10px;
        font-size: 12px;
        margin-top: 4px;
        overflow: hidden;
      }
      .pb-block-label {
        font-size: 9px;
        font-weight: 600;
        color: ${accent};
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 6px;
      }
      .pb-block-item {
        padding: 6px 0;
        border-bottom: 1px solid ${isDark ? '#1e2d45' : '#f5f5f5'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: ${isDark ? '#e2e8f0' : text};
        gap: 8px;
      }
      .pb-block-item:last-child { border-bottom: none; }
      .pb-block-price {
        font-weight: 600;
        color: ${accent};
        white-space: nowrap;
        font-size: 11px;
      }

      /* Input area */
      .pb-input-area {
        padding: 12px;
        border-top: 1px solid ${isDark ? '#1e2d45' : '#f0f0f0'};
        background: ${isDark ? '#0f0f1e' : bg};
        flex-shrink: 0;
      }
      .pb-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        background: ${isDark ? '#1a1a2e' : surface};
        border: 1.5px solid ${isDark ? '#2d2d5f' : '#e5e7eb'};
        border-radius: ${br};
        padding: 8px 12px;
        transition: border-color 0.2s;
      }
      .pb-input-row:focus-within {
        border-color: ${accent};
        box-shadow: 0 0 0 3px ${accent}18;
      }
      .pb-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        font-size: 13px;
        color: ${isDark ? '#e2e8f0' : text};
        font-family: inherit;
        resize: none;
        line-height: 1.4;
        max-height: 80px;
        min-height: 20px;
      }
      .pb-input::placeholder { color: ${isDark ? '#4b5563' : '#9ca3af'}; }
      .pb-send-btn {
        background: linear-gradient(135deg, ${accent}, ${accentDark});
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, opacity 0.15s;
        flex-shrink: 0;
      }
      .pb-send-btn:hover { transform: scale(1.08); }
      .pb-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

      /* Footer */
      .pb-footer {
        text-align: center;
        padding: 6px;
        font-size: 9px;
        color: ${isDark ? '#4b5563' : '#9ca3af'};
        background: ${isDark ? '#0f0f1e' : bg};
        flex-shrink: 0;
      }
      .pb-footer a { color: ${isDark ? '#6b7280' : '#9ca3af'}; text-decoration: none; }
      .pb-footer a:hover { text-decoration: underline; }

      /* Conversion actions */
      .pb-conversion-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .pb-conv-btn {
        flex: 1;
        min-width: 80px;
        padding: 7px 10px;
        border-radius: ${br};
        border: 1.5px solid ${accent};
        background: transparent;
        color: ${accent};
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s;
        font-family: inherit;
      }
      .pb-conv-btn:hover { background: ${accent}; color: white; }
      .pb-conv-btn.primary {
        background: linear-gradient(135deg, ${accent}, ${accentDark});
        color: white;
        border: none;
      }
      .pb-conv-btn.primary:hover { opacity: 0.9; }

      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .pb-msg-row { animation: fadeIn 0.25s ease forwards; }
    `;
  }

  // ===== ICONS (inline SVG) =====
  const ICONS = {
    send: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    chat: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    bot: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
    user: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  };

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  // ===== WIDGET ELEMENT CLASS =====
  class PingboxRelay extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._widgetId = '';
      this._state = null;
      this._styleEl = null;
      this._panelEl = null;
      this._fabEl = null;
      this._messagesEl = null;
      this._inputEl = null;
      this._isStandalone = false;
    }

    connectedCallback() {
      this._widgetId = this.getAttribute('id') || this.getAttribute('data-widget-id') || '';
      this._isStandalone = this.hasAttribute('data-standalone');

      if (!this._widgetId) {
        console.warn('[Pingbox Relay] No widget ID provided');
        return;
      }

      this._state = createState(this._widgetId);

      this._buildShell();
      this._loadConfig();
    }

    _buildShell() {
      this._shadow.innerHTML = `
        <style id="pb-styles">/* loading */</style>
        <button class="pb-fab" id="pb-fab" aria-label="Open chat" ${this._isStandalone ? 'style="display:none"' : ''}>
          ${ICONS.zap}
        </button>
        <div class="pb-panel ${this._isStandalone ? 'open' : ''}" id="pb-panel">
          <div class="pb-header" id="pb-header">
            <div class="pb-avatar" id="pb-avatar">💬</div>
            <div class="pb-header-text">
              <div class="pb-brand-name" id="pb-brand-name">Loading...</div>
              <div class="pb-brand-tag" id="pb-brand-tag"></div>
              <div class="pb-online"><div class="pb-online-dot"></div> Online</div>
            </div>
            <button class="pb-close-btn" id="pb-close" aria-label="Close chat" ${this._isStandalone ? 'style="display:none"' : ''}>
              ${ICONS.close}
            </button>
          </div>
          <div class="pb-intents" id="pb-intents"></div>
          <div class="pb-messages" id="pb-messages">
            <div class="pb-welcome" id="pb-welcome">
              <div class="pb-welcome-emoji" id="pb-welcome-emoji">💬</div>
              <div class="pb-welcome-text" id="pb-welcome-text">Loading widget...</div>
            </div>
          </div>
          <div class="pb-input-area">
            <div class="pb-input-row">
              <textarea
                class="pb-input"
                id="pb-input"
                placeholder="Ask anything..."
                rows="1"
                aria-label="Chat message"
              ></textarea>
              <button class="pb-send-btn" id="pb-send" aria-label="Send message">
                ${ICONS.send}
              </button>
            </div>
          </div>
          <div class="pb-footer">
            Powered by <a href="https://www.centy.dev" target="_blank" rel="noopener">Pingbox Relay</a>
          </div>
        </div>
      `;

      this._panelEl = this._shadow.getElementById('pb-panel');
      this._fabEl = this._shadow.getElementById('pb-fab');
      this._messagesEl = this._shadow.getElementById('pb-messages');
      this._inputEl = this._shadow.getElementById('pb-input');

      // Event listeners
      this._shadow.getElementById('pb-fab').addEventListener('click', () => this._togglePanel());
      this._shadow.getElementById('pb-close').addEventListener('click', () => this._closePanel());
      this._shadow.getElementById('pb-send').addEventListener('click', () => this._sendMessage());

      this._inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._sendMessage();
        }
      });

      this._inputEl.addEventListener('input', () => {
        this._inputEl.style.height = 'auto';
        this._inputEl.style.height = Math.min(this._inputEl.scrollHeight, 80) + 'px';
      });
    }

    async _loadConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/relay/config/${this._widgetId}`);
        if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
        const config = await res.json();
        this._state.config = config;
        this._applyConfig(config);
      } catch (e) {
        console.error('[Pingbox Relay] Config load failed:', e);
        this._shadow.getElementById('pb-welcome-text').textContent = 'Widget unavailable';
      }
    }

    _applyConfig(cfg) {
      // Update styles
      const styleEl = this._shadow.querySelector('#pb-styles') || this._shadow.getElementById('pb-styles');
      if (styleEl) styleEl.textContent = buildStyles(cfg);

      // Update header
      const avatarEl = this._shadow.getElementById('pb-avatar');
      if (cfg.brandLogo) {
        avatarEl.innerHTML = `<img src="${cfg.brandLogo}" alt="${cfg.brandName}" />`;
      } else {
        avatarEl.textContent = cfg.avatarEmoji || '💬';
      }

      this._shadow.getElementById('pb-brand-name').textContent = cfg.brandName || 'Assistant';
      const tagEl = this._shadow.getElementById('pb-brand-tag');
      if (cfg.brandTagline) {
        tagEl.textContent = cfg.brandTagline;
        tagEl.style.display = 'block';
      }

      // Update welcome
      const welcomeEmoji = this._shadow.getElementById('pb-welcome-emoji');
      if (welcomeEmoji) welcomeEmoji.textContent = cfg.avatarEmoji || '💬';
      const welcomeText = this._shadow.getElementById('pb-welcome-text');
      if (welcomeText) welcomeText.textContent = cfg.welcomeMessage || 'How can I help you?';

      // Update FAB
      const fabEl = this._shadow.getElementById('pb-fab');
      if (fabEl) fabEl.innerHTML = ICONS.zap;

      // Update intents
      this._renderIntents(cfg.intents || []);
    }

    _renderIntents(intents) {
      const container = this._shadow.getElementById('pb-intents');
      if (!container) return;
      container.innerHTML = '';

      intents.filter(i => i.enabled !== false).forEach(intent => {
        const btn = document.createElement('button');
        btn.className = 'pb-intent-btn';
        btn.innerHTML = `<span class="pb-intent-icon">${intent.icon}</span>${intent.label}`;
        btn.addEventListener('click', () => this._sendIntentMessage(intent));
        container.appendChild(btn);
      });
    }

    _togglePanel() {
      if (this._state.open) {
        this._closePanel();
      } else {
        this._openPanel();
      }
    }

    _openPanel() {
      this._state.open = true;
      this._panelEl.classList.add('open');
      const fabEl = this._shadow.getElementById('pb-fab');
      if (fabEl) fabEl.setAttribute('data-open', 'true');
      setTimeout(() => this._inputEl?.focus(), 300);
    }

    _closePanel() {
      this._state.open = false;
      this._panelEl.classList.remove('open');
      const fabEl = this._shadow.getElementById('pb-fab');
      if (fabEl) fabEl.removeAttribute('data-open');
    }

    async _sendIntentMessage(intent) {
      if (!this._state.open && !this._isStandalone) this._openPanel();
      await this._handleUserMessage(intent.prompt);
    }

    async _sendMessage() {
      const text = this._inputEl?.value?.trim();
      if (!text || this._state.loading) return;

      this._inputEl.value = '';
      this._inputEl.style.height = 'auto';
      await this._handleUserMessage(text);
    }

    async _handleUserMessage(text) {
      this._addUserMessage(text);
      this._addTypingIndicator();
      this._state.loading = true;
      this._updateSendButton(true);

      try {
        const res = await fetch(`${API_BASE}/api/relay/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: this._widgetId,
            visitorId: this._state.visitorId,
            message: text,
            conversationId: this._state.conversationId,
          }),
        });

        const data = await res.json();
        this._removeTypingIndicator();

        if (data.block) {
          this._state.conversationId = data.conversationId;
          this._addBotBlock(data.block);
          this._hideWelcome();
        }
      } catch (e) {
        this._removeTypingIndicator();
        this._addBotBlock({
          type: 'text',
          text: "I'm having trouble connecting. Please try again in a moment.",
          suggestions: ['Try again', 'Contact us'],
        });
      } finally {
        this._state.loading = false;
        this._updateSendButton(false);
      }
    }

    _hideWelcome() {
      const welcome = this._shadow.getElementById('pb-welcome');
      if (welcome) welcome.style.display = 'none';
    }

    _addUserMessage(text) {
      const row = document.createElement('div');
      row.className = 'pb-msg-row visitor';
      row.innerHTML = `
        <div class="pb-msg-avatar" style="background: #e0e7ff; color: #4f46e5;">${ICONS.user}</div>
        <div class="pb-msg-content">
          <div class="pb-bubble visitor">${this._escapeHtml(text)}</div>
          <div class="pb-timestamp">${formatTime(new Date().toISOString())}</div>
        </div>
      `;
      this._messagesEl.appendChild(row);
      this._scrollToBottom();
    }

    _addTypingIndicator() {
      const row = document.createElement('div');
      row.className = 'pb-msg-row';
      row.id = 'pb-typing';
      const accent = this._state.config?.theme?.accentColor || '#4F46E5';
      row.innerHTML = `
        <div class="pb-msg-avatar" style="background: ${accent}22; color: ${accent};">${ICONS.bot}</div>
        <div class="pb-msg-content">
          <div class="pb-bubble typing">
            <div class="pb-dot"></div><div class="pb-dot"></div><div class="pb-dot"></div>
          </div>
        </div>
      `;
      this._messagesEl.appendChild(row);
      this._scrollToBottom();
    }

    _removeTypingIndicator() {
      const el = this._shadow.getElementById('pb-typing');
      if (el) el.remove();
    }

    _addBotBlock(block) {
      const row = document.createElement('div');
      row.className = 'pb-msg-row';

      const accent = this._state.config?.theme?.accentColor || '#4F46E5';
      const isDark = this._state.config?.theme?.mode === 'dark';

      let blockHtml = '';

      // Rich block rendering
      if (block.items && block.items.length > 0 && block.type !== 'text') {
        blockHtml = `<div class="pb-block-card">
          <div class="pb-block-label">${block.type}</div>
          ${block.items.slice(0, 5).map(item => `
            <div class="pb-block-item">
              <span>${this._escapeHtml(item.name || item.title || item.label || JSON.stringify(item).slice(0, 50))}</span>
              ${item.price ? `<span class="pb-block-price">${item.price}</span>` : ''}
            </div>
          `).join('')}
          ${block.items.length > 5 ? `<div style="font-size:10px;color:#9ca3af;padding:6px 0">+${block.items.length - 5} more</div>` : ''}
        </div>`;
      }

      // Conversion actions for book/contact types
      let conversionHtml = '';
      const cfg = this._state.config;
      if (block.type === 'book' || block.type === 'contact') {
        const actions = [];
        if (cfg?.directBookingEnabled && cfg?.externalBookingUrl) {
          actions.push(`<button class="pb-conv-btn primary" onclick="window.open('${cfg.externalBookingUrl}', '_blank')">📅 Book Now</button>`);
        }
        if (cfg?.whatsappEnabled) {
          actions.push(`<button class="pb-conv-btn" onclick="this.closest('pingbox-relay, :host') && console.log('whatsapp')">💬 WhatsApp</button>`);
        }
        if (cfg?.callbackEnabled) {
          actions.push(`<button class="pb-conv-btn" onclick="console.log('callback')">📞 Call Me</button>`);
        }
        if (actions.length > 0) {
          conversionHtml = `<div class="pb-conversion-row">${actions.join('')}</div>`;
        }
      }

      // Suggestions
      let suggestionsHtml = '';
      if (block.suggestions && block.suggestions.length > 0) {
        suggestionsHtml = `<div class="pb-suggestions">
          ${block.suggestions.map(s => `<button class="pb-suggestion" data-prompt="${this._escapeHtml(s)}">${this._escapeHtml(s)}</button>`).join('')}
        </div>`;
      }

      row.innerHTML = `
        <div class="pb-msg-avatar" style="background: ${accent}22; color: ${accent};">${ICONS.bot}</div>
        <div class="pb-msg-content">
          <div class="pb-bubble">${this._escapeHtml(block.text || '')}</div>
          ${blockHtml}
          ${conversionHtml}
          ${suggestionsHtml}
          <div class="pb-timestamp">${formatTime(new Date().toISOString())}</div>
        </div>
      `;

      // Suggestion click handlers
      row.querySelectorAll('.pb-suggestion').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const prompt = e.target.getAttribute('data-prompt');
          if (prompt) this._handleUserMessage(prompt);
        });
      });

      this._messagesEl.appendChild(row);
      this._scrollToBottom();
      this._hideWelcome();
    }

    _updateSendButton(disabled) {
      const btn = this._shadow.getElementById('pb-send');
      if (btn) btn.disabled = disabled;
    }

    _scrollToBottom() {
      requestAnimationFrame(() => {
        if (this._messagesEl) {
          this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
        }
      });
    }

    _escapeHtml(str) {
      if (typeof str !== 'string') return String(str || '');
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // Register custom element
  if (!customElements.get('pingbox-relay')) {
    customElements.define('pingbox-relay', PingboxRelay);
  }
})();
