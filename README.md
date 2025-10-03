# CodeLynx - AI Code Assistant

<div align="center">

![CodeLynx Logo](https://github.com/Mohammed-Thaha/CodeLynx/raw/main/assets/banner.png)

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=Futuronix.codelynx)
[![Version](https://img.shields.io/badge/version-1.0.0-green?style=flat-square)](https://github.com/Mohammed-Thaha/CodeLynx)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE.md)
[![FutureStack 2025](https://img.shields.io/badge/FutureStack-GenAI%20Hackathon-ff6b35?style=flat-square)](https://futurestack.dev)

**Next-generation AI-powered code assistant with real-time analysis and intelligent suggestions**

[Install Extension](https://marketplace.visualstudio.com/items?itemName=Futuronix.codelynx) • [Demo](https://github.com/Mohammed-Thaha/CodeLynx#demo) • [Documentation](https://github.com/Mohammed-Thaha/CodeLynx/wiki)

</div>

---

## ✨ Features

### 🤖 **AI-Powered Code Analysis**
- Real-time code review and suggestions
- Intelligent error detection and fixes
- Context-aware code explanations

### 🔍 **Smart Code Assistance**
- Interactive AI chat for coding questions
- Multi-language support with advanced models
- Instant code documentation generation

### 📊 **Usage Analytics**
- Real-time API usage tracking
- Daily request limits and monitoring
- Performance insights and optimization tips

### 🛡️ **Security & Testing**
- Automated vulnerability scanning
- Unit, integration, and security test generation
- Best practices enforcement

---

## 🎬 Demo

![CodeLynx Demo](https://github.com/Mohammed-Thaha/CodeLynx/blob/main/assets/demo.gif)

*CodeLynx in action: AI-powered code assistance with real-time suggestions and analysis*

---

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace**
   ```
   ext install Futuronix.codelynx
   ```

2. **Manual Installation**
   - Download the latest `.vsix` file from [Releases](https://github.com/Mohammed-Thaha/CodeLynx/releases)
   - Open VS Code → Extensions → Install from VSIX

### Setup

1. **Get your Cerebras API key**
   - Visit [Cerebras Inference](https://inference.cerebras.ai/)
   - Sign up for free access
   - Copy your API key

2. **Configure CodeLynx**
   - Open VS Code Settings (`Ctrl+,`)
   - Search for "CodeLynx"
   - Paste your API key in `codelynx.cerebrasApiKey`

3. **Start coding with AI**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `CodeLynx: Open AI Chat`
   - Ask questions about your code!

---

## 💡 Usage

### AI Chat Assistant
```
Ctrl+Shift+P → "CodeLynx: Open AI Chat"
```
- Ask questions about your code
- Get explanations for complex functions
- Request optimization suggestions
- Generate documentation

### API Usage Statistics
```
Ctrl+Shift+P → "CodeLynx: Show API Usage Statistics"
```
- Monitor your daily API usage
- Track token consumption
- View model usage distribution
- Export usage data

### Code Analysis
- **Vulnerability Scanning**: Detect security issues automatically
- **Test Generation**: Create comprehensive test suites
- **Code Review**: Get AI-powered code quality insights

---

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `codelynx.cerebrasApiKey` | Your Cerebras API key | `""` |
| `codelynx.chatModel` | AI model for conversations | `llama-3.3-70b` |
| `codelynx.chatTemperature` | Response creativity (0.0-1.0) | `0.7` |
| `codelynx.apiDailyLimit` | Daily API request limit | `100` |
| `codelynx.enableTelemetry` | Anonymous usage analytics | `true` |

---

## 🏗️ Built for FutureStack GenAI Hackathon 2025

CodeLynx represents the future of developer productivity, combining:
- **Cutting-edge AI models** from Cerebras
- **Seamless VS Code integration**
- **Real-time code intelligence**
- **Privacy-first approach**

### Tech Stack
- **Frontend**: VS Code Extension API, HTML/CSS/JavaScript
- **Backend**: Node.js, Cerebras AI SDK
- **AI Models**: Llama 3.3, GPT-OSS, Qwen-3
- **Storage**: VS Code GlobalState API

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/Mohammed-Thaha/CodeLynx.git
cd CodeLynx

# Install dependencies
npm install

# Open in VS Code
code .

# Press F5 to run the extension in a new Extension Development Host window
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## 🌟 Acknowledgments

- **Cerebras Systems** for providing powerful AI inference capabilities
- **FutureStack Team** for organizing the GenAI Hackathon 2025
- **VS Code Team** for the excellent extension platform
- **Open Source Community** for inspiration and support

---

<div align="center">

**Built with ❤️ for the developer community**

[⬆ Back to top](#codelynx---ai-code-assistant)

</div>