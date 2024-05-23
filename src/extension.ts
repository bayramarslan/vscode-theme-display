import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		Number.MIN_SAFE_INTEGER
	);

	statusBarItem.text = "${paintcan} NaN";
	statusBarItem.tooltip = "Click to change theme";
	statusBarItem.command = "workbench.action.selectTheme";

	context.subscriptions.push(statusBarItem);
	statusBarItem.show();

	updateStatusBar();

	vscode.workspace.onDidChangeConfiguration(() => {
		updateStatusBar();
	})

}


function updateStatusBar() {
	if (!statusBarItem) return false;
	statusBarItem.text = "$(paintcan) " + getCurrentTheme();
}

function getCurrentTheme(): string {
	return vscode.workspace.getConfiguration('workbench').get('colorTheme', 'Unknown');
}

export function deactivate() {
	if (statusBarItem) {
		statusBarItem.dispose();
	}
}
