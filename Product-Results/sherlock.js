/**
 * Sherlock AI - Chat Logic
 * Base sidebar/theme logic comes from ../version5.js
 */
(function () {
  'use strict';

  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chipContainer = document.getElementById('chipContainer');
  const clearChatBtn = document.getElementById('clearChatBtn');

  // -- Helpers --

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function createMsgEl(text, type) {
    // type: 'bot' | 'user'
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg ' + type;

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = type === 'bot'
      ? '<i class="fa-solid fa-user-secret"></i>'
      : '<i class="fa-solid fa-user"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';
    wrapper.id = 'typingMsg';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = '<i class="fa-solid fa-user-secret"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingMsg');
    if (el) el.remove();
  }

  // -- Mock Responses --

  const responses = {
    'Sipariş': 'Son siparişiniz <b>#REF-9988</b> durumu: <b>Yolda</b>. Tahmini teslimat: yarın.',
    'Stok': 'Stok durumu güncel. Toplam <b>1,420</b> birim ürününüz depomuzda bulunmaktadır.',
    'sevkiyat': 'Son 7 gün içinde <b>23</b> sevkiyat tamamlandı, <b>4</b> sevkiyat yolda.',
    'iade': 'Bekleyen <b>3</b> iade talebiniz var. En eski talep 5 gün önce oluşturulmuş.',
    'Rapor': 'Aylık performans raporu hazır. Sipariş artışı önceki aya göre <b>%12</b>.',
  };

  function getMockReply(userText) {
    for (const [key, reply] of Object.entries(responses)) {
      if (userText.toLowerCase().includes(key.toLowerCase())) {
        return reply;
      }
    }
    return 'Anlaşıldı, bu konuyla ilgili araştırma yapıyorum. Kısa süre içinde detayları ileteceğim. 🕵️';
  }

  // -- Actions --

  function sendMessage(text) {
    if (!text || !text.trim()) return;
    text = text.trim();

    // Add user message
    chatMessages.appendChild(createMsgEl(text, 'user'));
    scrollToBottom();

    // Show typing
    showTyping();

    // Bot reply after delay
    setTimeout(function () {
      removeTyping();

      const replyWrapper = document.createElement('div');
      replyWrapper.className = 'chat-msg bot';
      replyWrapper.style.animation = 'msgIn 0.25s ease-out';

      const avatar = document.createElement('div');
      avatar.className = 'chat-msg-avatar';
      avatar.innerHTML = '<i class="fa-solid fa-user-secret"></i>';

      const bubble = document.createElement('div');
      bubble.className = 'chat-msg-bubble';
      bubble.innerHTML = getMockReply(text);

      replyWrapper.appendChild(avatar);
      replyWrapper.appendChild(bubble);
      chatMessages.appendChild(replyWrapper);
      scrollToBottom();
    }, 1200);
  }

  // -- Event Listeners --

  // Send button
  sendBtn.addEventListener('click', function () {
    sendMessage(chatInput.value);
    chatInput.value = '';
    chatInput.focus();
  });

  // Enter key
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
      chatInput.value = '';
    }
  });

  // Chips
  chipContainer.addEventListener('click', function (e) {
    const chip = e.target.closest('.sherlock-chip');
    if (!chip) return;
    var msg = chip.getAttribute('data-msg');
    if (msg) {
      sendMessage(msg);
    }
  });

  // Clear chat
  clearChatBtn.addEventListener('click', function () {
    // Keep welcome section, remove messages
    var msgs = chatMessages.querySelectorAll('.chat-msg');
    msgs.forEach(function (m) { m.remove(); });

    // Re-add bot greeting
    var greeting = createMsgEl(
      'Size nasıl yardımcı olabilirim? Aşağıdaki konulardan birini seçebilir veya doğrudan yazabilirsiniz.',
      'bot'
    );
    chatMessages.appendChild(greeting);
    scrollToBottom();
  });

})();