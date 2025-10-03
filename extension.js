const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

// Import core components with better error handling
let CodeLynxDashboard, CodeLynxUsagePanel;
try {
  CodeLynxDashboard = require("./src/core/dashboard");
  CodeLynxUsagePanel = require("./src/core/usage");
} catch (error) {
  console.error("Failed to import core components:", error);
  // We'll handle this in the activate function
}

let dashboard;
let usagePanel;
let globalContext;

/**
 * Simple TreeDataProvider implementation for CodeLynx Explorer view
 */
class CodeLynxTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const chatItem = new vscode.TreeItem("Open AI Chat");
    chatItem.command = {
      command: "codelynx.openChat",
      title: "Open AI Chat",
    };
    chatItem.iconPath = new vscode.ThemeIcon("comment-discussion");

    const usageItem = new vscode.TreeItem("API Usage Statistics");
    usageItem.command = {
      command: "codelynx.showApiUsage",
      title: "Show API Usage Statistics",
    };
    usageItem.iconPath = new vscode.ThemeIcon("graph");

    return [chatItem, usageItem];
  }
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
  console.log("CodeLynx deactivated");
}

// Export activate and deactivate functions directly
// This avoids potential circular reference and activation issues
module.exports = {
  activate(context) {
    globalContext = context;
    try {
      console.log("CodeLynx is being activated...");

      // Initialize components with explicit error logging
      try {
        dashboard = new CodeLynxDashboard(context);
        usagePanel = new CodeLynxUsagePanel(context);
        console.log("CodeLynx components initialized successfully");
      } catch (error) {
        console.error("Error initializing CodeLynx components:", error);
        vscode.window.showErrorMessage(
          `CodeLynx initialization error: ${error.message}`
        );
      }

      // Register tree view for explorer
      const treeDataProvider = new CodeLynxTreeDataProvider();
      const treeView = vscode.window.createTreeView("codelynxExplorer", {
        treeDataProvider,
        showCollapseAll: false,
      });
      context.subscriptions.push(treeView);

      // Register commands
      let chatCommand = vscode.commands.registerCommand(
        "codelynx.openChat",
        () => {
          try {
            dashboard.createOrShow();
          } catch (error) {
            console.error("Error opening chat:", error);
            vscode.window.showErrorMessage(
              `Error opening chat: ${error.message}`
            );
          }
        }
      );

      let usageCommand = vscode.commands.registerCommand(
        "codelynx.showApiUsage",
        () => {
          try {
            if (!usagePanel) {
              console.log("Reinitializing usage panel");
              usagePanel = new CodeLynxUsagePanel(context);
            }
            usagePanel.createOrShow();
          } catch (error) {
            console.error("Error showing API usage panel:", error);
            vscode.window.showErrorMessage(
              `Error showing API usage: ${error.message}`
            );
          }
        }
      );

      // Add commands to subscriptions
      context.subscriptions.push(chatCommand);
      context.subscriptions.push(usageCommand);

      // Initialize configuration
      initializeConfiguration(context);

      // Show success notification
      vscode.window.setStatusBarMessage(
        "CodeLynx activated successfully",
        3000
      );
      console.log("CodeLynx activation completed successfully");
    } catch (error) {
      console.error("Critical error during CodeLynx activation:", error);
      vscode.window.showErrorMessage(
        `Critical error during CodeLynx activation: ${error.message}`
      );
    }
  },
  deactivate,
};
