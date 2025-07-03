// Popup Script for Multi-Channel Reply Assistant
class PopupManager {
  constructor() {
    this.initializeElements();
    this.loadSettings();
    this.setupEventListeners();
  }

  initializeElements() {
    this.elements = {
      provider: document.getElementById('provider'),
      apiKey: document.getElementById('apiKey'),
      model: document.getElementById('model'),
      gmail: document.getElementById('gmail'),
      chatwork: document.getElementById('chatwork'),
      googleChat: document.getElementById('googleChat'),
      line: document.getElementById('line'),
      messenger: document.getElementById('messenger'),
      autoReply: document.getElementById('autoReply'),
      saveBtn: document.getElementById('saveBtn'),
      testBtn: document.getElementById('testBtn'),
      status: document.getElementById('status')
    };
  }

  setupEventListeners() {
    this.elements.provider.addEventListener('change', this.handleProviderChange.bind(this));
    this.elements.saveBtn.addEventListener('click', this.handleSave.bind(this));
    this.elements.testBtn.addEventListener('click', this.handleTest.bind(this));
  }

  handleProviderChange() {
    const provider = this.elements.provider.value;
    const modelSelect = this.elements.model;
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    if (provider === 'openai') {
      modelSelect.innerHTML = `
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
      `;
    } else if (provider === 'anthropic') {
      modelSelect.innerHTML = `
        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
      `;
    }
  }

  async loadSettings() {
    try {
      const response = await this.sendMessage({ action: 'getConfig' });
      
      if (response.success) {
        const config = response.config;
        
        this.elements.provider.value = config.provider || 'openai';
        this.elements.apiKey.value = config.apiKey || '';
        this.elements.model.value = config.model || 'gpt-3.5-turbo';
        this.elements.autoReply.checked = config.autoReply || false;
        
        // Load platform settings
        if (config.platforms) {
          this.elements.gmail.checked = config.platforms.gmail !== false;
          this.elements.chatwork.checked = config.platforms.chatwork || false;
          this.elements.googleChat.checked = config.platforms.googleChat || false;
          this.elements.line.checked = config.platforms.line || false;
          this.elements.messenger.checked = config.platforms.messenger || false;
        }
        
        // Trigger provider change to update models
        this.handleProviderChange();
        this.elements.model.value = config.model || 'gpt-3.5-turbo';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  async handleSave() {
    try {
      const config = {
        provider: this.elements.provider.value,
        apiKey: this.elements.apiKey.value,
        model: this.elements.model.value,
        autoReply: this.elements.autoReply.checked,
        platforms: {
          gmail: this.elements.gmail.checked,
          chatwork: this.elements.chatwork.checked,
          googleChat: this.elements.googleChat.checked,
          line: this.elements.line.checked,
          messenger: this.elements.messenger.checked
        }
      };

      const response = await this.sendMessage({ 
        action: 'updateConfig', 
        config: config 
      });

      if (response.success) {
        this.showStatus('Settings saved successfully!', 'success');
      } else {
        this.showStatus('Error saving settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async handleTest() {
    const apiKey = this.elements.apiKey.value;
    const provider = this.elements.provider.value;
    const model = this.elements.model.value;

    if (!apiKey) {
      this.showStatus('Please enter an API key', 'error');
      return;
    }

    try {
      this.showStatus('Testing connection...', 'info');
      
      const response = await this.sendMessage({
        action: 'generateReply',
        messageText: 'Hello, this is a test message.',
        context: { test: true }
      });

      if (response.success) {
        this.showStatus('Connection test successful!', 'success');
      } else {
        this.showStatus(`Connection test failed: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      this.showStatus('Connection test failed', 'error');
    }
  }

  showStatus(message, type) {
    const statusEl = this.elements.status;
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});