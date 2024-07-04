import * as vscode from "vscode";

let statusBarItem: vscode.StatusBarItem | undefined;
let currentTheme: string = "";
let statusBarIcon: string = "$(flame)";

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    Number.MIN_SAFE_INTEGER
  );

  const tooltip = new vscode.MarkdownString(
    `Click to change theme [I'm Feeling Lucky](command:extension.randomTheme)`
  );
  
  tooltip.isTrusted = true;

  currentTheme = getCurrentTheme();
  statusBarItem.text = `${statusBarIcon} ${currentTheme}`;
  statusBarItem.tooltip = tooltip;
  statusBarItem.command = "workbench.action.selectTheme";

  const randomThemeLink = vscode.commands.registerCommand(
    "extension.randomTheme",
    randomTheme
  );

  context.subscriptions.push(randomThemeLink, statusBarItem);

  statusBarItem.show();

  vscode.workspace.onDidChangeConfiguration(updateStatusBarText);
}

function getCurrentTheme(): string {
  return vscode.workspace
    .getConfiguration("workbench")
    .get<string>("colorTheme")!;
}

function updateStatusBarText() {
  statusBarItem!.text = `${statusBarIcon} ${currentTheme}`;
}

function randomTheme() {
  const allThemes = getAllThemes();
  if (allThemes.length === 0) {
    return;
  }

  const randomTheme = getRandomElement(allThemes);

  vscode.workspace
    .getConfiguration()
    .update("workbench.colorTheme", randomTheme, true);

  currentTheme = randomTheme;
  updateStatusBarText();
}

function getAllThemes(): string[] {
  return vscode.extensions.all
    .flatMap(
      (extension) =>
        extension.packageJSON?.contributes?.themes?.map(
          (theme: { id: any; label: any }) => theme.id || theme.label
        ) || []
    )
    .filter(Boolean);
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function deactivate() {
  statusBarItem?.dispose();
}
