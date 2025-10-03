# Contributing to CodeLynx

Thank you for your interest in contributing to CodeLynx! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- VS Code (latest version)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/CodeLynx.git
   cd CodeLynx
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Open in VS Code**
   ```bash
   code .
   ```

4. **Run the Extension**
   - Press `F5` to open a new Extension Development Host window
   - Test your changes in the development environment

## 📝 Development Guidelines

### Code Style
- Use JavaScript/Node.js best practices
- Follow existing code formatting
- Add JSDoc comments for all functions
- Use meaningful variable and function names

### File Structure
```
src/
├── core/
│   ├── dashboard.js    # Main chat interface
│   ├── handlers.js     # API communication
│   ├── usage.js        # Usage statistics panel
│   └── errors.js       # Error handling
├── extension.js        # Main extension entry point
└── package.json        # Extension manifest
```

### Testing
- Test all new features manually
- Ensure backward compatibility
- Test with different AI models
- Verify API usage tracking

## 🐛 Bug Reports

When reporting bugs, please include:
- VS Code version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console logs (if applicable)

## 💡 Feature Requests

For new feature suggestions:
- Check existing issues first
- Provide detailed use cases
- Explain the benefits
- Consider implementation complexity

## 🔄 Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding guidelines
   - Add necessary documentation
   - Test thoroughly

3. **Commit Your Changes**
   ```bash
   git commit -m "Add: descriptive commit message"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Add screenshots if applicable

## 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update configuration documentation
- Include examples where helpful

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Collaborate constructively

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CodeLynx! 🚀