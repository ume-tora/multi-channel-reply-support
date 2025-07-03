// Multi-Channel Reply Assistant Background Script
class MultiChannelReplyAssistant {
  constructor() {
    this.initializeExtension();
  }

  initializeExtension() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle context menu actions (with delay to ensure API is ready)
    setTimeout(() => {
      this.setupContextMenu();
    }, 100);
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      // Set default configuration
      chrome.storage.sync.set({
        apiKey: '',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        autoReply: false,
        platforms: {
          gmail: true,
          chatwork: false,
          googleChat: false,
          line: false,
          messenger: false
        }
      });
    }
  }

  setupContextMenu() {
    // Check if contextMenus API is available
    if (chrome.contextMenus) {
      try {
        chrome.contextMenus.removeAll(() => {
          if (chrome.runtime.lastError) {
            console.log('Error removing context menus:', chrome.runtime.lastError);
          }
          
          chrome.contextMenus.create({
            id: 'generate-reply',
            title: 'Generate AI Reply',
            contexts: ['selection']
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Error creating context menu:', chrome.runtime.lastError);
            }
          });
        });

        chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));
      } catch (error) {
        console.error('Context menu setup error:', error);
      }
    } else {
      console.log('Context menus API not available');
    }
  }

  handleContextMenu(info, tab) {
    if (info.menuItemId === 'generate-reply') {
      chrome.tabs.sendMessage(tab.id, {
        action: 'generateReply',
        selectedText: info.selectionText
      });
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'generateReply':
          const reply = await this.generateReply(request.messageText, request.context);
          sendResponse({ success: true, reply });
          break;
        
        case 'sendMessage':
          const result = await this.sendMessage(request.platform, request.message, request.threadId);
          sendResponse({ success: true, result });
          break;
        
        case 'getConfig':
          const config = await this.getConfig();
          sendResponse({ success: true, config });
          break;
        
        case 'updateConfig':
          await this.updateConfig(request.config);
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep message channel open for async response
  }

  async generateReply(messageText, context = {}) {
    const config = await this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('API key not configured');
    }

    const prompt = this.buildPrompt(messageText, context);
    
    switch (config.provider) {
      case 'openai':
        return await this.generateOpenAIReply(prompt, config);
      case 'anthropic':
        return await this.generateAnthropicReply(prompt, config);
      default:
        throw new Error('Unsupported AI provider');
    }
  }

  buildPrompt(messageText, context) {
    const basePrompt = `You are a helpful assistant that generates professional and appropriate replies to messages. 
    Please generate a concise, polite, and relevant reply to the following message.
    
    Original message: "${messageText}"
    
    Context: ${JSON.stringify(context)}
    
    Reply:`;
    
    return basePrompt;
  }

  async generateOpenAIReply(prompt, config) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateAnthropicReply(prompt, config) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  async sendMessage(platform, message, threadId) {
    // Platform-specific message sending logic
    switch (platform) {
      case 'gmail':
        return await this.sendGmailMessage(message, threadId);
      case 'chatwork':
        return await this.sendChatworkMessage(message, threadId);
      case 'googleChat':
        return await this.sendGoogleChatMessage(message, threadId);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async sendGmailMessage(message, threadId) {
    // Gmail API integration
    const token = await this.getGmailToken();
    
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        threadId: threadId,
        raw: this.encodeEmail(message)
      })
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    return await response.json();
  }

  async sendChatworkMessage(message, roomId) {
    // Chatwork API integration (if available)
    throw new Error('Chatwork API integration not implemented yet');
  }

  async sendGoogleChatMessage(message, spaceId) {
    // Google Chat API integration
    throw new Error('Google Chat API integration not implemented yet');
  }

  async getGmailToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });
  }

  encodeEmail(message) {
    // Encode email message for Gmail API
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      message
    ].join('\n');
    
    return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data) => {
        resolve(data);
      });
    });
  }

  async updateConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(config, () => {
        resolve();
      });
    });
  }
}

// Initialize the extension
new MultiChannelReplyAssistant();