// Gmail Content Script
class GmailReplyAssistant {
  constructor() {
    this.initialized = false;
    this.replyModal = null;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Wait for Gmail to load
    this.waitForGmailLoad(() => {
      this.setupGmailIntegration();
      this.initialized = true;
    });
  }

  waitForGmailLoad(callback) {
    const checkGmailLoaded = () => {
      if (document.querySelector('[role="main"]') && document.querySelector('[data-thread-id]')) {
        callback();
      } else {
        setTimeout(checkGmailLoaded, 1000);
      }
    };
    checkGmailLoaded();
  }

  setupGmailIntegration() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
    
    // Add reply buttons to existing emails
    this.addReplyButtons();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Check if new email threads were added
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
    // Find email conversation elements
    const emailElements = document.querySelectorAll('[data-message-id]:not([data-reply-button-added])');
    
    emailElements.forEach(emailElement => {
      this.addReplyButtonToEmail(emailElement);
      emailElement.setAttribute('data-reply-button-added', 'true');
    });
  }

  addReplyButtonToEmail(emailElement) {
    const actionBar = emailElement.querySelector('.aAH, .aAD');
    if (!actionBar) return;

    const replyButton = document.createElement('div');
    replyButton.className = 'ai-reply-button';
    replyButton.innerHTML = `
      <span class="ai-reply-icon">🤖</span>
      <span class="ai-reply-text">AI Reply</span>
    `;
    replyButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      margin-left: 8px;
      background: #1a73e8;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;

    replyButton.addEventListener('mouseenter', () => {
      replyButton.style.background = '#1557b0';
    });

    replyButton.addEventListener('mouseleave', () => {
      replyButton.style.background = '#1a73e8';
    });

    replyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleReplyButtonClick(emailElement);
    });

    actionBar.appendChild(replyButton);
  }

  async handleReplyButtonClick(emailElement) {
    try {
      const messageText = this.extractMessageText(emailElement);
      const context = this.extractContext(emailElement);
      
      // Show loading state
      this.showLoadingModal();
      
      // Generate reply
      const response = await this.sendMessage({
        action: 'generateReply',
        messageText: messageText,
        context: context
      });

      if (response.success) {
        this.showReplyModal(response.reply, emailElement);
      } else {
        this.showErrorModal(response.error);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      this.showErrorModal(error.message);
    }
  }

  extractMessageText(emailElement) {
    const messageBody = emailElement.querySelector('.ii.gt div, .a3s.aiL');
    return messageBody ? messageBody.innerText.trim() : '';
  }

  extractContext(emailElement) {
    const subject = document.querySelector('h2[data-thread-id]');
    const sender = emailElement.querySelector('.go .g2');
    
    return {
      subject: subject ? subject.innerText.trim() : '',
      sender: sender ? sender.innerText.trim() : '',
      platform: 'gmail'
    };
  }

  showLoadingModal() {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal';
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

  showReplyModal(reply, emailElement) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal';
    modal.innerHTML = `
      <div class="ai-reply-modal-content">
        <div class="ai-reply-header">
          <h3>AI Generated Reply</h3>
          <button class="ai-reply-close">×</button>
        </div>
        <div class="ai-reply-body">
          <textarea class="ai-reply-textarea" rows="8">${reply}</textarea>
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
    this.setupModalEventListeners(modal, emailElement, reply);
  }

  showErrorModal(error) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'ai-reply-modal';
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

  setupModalEventListeners(modal, emailElement, originalReply) {
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
        this.sendReply(reply, emailElement);
        this.hideModal();
      }
    });
    
    editBtn.addEventListener('click', () => {
      this.openGmailCompose(textarea.value.trim());
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
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
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
        min-height: 120px;
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
        button.style.background = '#1a73e8';
        button.style.color = 'white';
      } else if (button.classList.contains('ai-reply-edit-btn')) {
        button.style.background = '#34a853';
        button.style.color = 'white';
      } else {
        button.style.background = '#f8f9fa';
        button.style.color = '#3c4043';
      }
    });
  }

  sendReply(reply, emailElement) {
    // For now, just open Gmail compose with the reply
    this.openGmailCompose(reply);
  }

  openGmailCompose(replyText) {
    // Find the reply button in Gmail and click it
    const replyButton = document.querySelector('.ams.bkH, .T-I.J-J5-Ji.T-I-Js-Gs.aaq.T-I-ax7.L3');
    if (replyButton) {
      replyButton.click();
      
      // Wait for compose window to open and fill the text
      setTimeout(() => {
        const composeArea = document.querySelector('.Am.Al.editable');
        if (composeArea) {
          composeArea.innerHTML = replyText.replace(/\n/g, '<br>');
          composeArea.focus();
        }
      }, 1000);
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

// Initialize Gmail integration
new GmailReplyAssistant();