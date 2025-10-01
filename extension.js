const vscode = require("vscode");
const CodeLynxDashboard = require("./src/core/dashboard");

let dashboard;

function activate(context) {
    console.log("CodeLynx is now active!");
    dashboard = new CodeLynxDashboard(context);

    let chatCommand = vscode.commands.registerCommand("codelynx.openChat", () => {
        dashboard.createOrShow();
    });

    context.subscriptions.push(chatCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
