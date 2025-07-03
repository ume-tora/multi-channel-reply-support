# Multi-Channel Reply Assistant

AI-powered Chrome extension for generating replies across multiple messaging platforms.

## 🌟 Features

- **Multi-Platform Support**: Gmail, Google Chat, Chatwork
- **AI-Powered Replies**: OpenAI and Anthropic integration
- **One-Click Generation**: Generate replies with a single click
- **Edit Before Send**: Review and edit AI-generated replies
- **Unified UI**: Consistent interface across all platforms
- **Secure**: Manifest V3 compliant with proper permissions

## 🚀 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| Gmail | ✅ Full Support | API integration, OAuth authentication |
| Google Chat | ✅ Full Support | DOM manipulation, real-time integration |
| Chatwork | ✅ Full Support | DOM manipulation, message detection |
| LINE | ⚠️ Limited | Technical restrictions (see report) |
| Facebook Messenger | ⚠️ Limited | Policy restrictions (see report) |

## 📋 Prerequisites

- Chrome browser (version 88 or later)
- API key from OpenAI or Anthropic
- Gmail account (for Gmail integration)

## 🔧 Installation

### Method 1: Load as Developer Extension (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/multi-channel-reply-assistant.git
   cd multi-channel-reply-assistant
   ```

2. **Copy files to Chrome extension directory**
   ```bash
   # Copy manifest.json to root
   cp manifest.json ./
   
   # Copy background script
   cp src/background/background.js ./background.js
   
   # Copy content scripts
   cp src/content/gmail.js ./content/gmail.js
   cp src/content/google-chat.js ./content/google-chat.js
   cp src/content/chatwork.js ./content/chatwork.js
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the project directory

### Method 2: Chrome Web Store (Future)

*Extension will be available on Chrome Web Store after review*

## ⚙️ Setup

1. **Get API Key**
   - For OpenAI: Visit [OpenAI API](https://platform.openai.com/api-keys)
   - For Anthropic: Visit [Anthropic Console](https://console.anthropic.com/)

2. **Configure Extension**
   - Click the extension icon in Chrome toolbar
   - Select your AI provider (OpenAI or Anthropic)
   - Enter your API key
   - Choose your preferred model
   - Enable desired platforms
   - Click "Save Settings"

3. **Test Connection**
   - Click "Test Connection" to verify API access
   - You should see "Connection test successful!"

## 📖 Usage

### Gmail

1. **Open Gmail** in Chrome
2. **Navigate to an email** you want to reply to
3. **Click the AI Reply button** (🤖 icon) in the email toolbar
4. **Wait for generation** - AI will analyze the email and generate a reply
5. **Review and edit** the generated reply in the modal
6. **Send or Edit & Send** - Choose your preferred action

### Google Chat

1. **Open Google Chat** in Chrome
2. **Find a message** you want to reply to
3. **Click the AI Reply button** that appears below the message
4. **Review the generated reply** in the modal
5. **Send directly** or edit before sending

### Chatwork

1. **Open Chatwork** in Chrome
2. **Navigate to a chat room** with messages
3. **Click the AI Reply button** below any message
4. **Review and send** the generated reply

## 🔒 Security & Privacy

- **API Keys**: Stored locally in Chrome's secure storage
- **No Data Collection**: Extension doesn't collect or store message content
- **Permissions**: Only requests necessary permissions for functionality
- **Manifest V3**: Compliant with latest Chrome security standards

## 🛠️ Development

### Project Structure

```
multi-channel-reply-assistant/
├── manifest.json              # Extension manifest
├── background.js             # Background service worker
├── popup.html               # Extension popup UI
├── popup.js                 # Popup functionality
├── content/
│   ├── gmail.js            # Gmail integration
│   ├── google-chat.js      # Google Chat integration
│   └── chatwork.js         # Chatwork integration
├── src/                    # Source files
├── icons/                  # Extension icons
└── docs/                   # Documentation
```

### Building from Source

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the extension**
   ```bash
   npm run build
   ```

3. **Development mode**
   ```bash
   npm run dev
   ```

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 🔄 API Rate Limits

| Provider | Model | Rate Limit |
|----------|-------|------------|
| OpenAI | GPT-3.5 Turbo | 3 RPM / 40K TPM |
| OpenAI | GPT-4 | 3 RPM / 40K TPM |
| Anthropic | Claude 3 Haiku | 5 RPM / 25K TPM |
| Anthropic | Claude 3 Sonnet | 5 RPM / 20K TPM |

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure you've entered your API key in the extension settings
   - Test the connection using the "Test Connection" button

2. **"Failed to generate reply"**
   - Check your API key is valid and has sufficient credits
   - Verify your internet connection
   - Check if you've exceeded rate limits

3. **Reply button not appearing**
   - Refresh the page and wait for the page to fully load
   - Ensure the extension is enabled in Chrome
   - Check if the platform is enabled in extension settings

4. **Permission errors**
   - Ensure the extension has permission to access the website
   - Check Chrome's site permissions for the extension

### Debug Mode

Enable debug mode in Chrome Developer Tools:
1. Right-click on the extension icon
2. Select "Inspect popup"
3. Check the Console tab for error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/multi-channel-reply-assistant/issues)
- **Email**: support@multi-channel-reply.com
- **Documentation**: [Technical Research Report](TECHNICAL_RESEARCH_REPORT.md)

## 🎯 Roadmap

### Version 1.1
- [ ] Slack integration
- [ ] Microsoft Teams integration
- [ ] Enhanced error handling
- [ ] Performance optimizations

### Version 1.2
- [ ] Custom prompt templates
- [ ] Reply history tracking
- [ ] Analytics dashboard
- [ ] Multi-language support

### Version 2.0
- [ ] Mobile app companion
- [ ] Advanced AI models
- [ ] Team collaboration features
- [ ] Enterprise deployment

## 🙏 Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude models
- Chrome Extensions team for Manifest V3
- All beta testers and contributors

---

**Built with ❤️ for productivity and efficiency**

*Last updated: December 2024*