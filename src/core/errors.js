class CodeLynxErrors {
    
    static CATEGORIES = {
        API: 'api',           
        WORKSPACE: 'workspace', 
        ANALYSIS: 'analysis',    
        CONFIG: 'config',      
        GENERAL: 'general'     
    };
    
    /**
     * Format user-friendly error message with troubleshooting tips
     * @param {string} message - Error message
     * @param {string} category - Error category
     * @returns {object} Formatted error object
     */
    static format(message, category = CodeLynxErrors.CATEGORIES.GENERAL) {
        const errorId = `TLYNX-${Date.now().toString().substring(6)}`;
        
        let troubleshooting = '';
        
        switch (category) {
            case CodeLynxErrors.CATEGORIES.API:
                troubleshooting = [
                    'Check your API key in VS Code settings',
                    'Verify your internet connection',
                    'Try regenerating your API key at inference.cerebras.ai',
                    'Check if the service is experiencing downtime'
                ].join('\n• ');
                break;
                
            case CodeLynxErrors.CATEGORIES.WORKSPACE:
                troubleshooting = [
                    'Open a valid project folder',
                    'Make sure you have read/write permissions',
                    'Check if the project structure is valid'
                ].join('\n• ');
                break;
                
            case CodeLynxErrors.CATEGORIES.ANALYSIS:
                troubleshooting = [
                    'Check if your project has required files (package.json, etc.)',
                    'Try opening the root folder of your project',
                    'Make sure your project follows standard conventions'
                ].join('\n• ');
                break;
                
            case CodeLynxErrors.CATEGORIES.DOCKER:
                troubleshooting = [
                    'Check if Docker is installed on your system',
                    'Make sure you have appropriate permissions',
                    'Verify Docker daemon is running'
                ].join('\n• ');
                break;
                
            case CodeLynxErrors.CATEGORIES.CONFIG:
                troubleshooting = [
                    'Reset your VS Code settings for TempLynx',
                    'Reinstall the extension if problems persist',
                    'Check environment variables'
                ].join('\n• ');
                break;
                
            default:
                troubleshooting = [
                    'Try restarting VS Code',
                    'Check the extension logs for more details',
                    'Make sure you\'re using the latest version'
                ].join('\n• ');
        }
        
        return {
            message,
            category,
            errorId,
            troubleshooting: '• ' + troubleshooting,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Format API error specifically for better troubleshooting
     * @param {Error} error - Original error object
     * @returns {object} Formatted API error
     */
    static formatApiError(error) {
        let message = 'API Error: ';
        
        if (error) {
            if ('response' in error && error.response && typeof error.response === 'object') {
            
                const response = error.response;
                const status = response['status'];
                const data = response['data'];

                switch (status) {
                    case 401:
                        message += 'Authentication failed. Please check your API key.';
                        break;
                    case 403:
                        message += 'API key does not have permission to access this resource.';
                        break;
                    case 404:
                        message += 'API endpoint not found. The API may have changed.';
                        break;
                    case 429:
                        message += 'Rate limit exceeded. Please try again later.';
                        break;
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        message += 'Server error. The AI service may be experiencing issues.';
                        break;
                    default:
                        message += `Request failed with status ${status}.`;
                }
                
                if (data && data.error && data.error.message) {
                    message += ` Details: ${data.error.message}`;
                }
            } else if ('request' in error && error.request && typeof error.request === 'object') {
                message += 'No response received from API server. Check your internet connection.';
            } else {
                message += error.message || 'Unknown error occurred while setting up the request.';
            }
        } else {
            message += 'Unknown error occurred.';
        }
        
        return this.format(message, CodeLynxErrors.CATEGORIES.API);
    }
}

module.exports = CodeLynxErrors;