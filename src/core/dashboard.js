const vscode = require('vscode');
const path = require('path');
const CodeLynxHandlers = require('./handlers');


class CodeLynxDashboard {
    constructor(context) {
        this.context = context;
        this._panel = null;
        this.handlers = new CodeLynxHandlers(context);
    }

    createOrShow() {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this._panel) {
            this._panel.reveal(columnToShowIn);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'codelynxChat',
            'CodeLynx - AI Code Assistant',
            columnToShowIn || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this._panel.webview.html = this._getWebviewContent();
        this._setupMessageHandling();
        
        this._panel.onDidDispose(
            () => {
                this._panel = null;
            },
            null,
            this.context.subscriptions
        );
        
        this.handlers.checkApiKey(this._panel);
    }

    _setupMessageHandling() {
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'configureApiKey':
                        await this.handlers.configureApiKey(this._panel);
                        break;
                    case 'updateApiKey':
                        await this.handlers.updateApiKey(this._panel, message.apiKey);
                        break;
                    case 'checkApiKey':
                        await this.handlers.checkApiKey(this._panel);
                        break;
                    case 'openApiKeyPage':
                        vscode.env.openExternal(vscode.Uri.parse('https://inference.cerebras.ai/'));
                        break;
                    case 'sendChatMessage':
                        await this.handlers.sendChatMessage(
                            this._panel, 
                            message.message, 
                            message.selectedModel, 
                            message.conversationHistory || []
                        );
                        break;
                    case 'clearChatHistory':
                        await this.handlers.clearChatHistory(this._panel);
                        break;
                    case 'getAvailableModels':
                        const models = this.handlers.getAvailableModels();
                        this._panel.webview.postMessage({
                            command: 'availableModels',
                            models: models
                        });
                        break;
                    case 'getWorkspaceFiles':
                        await this.getWorkspaceFiles();
                        break;
                    case 'readFile':
                        await this.readFileContent(message.fileName);
                        break;
                }
            },
            null,
            this.context.subscriptions
        );
    }

    async getWorkspaceFiles() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this._panel.webview.postMessage({
                    command: 'workspaceFiles',
                    files: [],
                    error: 'No workspace folder open'
                });
                return;
            }

            const files = await vscode.workspace.findFiles(
                '**/*.{js,ts,jsx,tsx,py,java,cpp,c,h,cs,go,rs,php,rb,swift,kt,html,css,scss,sass,less,json,xml,yaml,yml,md,txt}',
                '**/node_modules/**',
                100
            );

            const fileList = files.map(file => ({
                name: path.basename(file.path),
                relativePath: vscode.workspace.asRelativePath(file),
                extension: path.extname(file.path)
            }));

            this._panel.webview.postMessage({
                command: 'workspaceFiles',
                files: fileList
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'workspaceFiles',
                files: [],
                error: error.message
            });
        }
    }

    async readFileContent(fileName) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder open');
            }

            const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
            const fileUri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            const content = document.getText();

            this._panel.webview.postMessage({
                command: 'fileContent',
                fileName: fileName,
                content: content,
                language: document.languageId
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'fileContent',
                fileName: fileName,
                error: error.message
            });
        }
    }

    _getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeLynx - AI Code Assistant</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :root {
                    --cerebras-bg: #0a0a0a;
                    --cerebras-surface: #1a1a1a;
                    --cerebras-surface-hover: #2a2a2a;
                    --cerebras-border: #333333;
                    --cerebras-text: #ffffff;
                    --cerebras-text-secondary: #a0a0a0;
                    --cerebras-accent: teal;
                    --cerebras-accent-hover: #009688;
                    --cerebras-success: #00d4aa;
                    --cerebras-warning: #ffb800;
                    --cerebras-error: #ff4444;
                    --cerebras-radius: 8px;
                    --cerebras-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
                    background: var(--vscode-editor-background, var(--cerebras-bg));
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                    line-height: 1.6;
                    overflow-x: hidden;
                }

                .app {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                /* Header */
                .header {
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid var(--vscode-panel-border, var(--cerebras-border));
                    background: var(--vscode-editor-background, var(--cerebras-surface));
                }

                .header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    width: 32px;
                    height: 32px;
                    background: var(--cerebras-accent);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: white;
                    font-weight: bold;
                }

                .logo-text {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                }

                .config-btn {
                    background: var(--vscode-button-background, var(--cerebras-surface));
                    color: var(--vscode-button-foreground, var(--cerebras-text));
                    border: 1px solid var(--vscode-button-border, var(--cerebras-border));
                    padding: 8px 16px;
                    border-radius: var(--cerebras-radius);
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .config-btn:hover {
                    background: var(--vscode-button-hoverBackground, var(--cerebras-surface-hover));
                }

                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-ready {
                    background: var(--cerebras-success);
                    color: var(--cerebras-bg);
                }

                .status-missing {
                    background: var(--cerebras-warning);
                    color: var(--cerebras-bg);
                }

                .status-error {
                    background: var(--cerebras-error);
                    color: white;
                }

                .model-selector {
                    padding: 6px 12px;
                    border-radius: var(--cerebras-radius);
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    background: var(--vscode-input-background, var(--cerebras-surface));
                    color: var(--vscode-input-foreground, var(--cerebras-text));
                    font-size: 12px;
                    font-weight: 500;
                }

                /* File Selector */
                .file-selector {
                    padding: 16px 24px;
                    background: var(--vscode-editor-background, var(--cerebras-surface));
                    border-bottom: 1px solid var(--vscode-panel-border, var(--cerebras-border));
                }

                .file-selector-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                }

                .file-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .file-item {
                    padding: 8px 12px;
                    background: var(--vscode-input-background, var(--cerebras-surface));
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    border-radius: var(--cerebras-radius);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .file-item:hover {
                    background: var(--vscode-list-hoverBackground, var(--cerebras-surface-hover));
                    border-color: var(--cerebras-accent);
                }

                .file-item.selected {
                    background: var(--cerebras-accent);
                    color: white;
                    border-color: var(--cerebras-accent);
                }

                .file-icon {
                    font-size: 12px;
                    opacity: 0.7;
                }

                /* Chat Container */
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    min-height: 400px;
                }

                .message {
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.8;
                }

                .message-content {
                    background: var(--vscode-input-background, var(--cerebras-surface));
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    border-radius: var(--cerebras-radius);
                    padding: 16px;
                    line-height: 1.6;
                }

                .message.user .message-content {
                    background: var(--cerebras-accent);
                    color: white;
                    border-color: var(--cerebras-accent);
                }

                .message.assistant .message-header {
                    color: var(--cerebras-accent);
                }

                .message.loading .message-content {
                    opacity: 0.7;
                    font-style: italic;
                }

                /* Code blocks */
                pre {
                    background: var(--vscode-textBlockQuote-background, #1e1e1e);
                    padding: 12px;
                    border-radius: var(--cerebras-radius);
                    overflow-x: auto;
                    margin: 8px 0;
                    border: 1px solid var(--vscode-panel-border, var(--cerebras-border));
                }

                code {
                    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                    font-size: 13px;
                }

                /* Input Area */
                .input-area {
                    padding: 24px;
                    background: var(--vscode-editor-background, var(--cerebras-surface));
                    border-top: 1px solid var(--vscode-panel-border, var(--cerebras-border));
                }

                .input-container {
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                }

                .input-wrapper {
                    flex: 1;
                    position: relative;
                }

                .chat-input {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: var(--cerebras-radius);
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    background: var(--vscode-input-background, var(--cerebras-surface));
                    color: var(--vscode-input-foreground, var(--cerebras-text));
                    resize: none;
                    min-height: 48px;
                    max-height: 120px;
                    font-family: inherit;
                    font-size: 14px;
                    transition: border-color 0.2s ease;
                }

                .chat-input:focus {
                    outline: none;
                    border-color: var(--cerebras-accent);
                }

                .chat-input::placeholder {
                    color: var(--vscode-input-placeholderForeground, var(--cerebras-text-secondary));
                }

                .send-btn {
                    background: var(--cerebras-accent);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: var(--cerebras-radius);
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: background-color 0.2s ease;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .send-btn:hover {
                    background: var(--cerebras-accent-hover);
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }

                .action-btn {
                    background: var(--vscode-button-background, var(--cerebras-surface));
                    color: var(--vscode-button-foreground, var(--cerebras-text));
                    border: 1px solid var(--vscode-button-border, var(--cerebras-border));
                    padding: 6px 12px;
                    border-radius: var(--cerebras-radius);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .action-btn:hover {
                    background: var(--vscode-button-hoverBackground, var(--cerebras-surface-hover));
                }

                /* Welcome Message */
                .welcome-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground, var(--cerebras-text-secondary));
                }

                .welcome-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                }

                .welcome-subtitle {
                    font-size: 14px;
                    line-height: 1.5;
                }

                /* Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: var(--vscode-scrollbarSlider-background, var(--cerebras-surface));
                }

                ::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-background, var(--cerebras-border));
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: var(--vscode-scrollbarSlider-hoverBackground, var(--cerebras-text-secondary));
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .header-top {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }

                    .status-row {
                        width: 100%;
                    }

                    .file-grid {
                        grid-template-columns: 1fr;
                    }

                    .input-container {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .send-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }

                /* Loading animation */
                .loading-dots {
                    display: inline-block;
                }

                .loading-dots::after {
                    content: '';
                    animation: dots 1.5s steps(5, end) infinite;
                }

                @keyframes dots {
                    0%, 20% { content: '.'; }
                    40% { content: '..'; }
                    60% { content: '...'; }
                    80%, 100% { content: ''; }
                }

                /* Modal Styles */
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-content {
                    background: var(--vscode-editor-background, var(--cerebras-bg));
                    border: 1px solid var(--vscode-widget-border, var(--cerebras-border));
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid var(--vscode-widget-border, var(--cerebras-border));
                }

                .modal-header h3 {
                    margin: 0;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                    font-size: 18px;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }

                .modal-close:hover {
                    background: var(--vscode-button-hoverBackground, var(--cerebras-surface-hover));
                }

                .modal-body {
                    padding: 20px;
                }

                .modal-body p {
                    margin: 0 0 15px 0;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                }

                .input-group {
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                }

                .api-key-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    border-radius: 4px;
                    background: var(--vscode-input-background, var(--cerebras-surface));
                    color: var(--vscode-input-foreground, var(--cerebras-text));
                    font-size: 14px;
                }

                .api-key-input:focus {
                    outline: none;
                    border-color: var(--cerebras-accent);
                    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
                }

                .toggle-btn {
                    background: var(--vscode-button-background, var(--cerebras-surface));
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                    border-radius: 4px;
                    padding: 8px 12px;
                    cursor: pointer;
                    color: var(--vscode-button-foreground, var(--cerebras-text));
                }

                .toggle-btn:hover {
                    background: var(--vscode-button-hoverBackground, var(--cerebras-surface-hover));
                }

                .modal-info {
                    background: var(--vscode-textBlockQuote-background, var(--cerebras-surface));
                    border-left: 3px solid var(--cerebras-accent);
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                }

                .modal-info ol {
                    margin: 10px 0 0 0;
                    padding-left: 20px;
                }

                .modal-info li {
                    margin: 5px 0;
                    color: var(--vscode-editor-foreground, var(--cerebras-text));
                }

                .modal-info a {
                    color: var(--cerebras-accent);
                    text-decoration: none;
                }

                .modal-info a:hover {
                    text-decoration: underline;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 20px;
                    border-top: 1px solid var(--vscode-widget-border, var(--cerebras-border));
                }

                .btn-cancel, .btn-save {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    min-width: 80px;
                }

                .btn-cancel {
                    background: var(--vscode-button-secondaryBackground, var(--cerebras-surface));
                    color: var(--vscode-button-secondaryForeground, var(--cerebras-text));
                    border: 1px solid var(--vscode-input-border, var(--cerebras-border));
                }

                .btn-cancel:hover {
                    background: var(--vscode-button-secondaryHoverBackground, var(--cerebras-surface-hover));
                }

                .btn-save {
                    background: var(--cerebras-accent);
                    color: white;
                }

                .btn-save:hover {
                    background: #e55a2b;
                }

                .btn-save:disabled {
                    background: #666;
                    cursor: not-allowed;
                }
            </style>
        </head>
        <body>
            <div class="app">
                <!-- Header -->
                <div class="header">
                    <div class="header-top">
                        <div class="logo">
                            <div class="logo-icon">C</div>
                            <div class="logo-text">CodeLynx</div>
                        </div>
                        <button class="config-btn" id="configBtn">
                            <span>⚙️</span>
                            <span>Configure</span>
                        </button>
                    </div>
                    <div class="status-row">
                        <div id="apiStatus" class="status-badge status-missing">
                            <span>🔑</span>
                            <span>Checking API...</span>
                        </div>
                        <select class="model-selector" id="modelSelector">
                            <option value="">Loading models...</option>
                        </select>
                    </div>
                </div>

                <!-- File Selector -->
                <div class="file-selector">
                    <div class="file-selector-title">📁 Select a file to review and discuss:</div>
                    <div class="file-grid" id="fileGrid">
                        <div class="file-item" data-action="load-files">
                            <span class="file-icon">🔄</span>
                            <span>Load workspace files...</span>
                        </div>
                    </div>
                </div>

                <!-- Chat Container -->
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages">
                        <div class="welcome-message">
                            <div class="welcome-title">👋 Welcome to CodeLynx</div>
                            <div class="welcome-subtitle">
                                Select a file from your workspace above, and I'll help you understand, review, or improve your code.
                                <br>You can also ask me any coding questions!
                            </div>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="input-area">
                        <div class="input-container">
                            <div class="input-wrapper">
                                <textarea 
                                    class="chat-input" 
                                    id="chatInput" 
                                    placeholder="Ask about your code, request explanations, or get coding help..."
                                    rows="1"
                                ></textarea>
                            </div>
                            <button class="send-btn" id="sendBtn">
                                <span>✈️</span>
                                <span>Send</span>
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn" id="clearBtn">🗑️ Clear Chat</button>
                            <button class="action-btn" id="explainBtn" style="display: none;">🔍 Explain Code</button>
                            <button class="action-btn" id="reviewBtn" style="display: none;">📝 Review Code</button>
                            <button class="action-btn" id="improveBtn" style="display: none;">✨ Suggest Improvements</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- API Key Configuration Modal -->
            <div class="modal" id="apiKeyModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔑 Configure Cerebras API Key</h3>
                        <button class="modal-close" id="modalClose">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Enter your Cerebras API key to start using CodeLynx:</p>
                        <div class="input-group">
                            <input 
                                type="password" 
                                id="apiKeyInput" 
                                placeholder="Enter your Cerebras API key..."
                                class="api-key-input"
                            />
                            <button id="toggleApiKey" class="toggle-btn" title="Show/Hide API Key">👁️</button>
                        </div>
                        <div class="modal-info">
                            <p>📋 <strong>How to get your API key:</strong></p>
                            <ol>
                                <li>Visit <a href="#" id="cerebrasLink">cloud.cerebras.ai</a></li>
                                <li>Sign up or log in to your account</li>
                                <li>Navigate to API Keys section</li>
                                <li>Create a new API key</li>
                                <li>Copy and paste it here</li>
                            </ol>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="cancelBtn">Cancel</button>
                        <button class="btn-save" id="saveApiKey">Save API Key</button>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let conversationHistory = [];
                let currentModel = '';
                let selectedFile = null;
                let fileContent = '';

                // Message handling
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'apiKeyStatus':
                            updateApiStatus(message.status);
                            break;
                        case 'showApiKeyConfig':
                            showApiKeyModal();
                            break;
                        case 'chatResponse':
                            handleChatResponse(message);
                            break;
                        case 'chatCleared':
                            clearChatMessages();
                            break;
                        case 'availableModels':
                            populateModelSelector(message.models);
                            break;
                        case 'workspaceFiles':
                            displayWorkspaceFiles(message.files, message.error);
                            break;
                        case 'fileContent':
                            handleFileContent(message);
                            break;
                    }
                });

                function updateApiStatus(status) {
                    const statusElement = document.getElementById('apiStatus');
                    
                    if (status === 'configured') {
                        statusElement.innerHTML = '<span>✅</span><span>Ready</span>';
                        statusElement.className = 'status-badge status-ready';
                    } else if (status === 'error') {
                        statusElement.innerHTML = '<span>⚠️</span><span>Error</span>';
                        statusElement.className = 'status-badge status-error';
                    } else {
                        statusElement.innerHTML = '<span>🔑</span><span>Setup Required</span>';
                        statusElement.className = 'status-badge status-missing';
                    }
                }

                function showApiKeyModal() {
                    const modal = document.getElementById('apiKeyModal');
                    modal.style.display = 'flex';
                    document.getElementById('apiKeyInput').focus();
                }

                function hideApiKeyModal() {
                    const modal = document.getElementById('apiKeyModal');
                    modal.style.display = 'none';
                    document.getElementById('apiKeyInput').value = '';
                }

                function saveApiKey() {
                    const apiKey = document.getElementById('apiKeyInput').value.trim();
                    if (apiKey) {
                        vscode.postMessage({ 
                            command: 'updateApiKey', 
                            apiKey: apiKey 
                        });
                        hideApiKeyModal();
                    }
                }

                function toggleApiKeyVisibility() {
                    const input = document.getElementById('apiKeyInput');
                    const button = document.getElementById('toggleApiKey');
                    
                    if (input.type === 'password') {
                        input.type = 'text';
                        button.textContent = '🙈';
                    } else {
                        input.type = 'password';
                        button.textContent = '👁️';
                    }
                }

                function populateModelSelector(models) {
                    const selector = document.getElementById('modelSelector');
                    selector.innerHTML = '';
                    
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name;
                        selector.appendChild(option);
                    });

                    if (models.length > 0) {
                        selector.value = 'llama-3.3-70b';
                        currentModel = 'llama-3.3-70b';
                    }
                }

                function displayWorkspaceFiles(files, error) {
                    const fileGrid = document.getElementById('fileGrid');
                    
                    if (error) {
                        fileGrid.innerHTML = \`
                            <div class="file-item">
                                <span class="file-icon">❌</span>
                                <span>Error: \${error}</span>
                            </div>
                        \`;
                        return;
                    }

                    if (files.length === 0) {
                        fileGrid.innerHTML = \`
                            <div class="file-item">
                                <span class="file-icon">📁</span>
                                <span>No files found</span>
                            </div>
                        \`;
                        return;
                    }

                    fileGrid.innerHTML = files.map(file => \`
                        <div class="file-item" data-file="\${file.relativePath}">
                            <span class="file-icon">\${getFileIcon(file.extension)}</span>
                            <span title="\${file.relativePath}">\${file.name}</span>
                        </div>
                    \`).join('');

                    // Add click handlers
                    fileGrid.querySelectorAll('.file-item[data-file]').forEach(item => {
                        item.addEventListener('click', () => {
                            selectFile(item.dataset.file, item);
                        });
                    });
                }

                function getFileIcon(extension) {
                    const icons = {
                        '.js': '📄', '.ts': '📘', '.jsx': '⚛️', '.tsx': '⚛️',
                        '.py': '🐍', '.java': '☕', '.cpp': '🔧', '.c': '🔧',
                        '.cs': '🟦', '.go': '🐹', '.rs': '🦀', '.php': '🐘',
                        '.rb': '💎', '.swift': '🕊️', '.kt': '🅺', '.html': '🌐',
                        '.css': '🎨', '.scss': '🎨', '.sass': '🎨', '.json': '📋',
                        '.md': '📝', '.txt': '📄', '.xml': '📄', '.yaml': '📄',
                        '.yml': '📄'
                    };
                    return icons[extension] || '📄';
                }

                function selectFile(filePath, element) {
                    // Update UI
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    element.classList.add('selected');

                    selectedFile = filePath;
                    
                    // Show action buttons
                    document.getElementById('explainBtn').style.display = 'inline-block';
                    document.getElementById('reviewBtn').style.display = 'inline-block';
                    document.getElementById('improveBtn').style.display = 'inline-block';

                    // Load file content
                    vscode.postMessage({
                        command: 'readFile',
                        fileName: filePath
                    });
                }

                function handleFileContent(message) {
                    if (message.error) {
                        addMessage('system', \`Error reading file: \${message.error}\`);
                        return;
                    }

                    fileContent = message.content;
                    addMessage('system', \`📁 Loaded \${message.fileName} (\${message.language}). You can now ask questions about this code or use the action buttons below.\`);
                }

                function addMessage(type, content, isLoading = false) {
                    const messagesContainer = document.getElementById('chatMessages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${type}\`;
                    
                    if (isLoading) {
                        messageDiv.id = 'loadingMessage';
                    }

                    const headerText = type === 'user' ? 'You' : type === 'system' ? 'System' : 'CodeLynx AI';
                    const headerIcon = type === 'user' ? '👤' : type === 'system' ? '⚙️' : '🤖';

                    messageDiv.innerHTML = \`
                        <div class="message-header">
                            <span>\${headerIcon}</span>
                            <span>\${headerText}</span>
                        </div>
                        <div class="message-content">\${isLoading ? \`\${content}<span class="loading-dots"></span>\` : formatContent(content)}</div>
                    \`;

                    messagesContainer.appendChild(messageDiv);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;

                    // Hide welcome message
                    const welcome = messagesContainer.querySelector('.welcome-message');
                    if (welcome) welcome.style.display = 'none';

                    return messageDiv;
                }

                function formatContent(content) {
                    return content
                        .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
                        .replace(/\`([^\`]+)\`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
                        .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
                        .replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>')
                        .replace(/\\n/g, '<br>');
                }

                function handleChatResponse(message) {
                    const loadingMessage = document.getElementById('loadingMessage');
                    if (loadingMessage) {
                        loadingMessage.remove();
                    }

                    if (message.status === 'success') {
                        addMessage('assistant', message.message);
                        conversationHistory.push({ role: 'user', content: message.userMessage });
                        conversationHistory.push({ role: 'assistant', content: message.message });
                        
                        if (conversationHistory.length > 20) {
                            conversationHistory = conversationHistory.slice(-20);
                        }
                    } else {
                        addMessage('assistant', \` \${message.message}\`);
                    }
                }

                function sendMessage(messageText, isAction = false) {
                    if (!messageText.trim()) return;

                    if (!isAction) {
                        addMessage('user', messageText);
                    }
                    
                    addMessage('assistant', 'Thinking', true);

                    const modelSelector = document.getElementById('modelSelector');
                    const selectedModel = modelSelector.value || currentModel;

                    vscode.postMessage({
                        command: 'sendChatMessage',
                        message: messageText,
                        selectedModel: selectedModel,
                        conversationHistory: conversationHistory
                    });
                }

                function clearChatMessages() {
                    const messagesContainer = document.getElementById('chatMessages');
                    messagesContainer.innerHTML = \`
                        <div class="welcome-message">
                            <div class="welcome-title">👋 Welcome to CodeLynx</div>
                            <div class="welcome-subtitle">
                                Select a file from your workspace above, and I'll help you understand, review, or improve your code.
                                <br>You can also ask me any coding questions!
                            </div>
                        </div>
                    \`;
                    conversationHistory = [];
                }

                function adjustTextareaHeight(textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
                }

                // Event listeners
                window.onload = function() {
                    const configBtn = document.getElementById('configBtn');
                    const sendBtn = document.getElementById('sendBtn');
                    const chatInput = document.getElementById('chatInput');
                    const clearBtn = document.getElementById('clearBtn');
                    const explainBtn = document.getElementById('explainBtn');
                    const reviewBtn = document.getElementById('reviewBtn');
                    const improveBtn = document.getElementById('improveBtn');
                    const modelSelector = document.getElementById('modelSelector');

                    configBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'configureApiKey' });
                    });

                    sendBtn.addEventListener('click', () => {
                        const message = chatInput.value.trim();
                        if (message) {
                            sendMessage(message);
                            chatInput.value = '';
                            adjustTextareaHeight(chatInput);
                        }
                    });

                    chatInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendBtn.click();
                        }
                    });

                    chatInput.addEventListener('input', () => {
                        adjustTextareaHeight(chatInput);
                    });

                    clearBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'clearChatHistory' });
                    });

                    explainBtn.addEventListener('click', () => {
                        if (selectedFile && fileContent) {
                            const message = \`Please explain this code from \${selectedFile}:\\n\\n\\\`\\\`\\\`\\n\${fileContent}\\n\\\`\\\`\\\`\`;
                            sendMessage(message, true);
                            addMessage('user', \`🔍 Explain the code in \${selectedFile}\`);
                        }
                    });

                    reviewBtn.addEventListener('click', () => {
                        if (selectedFile && fileContent) {
                            const message = \`Please review this code from \${selectedFile} and provide feedback on code quality, potential issues, and best practices:\\n\\n\\\`\\\`\\\`\\n\${fileContent}\\n\\\`\\\`\\\`\`;
                            sendMessage(message, true);
                            addMessage('user', \`📝 Review the code in \${selectedFile}\`);
                        }
                    });

                    improveBtn.addEventListener('click', () => {
                        if (selectedFile && fileContent) {
                            const message = \`Please suggest improvements for this code from \${selectedFile}. Focus on performance, readability, maintainability, and best practices:\\n\\n\\\`\\\`\\\`\\n\${fileContent}\\n\\\`\\\`\\\`\`;
                            sendMessage(message, true);
                            addMessage('user', \`✨ Suggest improvements for \${selectedFile}\`);
                        }
                    });

                    modelSelector.addEventListener('change', (e) => {
                        currentModel = e.target.value;
                    });

                    // Load files on click
                    document.addEventListener('click', (e) => {
                        if (e.target.closest('[data-action="load-files"]')) {
                            vscode.postMessage({ command: 'getWorkspaceFiles' });
                        }
                    });

                    // Modal event listeners
                    const modalClose = document.getElementById('modalClose');
                    const cancelBtn = document.getElementById('cancelBtn');
                    const saveApiKeyBtn = document.getElementById('saveApiKey');
                    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
                    const apiKeyInput = document.getElementById('apiKeyInput');
                    const cerebrasLink = document.getElementById('cerebrasLink');
                    const modal = document.getElementById('apiKeyModal');

                    modalClose.addEventListener('click', hideApiKeyModal);
                    cancelBtn.addEventListener('click', hideApiKeyModal);
                    saveApiKeyBtn.addEventListener('click', saveApiKey);
                    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
                    
                    cerebrasLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        vscode.postMessage({ command: 'openApiKeyPage' });
                    });

                    // Close modal on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            hideApiKeyModal();
                        }
                    });

                    // Handle Enter key in API key input
                    apiKeyInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveApiKey();
                        }
                    });

                    // Initialize
                    vscode.postMessage({ command: 'getAvailableModels' });
                    vscode.postMessage({ command: 'checkApiKey' });
                    vscode.postMessage({ command: 'getWorkspaceFiles' });
                };
            </script>
        </body>
        </html>`;
    }
}

module.exports = CodeLynxDashboard;