const vscode = require('vscode');
const path = require('path');
const CodeLynxHandlers = require('./handlers');

/**
 * CodeLynxUsagePanel - A separate webview panel for displaying API usage statistics
 * This class manages a webview panel dedicated to showing Cerebras API usage metrics
 */
class CodeLynxUsagePanel {
    constructor(context) {
        this.context = context;
        this._panel = null;
        this.handlers = new CodeLynxHandlers(context);
    }

    /**
     * Creates a new panel or shows an existing one
     */
    createOrShow() {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (this._panel) {
            this._panel.reveal(columnToShowIn);
            return;
        }

        // Otherwise, create a new panel
        this._panel = vscode.window.createWebviewPanel(
            'codelynxUsage',
            'CodeLynx - API Usage Statistics',
            columnToShowIn || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set the webview's initial html content
        this._panel.webview.html = this._getWebviewContent();
        
        // Set up message handling
        this._setupMessageHandling();
        
        // Clean up resources when the panel is closed
        this._panel.onDidDispose(
            () => {
                this._panel = null;
            },
            null,
            this.context.subscriptions
        );
        
        // Update the usage data immediately
        this._refreshUsageData();
    }

    /**
     * Sets up message handling between the webview and the extension
     */
    _setupMessageHandling() {
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'refreshData':
                        await this._refreshUsageData();
                        break;
                    case 'resetDailyStats':
                        if (this.handlers.resetDailyStats) {
                            await this.handlers.resetDailyStats();
                            await this._refreshUsageData();
                        }
                        break;
                    case 'exportStats':
                        this._exportStats();
                        break;
                    case 'getConfiguration':
                        this._sendConfiguration();
                        break;
                }
            },
            null,
            this.context.subscriptions
        );
    }

    /**
     * Retrieves and sends updated usage statistics to the webview
     */
    async _refreshUsageData() {
        try {
            if (!this._panel) return;
            
            // Get usage stats from handlers
            if (this.handlers.getUsageStats) {
                const usageStats = this.handlers.getUsageStats();
                
                // Get configuration for daily limit
                const config = vscode.workspace.getConfiguration('codelynx');
                const apiDailyLimit = config.get('apiDailyLimit', 100);
                
                // Post the stats to the webview
                this._panel.webview.postMessage({
                    command: 'usageStats',
                    stats: usageStats,
                    config: {
                        apiDailyLimit
                    }
                });
            } else {
                this._panel.webview.postMessage({
                    command: 'error',
                    message: 'Usage statistics tracking is not available in this version'
                });
            }
        } catch (error) {
            console.error('Error refreshing usage data:', error);
            
            // Notify the webview of the error
            if (this._panel) {
                this._panel.webview.postMessage({
                    command: 'error',
                    message: `Error fetching usage data: ${error.message}`
                });
            }
        }
    }
    
    /**
     * Sends configuration information to the webview
     */
    async _sendConfiguration() {
        try {
            if (!this._panel) return;
            
            const config = vscode.workspace.getConfiguration('codelynx');
            const apiDailyLimit = config.get('apiDailyLimit', 100);
            
            this._panel.webview.postMessage({
                command: 'configuration',
                config: {
                    apiDailyLimit
                }
            });
        } catch (error) {
            console.error('Error sending configuration:', error);
        }
    }
    
    /**
     * Exports current statistics as CSV or JSON
     */
    async _exportStats() {
        try {
            if (!this.handlers.getUsageStats) {
                vscode.window.showErrorMessage('Usage statistics tracking is not available');
                return;
            }
            
            const stats = this.handlers.getUsageStats();
            
            // Create formatted JSON string
            const jsonData = JSON.stringify(stats, null, 2);
            
            // Ask user where to save the file
            const savePath = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'codelynx-usage.json')),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                title: 'Export CodeLynx API Usage Statistics'
            });
            
            if (savePath) {
                // Write the file
                const writeData = Buffer.from(jsonData, 'utf8');
                await vscode.workspace.fs.writeFile(savePath, writeData);
                
                vscode.window.showInformationMessage(`Statistics exported to ${savePath.fsPath}`);
            }
        } catch (error) {
            console.error('Error exporting stats:', error);
            vscode.window.showErrorMessage(`Failed to export statistics: ${error.message}`);
        }
    }

    /**
     * Get the CSS styles for the webview
     * @returns {string} CSS styles as a string
     */
    _getStyles() {
        return `
            /* CSS Variables for Theming */
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

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            body {
                background-color: var(--cerebras-bg);
                color: var(--cerebras-text);
                padding: 20px;
                line-height: 1.6;
            }
            
            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--cerebras-border);
            }
            
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: var(--cerebras-text);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .logo-icon {
                color: var(--cerebras-accent);
                font-size: 28px;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
            }
            
            .button {
                background-color: var(--cerebras-surface);
                color: var(--cerebras-text);
                border: 1px solid var(--cerebras-border);
                border-radius: var(--cerebras-radius);
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .button:hover {
                background-color: var(--cerebras-surface-hover);
                border-color: var(--cerebras-accent);
            }
            
            .button-accent {
                background-color: var(--cerebras-accent);
                color: white;
            }
            
            .button-accent:hover {
                background-color: var(--cerebras-accent-hover);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background-color: var(--cerebras-surface);
                border-radius: var(--cerebras-radius);
                padding: 20px;
                box-shadow: var(--cerebras-shadow);
            }
            
            .stat-title {
                font-size: 14px;
                color: var(--cerebras-text-secondary);
                margin-bottom: 5px;
            }
            
            .stat-value {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .stat-subtitle {
                font-size: 13px;
                color: var(--cerebras-text-secondary);
            }
            
            .progress-bar {
                height: 6px;
                background-color: var(--cerebras-border);
                border-radius: 3px;
                margin-top: 10px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background-color: var(--cerebras-accent);
                transition: width 0.5s ease;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: 600;
                margin: 30px 0 15px 0;
                color: var(--cerebras-text);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .section-icon {
                color: var(--cerebras-accent);
            }
            
            .chart-container {
                background-color: var(--cerebras-surface);
                border-radius: var(--cerebras-radius);
                padding: 20px;
                margin-bottom: 30px;
                box-shadow: var(--cerebras-shadow);
                height: 300px;
            }
            
            .models-table {
                width: 100%;
                border-collapse: collapse;
                background-color: var(--cerebras-surface);
                border-radius: var(--cerebras-radius);
                overflow: hidden;
                box-shadow: var(--cerebras-shadow);
            }
            
            .models-table th,
            .models-table td {
                text-align: left;
                padding: 12px 20px;
                border-bottom: 1px solid var(--cerebras-border);
            }
            
            .models-table th {
                background-color: rgba(0, 128, 128, 0.1);
                font-weight: 600;
                color: var(--cerebras-accent);
            }
            
            .models-table tr:last-child td {
                border-bottom: none;
            }
            
            .model-bar {
                height: 8px;
                background-color: var(--cerebras-border);
                border-radius: 4px;
                width: 100%;
                max-width: 200px;
                overflow: hidden;
            }
            
            .model-bar-fill {
                height: 100%;
                background-color: var(--cerebras-accent);
            }
            
            .notification {
                padding: 15px;
                border-radius: var(--cerebras-radius);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification.error {
                background-color: rgba(255, 68, 68, 0.15);
                border-left: 4px solid var(--cerebras-error);
            }
            
            .notification.warning {
                background-color: rgba(255, 184, 0, 0.15);
                border-left: 4px solid var(--cerebras-warning);
            }
            
            .notification-icon {
                font-size: 20px;
            }
            
            .notification.error .notification-icon {
                color: var(--cerebras-error);
            }
            
            .notification.warning .notification-icon {
                color: var(--cerebras-warning);
            }
            
            .tokens-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .loading {
                text-align: center;
                padding: 20px;
                color: var(--cerebras-text-secondary);
            }
        `;
    }

    /**
     * Generates the HTML content for the webview panel
     */
    _getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeLynx - API Usage Statistics</title>
    <style>
        ${this._getStyles()}
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <span class="logo-icon">📊</span> CodeLynx API Usage Statistics
        </div>
        <div class="action-buttons">
            <button class="button" id="refreshBtn">
                <span>🔄</span> Refresh
            </button>
            <button class="button" id="resetBtn">
                <span>🔁</span> Reset Daily Stats
            </button>
            <button class="button" id="exportBtn">
                <span>📥</span> Export Data
            </button>
        </div>
    </div>
    
    <div id="errorContainer"></div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-title">TOTAL REQUESTS</div>
            <div class="stat-value" id="totalRequests">--</div>
            <div class="stat-subtitle">Since installation</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">DAILY REQUESTS</div>
            <div class="stat-value" id="dailyRequests">--</div>
            <div class="stat-subtitle">Out of <span id="dailyLimit">--</span> daily limit</div>
            <div class="progress-bar">
                <div class="progress-fill" id="dailyProgress" style="width: 0%;"></div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-title">TOTAL TOKENS</div>
            <div class="stat-value" id="totalTokens">--</div>
            <div class="stat-subtitle">Used across all requests</div>
        </div>
    </div>
    
    <h2 class="section-title">
        <span class="section-icon">🔤</span> Token Usage Breakdown
    </h2>
    <div class="tokens-section">
        <div class="stat-card">
            <div class="stat-title">PROMPT TOKENS</div>
            <div class="stat-value" id="promptTokens">--</div>
            <div class="stat-subtitle">Input tokens sent to API</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">COMPLETION TOKENS</div>
            <div class="stat-value" id="completionTokens">--</div>
            <div class="stat-subtitle">Output tokens received</div>
        </div>
    </div>
    
    <h2 class="section-title">
        <span class="section-icon">🤖</span> Model Usage Distribution
    </h2>
    <div class="chart-container">
        <table class="models-table" id="modelsTable">
            <thead>
                <tr>
                    <th>Model</th>
                    <th>Requests</th>
                    <th>Percentage</th>
                    <th>Distribution</th>
                </tr>
            </thead>
            <tbody id="modelsTableBody">
                <tr>
                    <td colspan="4" class="loading">Loading model usage data...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            let dailyLimit = 100; // Default, will be updated
            
            // Elements
            const totalRequestsEl = document.getElementById('totalRequests');
            const dailyRequestsEl = document.getElementById('dailyRequests');
            const dailyLimitEl = document.getElementById('dailyLimit');
            const dailyProgressEl = document.getElementById('dailyProgress');
            const totalTokensEl = document.getElementById('totalTokens');
            const promptTokensEl = document.getElementById('promptTokens');
            const completionTokensEl = document.getElementById('completionTokens');
            const modelsTableBodyEl = document.getElementById('modelsTableBody');
            const errorContainerEl = document.getElementById('errorContainer');
            
            // Buttons
            document.getElementById('refreshBtn').addEventListener('click', () => {
                refreshData();
            });
            
            document.getElementById('resetBtn').addEventListener('click', () => {
                resetDailyStats();
            });
            
            document.getElementById('exportBtn').addEventListener('click', () => {
                exportStats();
            });
            
            // Message handler from extension
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'usageStats':
                        updateStats(message);
                        break;
                    case 'error':
                        showError(message.message);
                        break;
                    case 'configuration':
                        if (message.config) {
                            if (message.config.apiDailyLimit) {
                                dailyLimit = message.config.apiDailyLimit;
                                dailyLimitEl.textContent = dailyLimit.toLocaleString();
                            }
                        }
                        break;
                }
            });
            
            // Functions
            function refreshData() {
                vscode.postMessage({
                    command: 'refreshData'
                });
            }
            
            function resetDailyStats() {
                if (confirm('Are you sure you want to reset the daily statistics? This will set the daily counter back to zero.')) {
                    vscode.postMessage({
                        command: 'resetDailyStats'
                    });
                }
            }
            
            function exportStats() {
                vscode.postMessage({
                    command: 'exportStats'
                });
            }
            
            function showError(message) {
                errorContainerEl.innerHTML = 
                    '<div class="notification error">' +
                        '<span class="notification-icon">⚠️</span>' +
                        '<div>' + message + '</div>' +
                    '</div>';
            }
            
            function updateStats(message) {
                const stats = message.stats;
                if (!stats) {
                    showError('No usage statistics available');
                    return;
                }
                
                // Update configuration if provided
                if (message.config) {
                    if (message.config.apiDailyLimit) {
                        dailyLimit = message.config.apiDailyLimit;
                    }
                }
                
                // Clear any errors
                errorContainerEl.innerHTML = '';
                
                // Update request counts
                totalRequestsEl.textContent = (stats.totalRequests || 0).toLocaleString();
                dailyRequestsEl.textContent = (stats.dailyRequests || 0).toLocaleString();
                
                // Update daily limit
                dailyLimitEl.textContent = dailyLimit.toLocaleString();
                const dailyPercentage = Math.min(100, ((stats.dailyRequests || 0) / dailyLimit) * 100);
                dailyProgressEl.style.width = \`\${dailyPercentage}%\`;
                
                // Change progress bar color based on usage
                if (dailyPercentage > 90) {
                    dailyProgressEl.style.backgroundColor = 'var(--cerebras-error)';
                } else if (dailyPercentage > 70) {
                    dailyProgressEl.style.backgroundColor = 'var(--cerebras-warning)';
                } else {
                    dailyProgressEl.style.backgroundColor = 'var(--cerebras-accent)';
                }
                
                // Show warning if approaching limit
                if (dailyPercentage > 90 && !document.querySelector('.notification.warning')) {
                    errorContainerEl.innerHTML = 
                        '<div class="notification warning">' +
                            '<span class="notification-icon">⚠️</span>' +
                            '<div>You are approaching your daily API request limit. Consider adjusting your limit in settings if needed.</div>' +
                        '</div>';
                }
                
                // Update token stats
                if (stats.tokens) {
                    totalTokensEl.textContent = (stats.tokens.total || 0).toLocaleString();
                    promptTokensEl.textContent = (stats.tokens.prompt || 0).toLocaleString();
                    completionTokensEl.textContent = (stats.tokens.completion || 0).toLocaleString();
                } else {
                    totalTokensEl.textContent = '0';
                    promptTokensEl.textContent = '0';
                    completionTokensEl.textContent = '0';
                }
                
                // Update models table
                updateModelsTable(stats.models || {}, stats.totalRequests || 0);
            }
            
            function updateModelsTable(models, totalRequests) {
                // Clear table
                modelsTableBodyEl.innerHTML = '';
                
                // If no models data
                if (!models || Object.keys(models).length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="4">No model usage data available yet</td>';
                    modelsTableBodyEl.appendChild(row);
                    return;
                }
                
                // Sort models by usage (descending)
                const sortedModels = Object.entries(models)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => {
                        const percentage = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : 0;
                        return { model, count, percentage };
                    });
                
                // Add rows
                sortedModels.forEach(item => {
                    const row = document.createElement('tr');
                    
                    // Create model name cell
                    const modelCell = document.createElement('td');
                    modelCell.textContent = item.model;
                    row.appendChild(modelCell);
                    
                    // Create count cell
                    const countCell = document.createElement('td');
                    countCell.textContent = item.count.toLocaleString();
                    row.appendChild(countCell);
                    
                    // Create percentage cell
                    const percentCell = document.createElement('td');
                    percentCell.textContent = item.percentage + '%';
                    row.appendChild(percentCell);
                    
                    // Create bar cell
                    const barCell = document.createElement('td');
                    const barContainer = document.createElement('div');
                    barContainer.className = 'model-bar';
                    const barFill = document.createElement('div');
                    barFill.className = 'model-bar-fill';
                    barFill.style.width = item.percentage + '%';
                    barContainer.appendChild(barFill);
                    barCell.appendChild(barContainer);
                    row.appendChild(barCell);
                    
                    modelsTableBodyEl.appendChild(row);
                });
            }
            
            // Get configuration
            function getConfiguration() {
                vscode.postMessage({
                    command: 'getConfiguration'
                });
            }
            
            // Initialize
            refreshData();
            
            // Default daily limit is 100, extension will update this
            dailyLimitEl.textContent = dailyLimit.toLocaleString();
        })();
    </script>
</body>
</html>`;
    }
}

module.exports = CodeLynxUsagePanel;