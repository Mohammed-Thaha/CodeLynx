const vscode = require('vscode');
const { Cerebras } = require('@cerebras/cerebras_cloud_sdk');
const fs = require('fs').promises;
const path = require('path');

class CodeLynxHandlers {
    constructor(context) {
        this.context = context;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    getApiKey() {
        const config = vscode.workspace.getConfiguration('codelynx');
        const apiKey = config.get('cerebrasApiKey') || process.env.CEREBRAS_API_KEY;
        
        if (!apiKey || apiKey.trim() === '') {
            this.log('No API key found in configuration or environment', 'warn');
            return null;
        }
        
        return apiKey.trim();
    }

    createCerebrasClient() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        return new Cerebras({
            apiKey: apiKey
        });
    }

    async checkApiKey(panel) {
        try {
            const apiKey = this.getApiKey();
            
            if (!apiKey || apiKey.trim() === '') {
                panel.webview.postMessage({
                    command: 'apiKeyStatus',
                    status: 'missing',
                    message: 'API key not configured'
                });
                return;
            }

            const client = this.createCerebrasClient();
            
            panel.webview.postMessage({
                command: 'apiKeyStatus',
                status: 'configured',
                message: 'API key configured'
            });

        } catch (error) {
            this.log(`API key validation error: ${error.message}`, 'error');
            panel.webview.postMessage({
                command: 'apiKeyStatus',
                status: 'invalid',
                message: 'Invalid API key'
            });
        }
    }

    async updateApiKey(panel, apiKey) {
        try {
            const config = vscode.workspace.getConfiguration('codelynx');
            await config.update('cerebrasApiKey', apiKey, vscode.ConfigurationTarget.Global);
            
            this.log('API key updated successfully', 'info');
            
            panel.webview.postMessage({
                command: 'configUpdated',
                status: 'success',
                message: 'API key updated successfully'
            });

            await this.checkApiKey(panel);

        } catch (error) {
            this.log(`Failed to update API key: ${error.message}`, 'error');
            panel.webview.postMessage({
                command: 'configUpdated',
                status: 'error',
                message: 'Failed to update API key'
            });
        }
    }

    async getWorkspaceFiles() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return [];
            }

            const files = [];
            const exclude = '{**/node_modules/**,**/.*,**/*.min.js,**/dist/**,**/build/**}';
            
            for (const folder of workspaceFolders) {
                const pattern = new vscode.RelativePattern(folder, '**/*');
                const uris = await vscode.workspace.findFiles(pattern, exclude, 1000);
                
                for (const uri of uris) {
                    const stat = await vscode.workspace.fs.stat(uri);
                    if (stat.type === vscode.FileType.File) {
                        const relativePath = vscode.workspace.asRelativePath(uri);
                        files.push({
                            name: path.basename(uri.fsPath),
                            path: relativePath,
                            fullPath: uri.fsPath,
                            size: stat.size
                        });
                    }
                }
            }

            return files.sort((a, b) => a.path.localeCompare(b.path));

        } catch (error) {
            this.log(`Error getting workspace files: ${error.message}`, 'error');
            return [];
        }
    }

    async readFileContent(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            this.log(`Error reading file ${filePath}: ${error.message}`, 'error');
            throw error;
        }
    }

    async sendChatMessage(panel, message, selectedModel, conversationHistory = []) {
        try {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                panel.webview.postMessage({
                    command: 'chatResponse',
                    status: 'error',
                    message: 'Please configure your Cerebras API key first'
                });
                return;
            }

            const client = this.createCerebrasClient();
            const config = vscode.workspace.getConfiguration('codelynx');
            const temperature = config.get('chatTemperature', 0.7);
            const model = selectedModel || config.get('chatModel', 'llama3.1-8b');

            const messages = [
                {
                    role: 'system',
                    content: 'You are CodeLynx, an AI assistant specialized in helping developers with code review, explanation, debugging, and improvement suggestions. You are knowledgeable about multiple programming languages, frameworks, and best practices. Always provide clear, helpful, and actionable advice.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: message
                }
            ];

            this.log(`Sending chat message with model: ${model}`, 'info');

            const response = await client.chat.completions.create({
                model: model,
                messages: messages,
                max_tokens: 2048,
                temperature: temperature,
                stream: false
            });

            const aiMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

            panel.webview.postMessage({
                command: 'chatResponse',
                status: 'success',
                message: aiMessage,
                userMessage: message
            });

            this.log('Chat response sent successfully', 'info');

        } catch (error) {
            this.log(`Chat error: ${error.message}`, 'error');
            
            let errorMessage = 'An error occurred while processing your request.';
            if (error.message.includes('api_key')) {
                errorMessage = 'Invalid API key. Please check your configuration.';
            } else if (error.message.includes('rate_limit')) {
                errorMessage = 'Rate limit exceeded. Please try again in a moment.';
            } else if (error.message.includes('model')) {
                errorMessage = 'Selected model is not available. Please try a different model.';
            }

            panel.webview.postMessage({
                command: 'chatResponse',
                status: 'error',
                message: errorMessage
            });
        }
    }

    async clearChatHistory(panel) {
        panel.webview.postMessage({
            command: 'chatCleared',
            status: 'success'
        });
        this.log('Chat history cleared', 'info');
    }

    async configureApiKey(panel) {
        panel.webview.postMessage({
            command: 'showApiKeyConfig',
            status: 'info'
        });
    }

    getAvailableModels() {
        return [
            { id: 'llama3.1-8b', name: 'Llama 3.1 8B', description: 'Fast and efficient' },
            { id: 'llama3.1-70b', name: 'Llama 3.1 70B', description: 'Best for general conversations' },
            { id: 'llama3.1-405b', name: 'Llama 3.1 405B', description: 'Most capable model' },
            { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'Latest Llama model' }
        ];
    }
}

module.exports = CodeLynxHandlers;
