import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "theme-status" is now active!');

	let disposable = vscode.commands.registerCommand('theme-status.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from theme-status!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
