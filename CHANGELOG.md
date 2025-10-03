# Changelog

All notable changes to the CodeLynx extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-03

### 🎉 Initial Release - CodeLynx AI Code Assistant

#### ✨ **New Features**- **Streamlined core functionality** focusing on Docker workflow

- **AI-Powered Code Chat**: Interactive chat interface with Cerebras AI models- **Clean, modern dashboard** with intuitive interface

- **File Selection**: Click any workspace file for targeted AI analysis- **Simplified API integration** using only Cerebras AI

- **Smart Code Actions**: - **Removed complexity** and unnecessary features

  - Explain Code functionality- **Production-grade error handling** and user experience

  - Code Review assistance

  - Improvement suggestions### 🚀 Features

- **Multiple AI Models**: Support for Llama, Qwen, and GPT-OSS models- AI-powered Dockerfile generation with Cerebras AI

- **Cerebras-Inspired UI**: Clean, modern dark theme interface- Smart project analysis and framework detection

- Beautiful, responsive dashboard UI

#### ⚙️ **Configuration**- Secure API key management

- **API Key Management**: Secure configuration through VS Code settings- One-click Docker file generation

- **Model Selection**: Choose from multiple Cerebras AI models

- **Temperature Control**: Adjust AI response creativity (0.0-1.0)### 🗑️ Removed

- **Environment Variable Support**: `CEREBRAS_API_KEY` fallback option- Multiple AI provider complexity

- GitHub integration features

#### 🔧 **Technical Features**- Docker MCP gateway

- **Official Cerebras SDK**: Integration with `@cerebras/cerebras_cloud_sdk`- Complex template system

- **Workspace Integration**: Automatic file discovery and content reading- Hackathon-specific configurations

- **Real-time Chat**: Instant AI responses with conversation history

- **Error Handling**: Comprehensive error management and user feedback### 🔧 Technical

- **Responsive Design**: Adaptive UI for different screen sizes- Clean modular architecture with `src/core/` structure

- Simplified dependency tree

#### 🚀 **Commands**- Professional error handling

- `CodeLynx: Open AI Chat` - Main extension interface- Optimized bundle size

- Better performance

#### 🔒 **Security**

- Secure API key storage in VS Code user settings## [1.0.0] - 2024-12-XX

- No local data persistence of conversations or code

- Direct communication with Cerebras API### 🎉 Initial Release

- Basic Dockerfile generation

---- Multiple AI provider support

- Initial dashboard implementation
## Development Notes

### Architecture
- **Extension Host**: `extension.js` - Main activation and command registration
- **Dashboard**: `src/core/dashboard.js` - Webview UI and user interactions
- **Handlers**: `src/core/handlers.js` - Backend logic and API integration
- **Error Management**: `src/core/errors.js` - Centralized error handling

### Dependencies
- `@cerebras/cerebras_cloud_sdk`: Official Cerebras AI SDK
- VS Code Engine: `^1.70.0`

### Configuration Schema
```json
{
  "codelynx.cerebrasApiKey": "string",
  "codelynx.chatModel": "enum",
  "codelynx.chatTemperature": "number",
  "codelynx.apiEndpoint": "string"
}
```

---

**For more information, visit our [GitHub repository](https://github.com/your-repo/codelynx)**