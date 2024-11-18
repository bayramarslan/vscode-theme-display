import * as vscode from "vscode";

let statusBarItem: vscode.StatusBarItem | undefined;
let currentTheme: string = "";
let systemTheme: string = "";
const statusBarIcon: string = "$(flame)";
let themeCheckerPanel: vscode.WebviewPanel | undefined;
let defaultThemeName = "Default";

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    Number.MIN_SAFE_INTEGER
  );

  const tooltip = new vscode.MarkdownString(
    `Click to change theme [I'm Feeling Lucky](command:extension.randomTheme)`
  );

  tooltip.isTrusted = true;
  statusBarItem.tooltip = tooltip;
  statusBarItem.command = "workbench.action.selectTheme";

  currentTheme = getCurrentTheme();

  createThemeCheckerPanel(context);

  const randomThemeLink = vscode.commands.registerCommand(
    "extension.randomTheme",
    randomTheme
  );

  vscode.window.onDidChangeActiveColorTheme(
    updateStatusBar,
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeConfiguration(
    updateStatusBar,
    null,
    context.subscriptions
  );

  context.subscriptions.push(randomThemeLink, statusBarItem);

  updateStatusBar();
  statusBarItem.show();
}

function getCurrentTheme(): string {
  const config = vscode.workspace.getConfiguration();
  const autoDetect = config.get<boolean>("window.autoDetectColorScheme");

  if (autoDetect) {
    return getPreferredTheme(config, systemTheme);
  }

  return config.get<string>("workbench.colorTheme") || defaultThemeName;
}

function getPreferredTheme(
  config: vscode.WorkspaceConfiguration,
  systemTheme: string
): string {
  if (systemTheme === "dark") {
    return (
      config.get<string>("workbench.preferredDarkColorTheme") ||
      defaultThemeName
    );
  } else if (systemTheme === "light") {
    return (
      config.get<string>("workbench.preferredLightColorTheme") ||
      defaultThemeName
    );
  }
  return config.get<string>("workbench.colorTheme") || defaultThemeName;
}

function updateStatusBar(): void {
  currentTheme = getCurrentTheme();
  if (statusBarItem) {
    statusBarItem.text = `${statusBarIcon} ${currentTheme}`;
  }
}

async function randomTheme() {
  const allThemes = getAllThemes();
  if (allThemes.length === 0) {
    vscode.window.showErrorMessage("No themes available.");
    return;
  }

  const config = vscode.workspace.getConfiguration();
  const autoDetect = config.get<boolean>("window.autoDetectColorScheme");

  let selectedTheme: string;

  if (autoDetect) {
    const themeKind = vscode.window.activeColorTheme.kind;
    const filteredThemes = filterThemesByKind(allThemes, themeKind);
    selectedTheme = getRandomElement(
      filteredThemes.length > 0 ? filteredThemes : allThemes
    );

    try {
      if (themeKind === vscode.ColorThemeKind.Dark) {
        await config.update(
          "workbench.preferredDarkColorTheme",
          selectedTheme,
          true
        );
      } else if (themeKind === vscode.ColorThemeKind.Light) {
        await config.update(
          "workbench.preferredLightColorTheme",
          selectedTheme,
          true
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error updating theme: ${error}`);
    }
  } else {
    selectedTheme = getRandomElement(allThemes);
    try {
      await config.update("workbench.colorTheme", selectedTheme, true);
    } catch (error) {
      vscode.window.showErrorMessage(`Error updating theme: ${error}`);
    }
  }

  currentTheme = selectedTheme;
  updateStatusBar();
}

function getAllThemes(): string[] {
  return vscode.extensions.all
    .flatMap((extension) => {
      const themes = extension.packageJSON?.contributes?.themes;
      if (!themes) {
        return [];
      }
      return themes.map(
        (theme: { id?: string; label?: string }) => theme.id || theme.label
      );
    })
    .filter(Boolean);
}

function filterThemesByKind(
  themes: string[],
  themeKind: vscode.ColorThemeKind
): string[] {
  return themes.filter((theme) => {
    if (themeKind === vscode.ColorThemeKind.Dark) {
      return theme.toLowerCase().includes("dark");
    } else if (themeKind === vscode.ColorThemeKind.Light) {
      return theme.toLowerCase().includes("light");
    }
    return true;
  });
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function createThemeCheckerPanel(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();
  const autoDetect = config.get<boolean>("window.autoDetectColorScheme");

  if (!autoDetect) {
    if (themeCheckerPanel) {
      themeCheckerPanel.dispose();
      themeCheckerPanel = undefined;
    }
    return;
  }

  if (themeCheckerPanel) {
    return;
  }

  themeCheckerPanel = vscode.window.createWebviewPanel(
    "themeChecker",
    "Theme Checker",
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  themeCheckerPanel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <body>
      <script>
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ command: 'themeCheck', isDark });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
          vscode.postMessage({ command: 'themeCheck', isDark: event.matches });
        });
      </script>
    </body>
    </html>
  `;

  themeCheckerPanel.webview.onDidReceiveMessage(
    (message) => {
      if (message.command === "themeCheck") {
        systemTheme = message.isDark ? "dark" : "light";
        themeCheckerPanel?.dispose();
        themeCheckerPanel = undefined;
        updateStatusBar();
      }
    },
    undefined,
    context.subscriptions
  );
}

export function deactivate() {
  statusBarItem?.dispose();
}
