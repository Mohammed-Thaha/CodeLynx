# CodeLynx - AI Code Assistant

<div align="center">

![CodeLynx Logo](https://codelynx-ai.netlify.app/assets/banner.png)

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=Futuronix.codelynx)
[![Version](https://img.shields.io/badge/version-1.0.4-green?style=flat-square)](https://github.com/Mohammed-Thaha/CodeLynx)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE.md)
[![FutureStack 2025](https://img.shields.io/badge/FutureStack-GenAI%20Hackathon-ff6b35?style=flat-square)](https://futurestack.dev)

**Next-generation AI-powered code assistant with real-time analysis and intelligent suggestions**

[Install Extension](https://marketplace.visualstudio.com/items?itemName=Codelynx.codelynx) • [Demo](https://github.com/Mohammed-Thaha/CodeLynx#demo) • [Documentation](https://github.com/Mohammed-Thaha/CodeLynx/wiki)

</div>

---

## ✨ Features

### 🤖 **Your AI Coding Companion**
- Chat naturally with AI about your code - just like talking to a senior developer
- Get instant explanations for that confusing function you inherited
- Receive personalized suggestions tailored to your coding style

### 💬 **Smart Conversations About Code**
- Ask "What does this function do?" and get clear, human-friendly explanations
- Upload any file from your workspace and discuss it with AI
- Switch between different AI personalities for various coding tasks
- Generate documentation that actually makes sense

### 📊 **Stay in Control of Your Usage**
- See exactly how much you're using the AI (no surprise bills!)
- Set daily limits so you don't go overboard
- Track which models work best for your projects
- Export your usage data whenever you need it

### 🛠️ **Built for Real Developers**
- Works seamlessly in VS Code - no context switching needed
- Lightweight and fast - won't slow down your workflow
- Your code stays private - only what you choose to share gets analyzed
- Configure everything the way you like it

### 🚀 **Actually Helpful AI Features**
- Get unstuck when you're debugging at 2 AM
- Learn new programming concepts through interactive conversations
- Optimize your code with AI suggestions that make sense
- Generate boilerplate code so you can focus on the interesting stuff

---

## 🎬 Demo

![CodeLynx Demo](https://github.com/Mohammed-Thaha/CodeLynx/blob/main/assets/demo.gif?raw=true)

*CodeLynx in action: AI-powered code assistance with real-time suggestions and analysis*

---

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace**
   ```
   ext install Codelynx.codelynx
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
| `codelynx.cerebrasApiKey` | Your Cerebras API key for authentication | `""` |
| `codelynx.defaultModel` | Default AI model for conversations | `"llama3.1-8b"` |
| `codelynx.temperature` | Response creativity level (0.0-1.0) | `0.7` |
| `codelynx.maxTokens` | Maximum tokens per API response | `1000` |
| `codelynx.enableApiRateLimit` | Enable daily API request limiting | `true` |
| `codelynx.apiRateLimitDaily` | Maximum daily API requests allowed | `100` |

### Advanced Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `codelynx.timeout` | API request timeout in milliseconds | `30000` |
| `codelynx.enableLogging` | Enable detailed logging for debugging | `false` |

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