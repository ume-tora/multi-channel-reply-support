// Chatwork Content Script
class ChatworkReplyAssistant {
  constructor() {
    this.initialized = false;
    this.replyModal = null;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Wait for Chatwork to load
    this.waitForChatworkLoad(() => {
      this.setupChatworkIntegration();
      this.initialized = true;
    });
  }

  waitForChatworkLoad(callback) {
    const checkChatworkLoaded = () => {
      if (document.querySelector('#_chatText') || document.querySelector('.chatTimeLineLists')) {
        callback();
      } else {
        setTimeout(checkChatworkLoaded, 1000);
      }
    };
    checkChatworkLoaded();
  }

  setupChatworkIntegration() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
    
    // Add reply buttons to existing messages
    this.addReplyButtons();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Check if new messages were added
          this.addReplyButtons();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addReplyButtons() {
    // Find message elements that don't have reply buttons yet
    const messageElements = document.querySelectorAll('.chatTimeLineLists li:not([data-ai-reply-added]), .timeline_item:not([data-ai-reply-added])');
    
    messageElements.forEach(messageElement => {
      this.addReplyButtonToMessage(messageElement);
      messageElement.setAttribute('data-ai-reply-added', 'true');
    });
  }

  addReplyButtonToMessage(messageElement) {
    // Find the message content area
    const messageContent = messageElement.querySelector('.timeline_body, .chatTimeLineBody');
    if (!messageContent) return;

    // Don't add button to own messages
    if (messageElement.classList.contains('myMessage') || messageElement.querySelector('.myMessage')) {
      return;
    }

    const replyButton = document.createElement('div');
    replyButton.className = 'ai-reply-button-chatwork';
    replyButton.innerHTML = `
      <span class="ai-reply-icon">🤖</span>
      <span class="ai-reply-text">AI Reply</span>
    `;
    replyButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      margin: 4px 0;
      background: #00a0e9;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.2s;
      position: relative;
      z-index: 1000;
    `;

    replyButton.addEventListener('mouseenter', () => {
      replyButton.style.background = '#0088cc';
    });

    replyButton.addEventListener('mouseleave', () => {
      replyButton.style.background = '#00a0e9';
    });

    replyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleReplyButtonClick(messageElement);
    });

    // Insert after the message content
    messageContent.appendChild(replyButton);
  }

  async handleReplyButtonClick(messageElement) {
    try {
      const messageText = this.extractMessageText(messageElement);
      const context = this.extractContext(messageElement);
      
      // Show loading state
      this.showLoadingModal();
      
      // Generate reply
      const response = await this.sendMessage({
        action: 'generateReply',
        messageText: messageText,
        context: context
      });

      if (response.success) {
        this.showReplyModal(response.reply, messageElement);
      } else {
        this.showErrorModal(response.error);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      this.showErrorModal(error.message);
    }
  }

  extractMessageText(messageElement) {
    const textContent = messageElement.querySelector('.timeline_body, .chatTimeLineBody');
    if (!textContent) return '';
    
    // Remove our reply button from the extracted text
    const clonedContent = textContent.cloneNode(true);
    const aiButton = clonedContent.querySelector('.ai-reply-button-chatwork');
    if (aiButton) {
      aiButton.remove();
    }
    
    // Also remove other UI elements that might be in the content
    const uiElements = clonedContent.querySelectorAll('.timeline_info, .chatTimeLineInfo, .timeline_actions');
    uiElements.forEach(el => el.remove());
    
    return clonedContent.innerText.trim();
  }

  extractContext(messageElement) {
    const sender = messageElement.querySelector('.timeline_info .name, .chatTimeLineInfo .name');
    const timestamp = messageElement.querySelector('.timeline_info .time, .chatTimeLineInfo .time');
    
    return {
      sender: sender ? sender.innerText.trim() : '',
      timestamp: timestamp ? timestamp.innerText.trim() : '',
      platform: 'chatwork'
    };
  }

  showLoadingModal() {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal-chatwork';
    modal.innerHTML = `
      <div class="ai-reply-modal-content">
        <div class="ai-reply-loading">
          <div class="ai-reply-spinner"></div>
          <p>Generating AI reply...</p>
        </div>
      </div>
    `;
    
    this.applyModalStyles(modal);
    document.body.appendChild(modal);
    this.replyModal = modal;
  }

  showReplyModal(reply, messageElement) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal-chatwork';
    modal.innerHTML = `
      <div class="ai-reply-modal-content">
        <div class="ai-reply-header">
          <h3>AI Generated Reply</h3>
          <button class="ai-reply-close">×</button>
        </div>
        <div class="ai-reply-body">
          <textarea class="ai-reply-textarea" rows="6">${reply}</textarea>
        </div>
        <div class="ai-reply-footer">
          <button class="ai-reply-send-btn">Send Reply</button>
          <button class="ai-reply-edit-btn">Edit & Send</button>
          <button class="ai-reply-cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    
    this.applyModalStyles(modal);
    document.body.appendChild(modal);
    this.replyModal = modal;
    
    // Add event listeners
    this.setupModalEventListeners(modal, messageElement);
  }

