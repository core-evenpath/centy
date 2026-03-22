/**
 * Centy Relay Widget — embeddable chat widget for partner websites.
 *
 * Usage:
 *   <script src="https://app.centy.com/relay/widget.js"
 *           data-widget-id="WIDGET_ID"
 *           data-partner-id="PARTNER_ID"
 *           data-primary-color="#2563EB"
 *           data-position="bottom-right">
 *   </script>
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  var scriptTag =
    document.currentScript ||
    document.querySelector('script[data-widget-id],script[data-partner-id]');

  var CFG = {
    widgetId: attr('data-widget-id', ''),
    partnerId: attr('data-partner-id', ''),
    apiBase: attr('data-api-base', resolveApiBase()),
    primaryColor: attr('data-primary-color', '#2563EB'),
    position: attr('data-position', 'bottom-right'),
    greeting: attr('data-greeting', 'Hi! How can I help you today?'),
    title: attr('data-title', 'Chat with us'),
    subtitle: attr('data-subtitle', ''),
    avatar: attr('data-avatar', ''),
  };

  function attr(name, fallback) {
    return scriptTag && scriptTag.getAttribute(name)
      ? scriptTag.getAttribute(name)
      : fallback;
  }

  function resolveApiBase() {
    if (scriptTag && scriptTag.src) {
      try {
        var u = new URL(scriptTag.src);
        return u.origin;
      } catch (_) {
        /* ignore */
      }
    }
    return '';
  }

  /* ------------------------------------------------------------------ */
  /*  State                                                              */
  /* ------------------------------------------------------------------ */

  var conversationId = 'conv_' + Date.now() + '_' + rand();
  var messages = []; // { role, content, parsed }
  var isOpen = false;
  var isLoading = false;

  function rand() {
    return Math.random().toString(36).slice(2, 8);
  }

  /* ------------------------------------------------------------------ */
  /*  Styles                                                             */
  /* ------------------------------------------------------------------ */

  var STYLES = /* css */ '\
    .cr-widget *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}\
    .cr-widget{position:fixed;z-index:2147483647;' + positionCSS() + '}\
    .cr-fab{width:56px;height:56px;border-radius:28px;background:' + CFG.primaryColor + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.25);transition:transform .2s}\
    .cr-fab:hover{transform:scale(1.08)}\
    .cr-fab svg{width:24px;height:24px;fill:currentColor}\
    .cr-panel{display:none;position:absolute;bottom:68px;' + panelSide() + ';width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 100px);background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.18);flex-direction:column;overflow:hidden}\
    .cr-panel.cr-open{display:flex}\
    .cr-header{background:' + CFG.primaryColor + ';color:#fff;padding:16px;display:flex;align-items:center;gap:10px;flex-shrink:0}\
    .cr-header-avatar{width:36px;height:36px;border-radius:18px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}\
    .cr-header-avatar img{width:100%;height:100%;object-fit:cover}\
    .cr-header-text{flex:1;min-width:0}\
    .cr-header-title{font-size:15px;font-weight:600}\
    .cr-header-subtitle{font-size:12px;opacity:.85}\
    .cr-close{background:none;border:none;color:#fff;cursor:pointer;padding:4px;opacity:.8}\
    .cr-close:hover{opacity:1}\
    .cr-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}\
    .cr-msg{max-width:88%;animation:crFadeIn .2s}\
    .cr-msg-user{align-self:flex-end}\
    .cr-msg-assistant{align-self:flex-start}\
    .cr-bubble{padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}\
    .cr-msg-user .cr-bubble{background:' + CFG.primaryColor + ';color:#fff;border-bottom-right-radius:4px}\
    .cr-msg-assistant .cr-bubble{background:#f1f3f5;color:#1a1a1a;border-bottom-left-radius:4px}\
    .cr-block{margin-top:8px}\
    .cr-cards{display:flex;gap:10px;overflow-x:auto;padding:4px 0}\
    .cr-card{min-width:200px;max-width:240px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;flex-shrink:0;background:#fff}\
    .cr-card-img{width:100%;height:120px;object-fit:cover;background:#e5e7eb}\
    .cr-card-body{padding:10px}\
    .cr-card-title{font-size:14px;font-weight:600;margin-bottom:4px}\
    .cr-card-sub{font-size:12px;color:#6b7280;margin-bottom:4px}\
    .cr-card-price{font-size:14px;font-weight:700;color:' + CFG.primaryColor + '}\
    .cr-card-fields{font-size:12px;color:#6b7280;margin-top:4px}\
    .cr-card-btn{display:block;width:100%;padding:8px;background:' + CFG.primaryColor + ';color:#fff;border:none;border-radius:0 0 11px 11px;cursor:pointer;font-size:13px;font-weight:500}\
    .cr-card-btn:hover{opacity:.9}\
    .cr-list{display:flex;flex-direction:column;gap:8px}\
    .cr-list-item{display:flex;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;align-items:center}\
    .cr-list-img{width:56px;height:56px;border-radius:8px;object-fit:cover;background:#e5e7eb;flex-shrink:0}\
    .cr-list-body{flex:1;min-width:0}\
    .cr-list-title{font-size:14px;font-weight:600}\
    .cr-list-sub{font-size:12px;color:#6b7280}\
    .cr-list-price{font-size:13px;font-weight:600;color:' + CFG.primaryColor + '}\
    .cr-compare{overflow-x:auto}\
    .cr-compare table{width:100%;border-collapse:collapse;font-size:13px}\
    .cr-compare th,.cr-compare td{padding:8px 10px;text-align:left;border-bottom:1px solid #e5e7eb}\
    .cr-compare th{background:#f9fafb;font-weight:600}\
    .cr-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\
    .cr-chip{padding:6px 12px;background:#f1f3f5;border:1px solid #e5e7eb;border-radius:16px;font-size:13px;cursor:pointer;transition:background .15s}\
    .cr-chip:hover{background:#e5e7eb}\
    .cr-input-row{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #e5e7eb;flex-shrink:0;background:#fff}\
    .cr-input{flex:1;border:1px solid #d1d5db;border-radius:20px;padding:10px 16px;font-size:14px;outline:none;resize:none}\
    .cr-input:focus{border-color:' + CFG.primaryColor + '}\
    .cr-send{width:36px;height:36px;border-radius:18px;background:' + CFG.primaryColor + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:flex-end}\
    .cr-send:disabled{opacity:.5;cursor:default}\
    .cr-typing{display:flex;gap:4px;padding:8px 14px;align-self:flex-start}\
    .cr-typing span{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:crBounce 1.2s infinite}\
    .cr-typing span:nth-child(2){animation-delay:.2s}\
    .cr-typing span:nth-child(3){animation-delay:.4s}\
    .cr-lead-form{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px}\
    .cr-lead-form input{padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px}\
    .cr-lead-form button{padding:8px;background:' + CFG.primaryColor + ';color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500}\
    .cr-lead-form button:hover{opacity:.9}\
    .cr-powered{text-align:center;font-size:11px;color:#9ca3af;padding:4px 0 8px}\
    .cr-powered a{color:#9ca3af;text-decoration:none}\
    .cr-powered a:hover{text-decoration:underline}\
    @keyframes crFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\
    @keyframes crBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}\
    @media(max-width:480px){.cr-panel{width:100vw;height:100vh;max-height:100vh;bottom:0;left:0;right:0;border-radius:0}.cr-fab{width:48px;height:48px}}\
  ';

  function positionCSS() {
    if (CFG.position === 'bottom-left') return 'bottom:20px;left:20px;';
    return 'bottom:20px;right:20px;';
  }

  function panelSide() {
    if (CFG.position === 'bottom-left') return 'left:0;';
    return 'right:0;';
  }

  /* ------------------------------------------------------------------ */
  /*  DOM Construction                                                   */
  /* ------------------------------------------------------------------ */

  function init() {
    // Inject styles
    var style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    // Root
    var root = document.createElement('div');
    root.className = 'cr-widget';
    root.innerHTML = buildHTML();
    document.body.appendChild(root);

    // References
    var fab = root.querySelector('.cr-fab');
    var panel = root.querySelector('.cr-panel');
    var closeBtn = root.querySelector('.cr-close');
    var msgsEl = root.querySelector('.cr-messages');
    var input = root.querySelector('.cr-input');
    var sendBtn = root.querySelector('.cr-send');

    // Events
    fab.addEventListener('click', function () {
      isOpen = !isOpen;
      panel.classList.toggle('cr-open', isOpen);
      if (isOpen && messages.length === 0) {
        appendGreeting(msgsEl);
      }
      if (isOpen) input.focus();
    });

    closeBtn.addEventListener('click', function () {
      isOpen = false;
      panel.classList.remove('cr-open');
    });

    sendBtn.addEventListener('click', function () {
      submitMessage(input, msgsEl);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitMessage(input, msgsEl);
      }
    });

    // Delegate suggestion chip clicks
    msgsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.cr-chip');
      if (chip) {
        input.value = chip.textContent.trim();
        submitMessage(input, msgsEl);
      }
      var cardBtn = e.target.closest('.cr-card-btn');
      if (cardBtn) {
        var action = cardBtn.getAttribute('data-action');
        if (action) {
          input.value = action;
          submitMessage(input, msgsEl);
        }
      }
    });
  }

  function buildHTML() {
    var avatarContent = CFG.avatar
      ? '<img src="' + esc(CFG.avatar) + '" alt="">'
      : chatSVG();
    return '\
      <button class="cr-fab" aria-label="Open chat">' + chatSVG() + '</button>\
      <div class="cr-panel">\
        <div class="cr-header">\
          <div class="cr-header-avatar">' + avatarContent + '</div>\
          <div class="cr-header-text">\
            <div class="cr-header-title">' + esc(CFG.title) + '</div>\
            ' + (CFG.subtitle ? '<div class="cr-header-subtitle">' + esc(CFG.subtitle) + '</div>' : '') + '\
          </div>\
          <button class="cr-close" aria-label="Close">' + closeSVG() + '</button>\
        </div>\
        <div class="cr-messages"></div>\
        <div class="cr-input-row">\
          <textarea class="cr-input" rows="1" placeholder="Type a message\u2026"></textarea>\
          <button class="cr-send" aria-label="Send">' + sendSVG() + '</button>\
        </div>\
        <div class="cr-powered"><a href="https://centy.com" target="_blank" rel="noopener">Powered by Centy</a></div>\
      </div>\
    ';
  }

  /* ------------------------------------------------------------------ */
  /*  Messaging                                                          */
  /* ------------------------------------------------------------------ */

  function appendGreeting(container) {
    var parsed = { type: 'text', text: CFG.greeting, suggestions: [] };
    appendAssistantMessage(container, parsed);
  }

  function submitMessage(input, container) {
    var text = input.value.trim();
    if (!text || isLoading) return;
    input.value = '';

    // Append user bubble
    appendUserMessage(container, text);
    messages.push({ role: 'user', content: text });

    // Send to API
    isLoading = true;
    showTyping(container);
    sendChat(messages)
      .then(function (res) {
        hideTyping(container);
        isLoading = false;
        if (res && res.response) {
          var p = res.response;
          messages.push({ role: 'assistant', content: JSON.stringify(p) });
          appendAssistantMessage(container, p);
          if (res.conversationId) conversationId = res.conversationId;
        }
      })
      .catch(function () {
        hideTyping(container);
        isLoading = false;
        appendAssistantMessage(container, {
          type: 'text',
          text: 'Sorry, something went wrong. Please try again.',
          suggestions: [],
        });
      });
  }

  function sendChat(msgs) {
    var apiMessages = msgs.map(function (m) {
      return { role: m.role, content: m.content };
    });
    return fetch(CFG.apiBase + '/api/relay/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgetId: CFG.widgetId,
        partnerId: CFG.partnerId,
        conversationId: conversationId,
        messages: apiMessages,
      }),
    }).then(function (r) {
      return r.json();
    });
  }

  function sendLead(data) {
    return fetch(CFG.apiBase + '/api/relay/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        Object.assign({}, data, {
          widgetId: CFG.widgetId,
          conversationId: conversationId,
        })
      ),
    }).then(function (r) {
      return r.json();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Message Rendering                                                  */
  /* ------------------------------------------------------------------ */

  function appendUserMessage(container, text) {
    var el = document.createElement('div');
    el.className = 'cr-msg cr-msg-user';
    el.innerHTML = '<div class="cr-bubble">' + esc(text) + '</div>';
    container.appendChild(el);
    scrollBottom(container);
  }

  function appendAssistantMessage(container, parsed) {
    var el = document.createElement('div');
    el.className = 'cr-msg cr-msg-assistant';

    var html = '<div class="cr-bubble">' + esc(parsed.text || '') + '</div>';
    html += renderBlock(parsed);
    html += renderSuggestions(parsed.suggestions);

    el.innerHTML = html;
    container.appendChild(el);
    scrollBottom(container);
  }

  /* ------------------------------------------------------------------ */
  /*  Block Renderers                                                    */
  /* ------------------------------------------------------------------ */

  function renderBlock(parsed) {
    var items = parsed.items || [];
    if (items.length === 0 && parsed.type === 'text') return '';

    switch (parsed.type) {
      case 'compare':
        return renderCompare(items);
      case 'gallery':
        return renderGallery(items);
      case 'info':
        return renderInfo(parsed);
      case 'contact':
        return renderContact(parsed);
      case 'location':
        return renderInfo(parsed);
      case 'book':
        return renderCards(items, true);
      default:
        // card / list / carousel / rooms / activities etc.
        if (items.length > 3) return renderCarousel(items);
        if (items.length > 0) return renderCards(items, false);
        return '';
    }
  }

  /** Card grid / small set */
  function renderCards(items, showBookBtn) {
    var html = '<div class="cr-block cr-cards">';
    items.forEach(function (item) {
      html += '<div class="cr-card">';
      if (itemImg(item)) {
        html += '<img class="cr-card-img" src="' + esc(itemImg(item)) + '" alt="' + esc(item.name || '') + '">';
      }
      html += '<div class="cr-card-body">';
      html += '<div class="cr-card-title">' + esc(item.name || '') + '</div>';
      if (itemSub(item)) html += '<div class="cr-card-sub">' + esc(itemSub(item)) + '</div>';
      if (itemPrice(item)) html += '<div class="cr-card-price">' + esc(itemPrice(item)) + '</div>';
      html += renderFieldSnippets(item);
      html += '</div>';
      if (showBookBtn) {
        html +=
          '<button class="cr-card-btn" data-action="I\'d like to book ' +
          esc(item.name || 'this') +
          '">Book Now</button>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /** Horizontal scrollable carousel (same as cards but always horizontal) */
  function renderCarousel(items) {
    return renderCards(items, false); // cr-cards already scrolls horizontally
  }

  /** Vertical list */
  function renderList(items) {
    var html = '<div class="cr-block cr-list">';
    items.forEach(function (item) {
      html += '<div class="cr-list-item">';
      if (itemImg(item)) {
        html += '<img class="cr-list-img" src="' + esc(itemImg(item)) + '" alt="">';
      }
      html += '<div class="cr-list-body">';
      html += '<div class="cr-list-title">' + esc(item.name || '') + '</div>';
      if (itemSub(item)) html += '<div class="cr-list-sub">' + esc(itemSub(item)) + '</div>';
      if (itemPrice(item)) html += '<div class="cr-list-price">' + esc(itemPrice(item)) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  /** Comparison table */
  function renderCompare(items) {
    if (items.length === 0) return '';
    // Collect all field keys across items
    var keys = [];
    items.forEach(function (item) {
      var fields = item.fields || item;
      Object.keys(fields).forEach(function (k) {
        if (k !== 'name' && k !== 'image' && k !== 'main_image' && keys.indexOf(k) === -1) {
          keys.push(k);
        }
      });
    });

    var html = '<div class="cr-block cr-compare"><table>';
    html += '<tr><th></th>';
    items.forEach(function (item) {
      html += '<th>' + esc(item.name || '') + '</th>';
    });
    html += '</tr>';
    keys.slice(0, 10).forEach(function (k) {
      html += '<tr><td><strong>' + esc(humanize(k)) + '</strong></td>';
      items.forEach(function (item) {
        var val = (item.fields || item)[k];
        html += '<td>' + esc(formatVal(val)) + '</td>';
      });
      html += '</tr>';
    });
    html += '</table></div>';
    return html;
  }

  /** Image gallery */
  function renderGallery(items) {
    var html = '<div class="cr-block cr-cards">';
    items.forEach(function (item) {
      var src = item.url || item.image || itemImg(item);
      if (src) {
        html +=
          '<div class="cr-card"><img class="cr-card-img" style="height:160px" src="' +
          esc(src) +
          '" alt="' +
          esc(item.name || item.caption || '') +
          '"></div>';
      }
    });
    html += '</div>';
    return html;
  }

  /** Key-value info or contact block */
  function renderInfo(parsed) {
    var items = parsed.items || [];
    if (items.length === 0) return '';
    var html = '<div class="cr-block cr-list">';
    items.forEach(function (item) {
      html += '<div class="cr-list-item"><div class="cr-list-body">';
      html += '<div class="cr-list-title">' + esc(item.label || item.name || '') + '</div>';
      html += '<div class="cr-list-sub">' + esc(item.value || item.detail || '') + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function renderContact(parsed) {
    return renderInfo(parsed);
  }

  /** Field snippets below card body */
  function renderFieldSnippets(item) {
    var fields = item.fields;
    if (!fields || typeof fields !== 'object') return '';
    var keys = Object.keys(fields).slice(0, 3);
    if (keys.length === 0) return '';
    var parts = keys.map(function (k) {
      return esc(humanize(k)) + ': ' + esc(formatVal(fields[k]));
    });
    return '<div class="cr-card-fields">' + parts.join(' &middot; ') + '</div>';
  }

  /** Suggestion chips */
  function renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) return '';
    var html = '<div class="cr-suggestions">';
    suggestions.forEach(function (s) {
      html += '<button class="cr-chip">' + esc(s) + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* ------------------------------------------------------------------ */
  /*  Typing Indicator                                                   */
  /* ------------------------------------------------------------------ */

  function showTyping(container) {
    var el = document.createElement('div');
    el.className = 'cr-typing';
    el.id = 'cr-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(el);
    scrollBottom(container);
  }

  function hideTyping(container) {
    var el = container.querySelector('#cr-typing');
    if (el) el.remove();
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function itemImg(item) {
    return (
      item.image ||
      item.main_image ||
      (item.fields && (item.fields.main_image || item.fields.image)) ||
      ''
    );
  }

  function itemSub(item) {
    return (
      item.subtitle ||
      item.description ||
      item.short_description ||
      (item.fields && item.fields.short_description) ||
      ''
    );
  }

  function itemPrice(item) {
    if (item.price !== undefined && item.price !== null) {
      return (item.currency || '') + ' ' + item.price;
    }
    if (item.fields && item.fields.price !== undefined) {
      return (item.currency || '') + ' ' + item.fields.price;
    }
    return '';
  }

  function humanize(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function formatVal(val) {
    if (val === null || val === undefined) return 'N/A';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  }

  function esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  function scrollBottom(el) {
    requestAnimationFrame(function () {
      el.scrollTop = el.scrollHeight;
    });
  }

  /* ------------------------------------------------------------------ */
  /*  SVG Icons                                                          */
  /* ------------------------------------------------------------------ */

  function chatSVG() {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  }

  function closeSVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  }

  function sendSVG() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  }

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
