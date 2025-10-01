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
                    content: 'You are CodeLynx, an AI assistant specialized in helping developers with coding and technology. Your purpose is to assist with code review, explanation, debugging, and improvement suggestions. You are knowledgeable about multiple programming languages, frameworks, and best practices.\\n\\nYour responses should be strictly related to coding and technology. If a user asks a question that is not related to these topics, you must respond with: "The question you are asking is not in my mind." Do not answer any questions outside of your designated scope.'
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

    async generateTests(panel, codeContent, fileName, testType) {
        try {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                panel.webview.postMessage({
                    command: 'testGenerationResponse',
                    status: 'error',
                    message: 'Please configure your Cerebras API key first'
                });
                return;
            }

            const client = this.createCerebrasClient();
            const config = vscode.workspace.getConfiguration('codelynx');
            const model = config.get('chatModel', 'llama3.1-8b');

            let systemPrompt = '';
            let userPrompt = '';

            switch (testType) {
                case 'unit':
                    systemPrompt = 'You are an expert software engineer specializing in writing comprehensive unit tests. Generate complete, well-documented unit tests that cover edge cases, error handling, and various scenarios.';
                    userPrompt = `Generate comprehensive unit tests for the following code from file "${fileName}":\n\n${codeContent}\n\nProvide complete test code with proper assertions, mocking where necessary, and test all important functions and edge cases.`;
                    break;
                case 'integration':
                    systemPrompt = 'You are an expert software engineer specializing in writing integration tests. Generate tests that verify how different parts of the system work together.';
                    userPrompt = `Generate integration tests for the following code from file "${fileName}":\n\n${codeContent}\n\nFocus on testing interactions between components, API calls, database operations, and end-to-end workflows.`;
                    break;
                case 'security':
                    systemPrompt = 'You are a cybersecurity expert specializing in writing security tests. Generate tests that verify security measures and identify potential vulnerabilities.';
                    userPrompt = `Generate security tests for the following code from file "${fileName}":\n\n${codeContent}\n\nFocus on testing input validation, authentication, authorization, SQL injection prevention, XSS protection, and other security concerns.`;
                    break;
                default:
                    throw new Error('Invalid test type');
            }

            this.log(`Generating ${testType} tests for ${fileName}`, 'info');

            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 3000,
                temperature: 0.3,
                stream: false
            });

            const testCode = response.choices[0]?.message?.content || 'Sorry, I could not generate tests.';

            panel.webview.postMessage({
                command: 'testGenerationResponse',
                status: 'success',
                testType: testType,
                testCode: testCode,
                fileName: fileName
            });

            this.log(`${testType} tests generated successfully`, 'info');

        } catch (error) {
            this.log(`Test generation error: ${error.message}`, 'error');
            
            panel.webview.postMessage({
                command: 'testGenerationResponse',
                status: 'error',
                message: `An error occurred while generating ${testType} tests: ${error.message}`
            });
        }
    }

    async scanVulnerabilities(panel, codeContent, fileName) {
        try {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                panel.webview.postMessage({
                    command: 'vulnerabilityScanResponse',
                    status: 'error',
                    message: 'Please configure your Cerebras API key first'
                });
                return;
            }

            const client = this.createCerebrasClient();
            const config = vscode.workspace.getConfiguration('codelynx');
            const model = config.get('chatModel', 'llama3.1-8b');

            const systemPrompt = `You are a cybersecurity expert specializing in code vulnerability analysis. Analyze code for security vulnerabilities and provide detailed reports with severity levels, descriptions, and recommendations for fixes.

Return your analysis in the following JSON format:
{
    "vulnerabilities": [
        {
            "severity": "high|medium|low",
            "type": "vulnerability type",
            "line": "line number or range",
            "description": "detailed description",
            "recommendation": "how to fix it"
        }
    ],
    "summary": "overall security assessment"
}`;

            const userPrompt = `Analyze the following code from file "${fileName}" for security vulnerabilities:\n\n${codeContent}\n\nLook for issues like:
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Authentication and authorization flaws
- Input validation issues
- Insecure data handling
- Hardcoded secrets
- Insecure cryptographic practices
- Path traversal vulnerabilities
- Command injection
- And other common security issues

Provide a detailed analysis with specific line references where possible.`;

            this.log(`Scanning vulnerabilities for ${fileName}`, 'info');

            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 2500,
                temperature: 0.2,
                stream: false
            });

            const scanResult = response.choices[0]?.message?.content || 'Sorry, I could not analyze the code for vulnerabilities.';

            panel.webview.postMessage({
                command: 'vulnerabilityScanResponse',
                status: 'success',
                scanResult: scanResult,
                fileName: fileName
            });

            this.log('Vulnerability scan completed successfully', 'info');

        } catch (error) {
            this.log(`Vulnerability scan error: ${error.message}`, 'error');
            
            panel.webview.postMessage({
                command: 'vulnerabilityScanResponse',
                status: 'error',
                message: `An error occurred while scanning for vulnerabilities: ${error.message}`
            });
        }
    }
}

module.exports = CodeLynxHandlers;