  showErrorModal(error) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal-chatwork';
    modal.innerHTML = `
      <div class="ai-reply-modal-content">
        <div class="ai-reply-header">
          <h3>Error</h3>
          <button class="ai-reply-close">×</button>
        </div>
        <div class="ai-reply-body">
          <p class="ai-reply-error">Failed to generate reply: ${error}</p>
        </div>
        <div class="ai-reply-footer">
          <button class="ai-reply-cancel-btn">Close</button>
        </div>
      </div>
    `;
    
    this.applyModalStyles(modal);
    document.body.appendChild(modal);
    this.replyModal = modal;
    
    // Add close event listener
    modal.querySelector('.ai-reply-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.ai-reply-cancel-btn').addEventListener('click', () => this.hideModal());
  }

  setupModalEventListeners(modal, messageElement) {
    const closeBtn = modal.querySelector('.ai-reply-close');
    const sendBtn = modal.querySelector('.ai-reply-send-btn');
    const editBtn = modal.querySelector('.ai-reply-edit-btn');
    const cancelBtn = modal.querySelector('.ai-reply-cancel-btn');
    const textarea = modal.querySelector('.ai-reply-textarea');
    
    closeBtn.addEventListener('click', () => this.hideModal());
    cancelBtn.addEventListener('click', () => this.hideModal());
    
    sendBtn.addEventListener('click', () => {
      const reply = textarea.value.trim();
      if (reply) {
        this.sendReply(reply);
        this.hideModal();
      }
    });
    
    editBtn.addEventListener('click', () => {
      this.insertTextIntoInput(textarea.value.trim());
      this.hideModal();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    });
  }

  applyModalStyles(modal) {
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const content = modal.querySelector('.ai-reply-modal-content');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    // Add specific styles for different elements
    const header = modal.querySelector('.ai-reply-header');
    if (header) {
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e0e0e0;
      `;
    }
    
    const textarea = modal.querySelector('.ai-reply-textarea');
    if (textarea) {
      textarea.style.cssText = `
        width: 100%;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        font-size: 14px;
        resize: vertical;
        min-height: 100px;
      `;
    }
    
    const footer = modal.querySelector('.ai-reply-footer');
    if (footer) {
      footer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      `;
    }
    
    // Style buttons
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(button => {
      button.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      `;
      
      if (button.classList.contains('ai-reply-send-btn')) {
        button.style.background = '#00a0e9';
        button.style.color = 'white';
      } else if (button.classList.contains('ai-reply-edit-btn')) {
        button.style.background = '#34a853';
        button.style.color = 'white';
      } else {
        button.style.background = '#f8f9fa';
        button.style.color = '#3c4043';
      }
    });
    
    // Loading spinner styles
    const spinner = modal.querySelector('.ai-reply-spinner');
    if (spinner) {
      spinner.style.cssText = `
        border: 2px solid #f3f3f3;
        border-top: 2px solid #00a0e9;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      `;
    }
  }

  sendReply(reply) {
    this.insertTextIntoInput(reply);
    
    // Try to find and click the send button
    setTimeout(() => {
      const sendButton = document.querySelector('#_sendButton, .sendButton, [data-tooltip="Send"]');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
      }
    }, 100);
  }

  insertTextIntoInput(text) {
    // Find the input field
    const inputField = document.querySelector('#_chatText, .chatText, [data-role="chatText"]');
    
    if (inputField) {
      // Focus the input field
      inputField.focus();
      
      // Insert text
      inputField.value = text;
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      inputField.dispatchEvent(event);
    }
  }

  hideModal() {
    if (this.replyModal) {
      this.replyModal.remove();
      this.replyModal = null;
    }
  }

  handleMessage(request, sender, sendResponse) {
    if (request.action === 'generateReply') {
      // Handle context menu generated reply
      if (request.selectedText) {
        this.handleReplyButtonClick(null);
      }
    }
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize Chatwork integration
new ChatworkReplyAssistant();