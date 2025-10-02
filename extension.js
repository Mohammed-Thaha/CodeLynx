const vscode = require("vscode");
const CodeLynxDashboard = require("./src/core/dashboard");
const CodeLynxUsagePanel = require("./src/core/usage");

let dashboard;
let usagePanel;

/**
 * Activates the CodeLynx extension
 * @param {vscode.ExtensionContext} context - Extension context
 */
function activate(context) {
  console.log("CodeLynx is now active!");

  // Initialize components
  dashboard = new CodeLynxDashboard(context);
  usagePanel = new CodeLynxUsagePanel(context);

  // Register commands
  let chatCommand = vscode.commands.registerCommand("codelynx.openChat", () => {
    dashboard.createOrShow();
  });

  let usageCommand = vscode.commands.registerCommand(
    "codelynx.showApiUsage",
    () => {
      usagePanel.createOrShow();
    }
  );

  // Add commands to subscriptions
  context.subscriptions.push(chatCommand);
  context.subscriptions.push(usageCommand);

  // Initialize configuration
  initializeConfiguration(context);
}

/**
 * Initialize and validate configuration settings
 * @param {vscode.ExtensionContext} context - Extension context
 */
function initializeConfiguration(context) {
  // Validate API limit settings
  const config = vscode.workspace.getConfiguration("codelynx");
  const apiDailyLimit = config.get("apiDailyLimit");

  if (!apiDailyLimit || apiDailyLimit < 1) {
    config.update("apiDailyLimit", 100, vscode.ConfigurationTarget.Global);
  }

  // Register configuration change listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("codelynx")) {
        // Notify panels of configuration change if needed
        if (usagePanel && usagePanel._panel) {
          usagePanel._refreshUsageData();
        }
      }
    })
  );
}

/**
 * Deactivates the extension
 */
function deactivate() {
  // Clean up resources if needed
}

module.exports = { activate, deactivate };
