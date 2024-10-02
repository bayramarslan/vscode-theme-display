import * as vscode from "vscode";

let statusBarItem: vscode.StatusBarItem | undefined;
let currentTheme: string = "";
const statusBarIcon: string = "$(flame)";

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
  updateStatusBarText();

  statusBarItem.tooltip = tooltip;
  statusBarItem.command = "workbench.action.selectTheme";
  statusBarItem.show();

  const randomThemeLink = vscode.commands.registerCommand(
    "extension.randomTheme",
    randomTheme
  );

  context.subscriptions.push(randomThemeLink, statusBarItem);

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
}

function getCurrentTheme(): string {
  const config = vscode.workspace.getConfiguration();
  const autoDetect = config.get<boolean>("window.autoDetectColorScheme");
  const themeKind = vscode.window.activeColorTheme.kind;

  if (autoDetect) {
    return getPreferredTheme(config, themeKind);
  }

  return config.get<string>("workbench.colorTheme") || "Default Dark+";
}

function getPreferredTheme(
  config: vscode.WorkspaceConfiguration,
  themeKind: vscode.ColorThemeKind
): string {
  if (themeKind === vscode.ColorThemeKind.Dark) {
    return (
      config.get<string>("workbench.preferredDarkColorTheme") || "Default Dark+"
    );
  } else if (themeKind === vscode.ColorThemeKind.Light) {
    return (
      config.get<string>("workbench.preferredLightColorTheme") ||
      "Default Light+"
    );
  }
  return config.get<string>("workbench.colorTheme") || "Default Dark+";
}

function updateStatusBarText() {
  if (statusBarItem) {
    statusBarItem.text = `${statusBarIcon} ${currentTheme}`;
  }
}

function updateStatusBar() {
  currentTheme = getCurrentTheme();
  updateStatusBarText();
}

function randomTheme() {
  const allThemes = getAllThemes();
  if (allThemes.length === 0) {
    vscode.window.showErrorMessage("No themes available.");
    return;
  }

  const config = vscode.workspace.getConfiguration();
  const autoDetect = config.get<boolean>("window.autoDetectColorScheme");
  const themeKind = vscode.window.activeColorTheme.kind;

  if (autoDetect) {
    const filteredThemes = filterThemesByKind(allThemes, themeKind);
    const selectedTheme = getRandomElement(
      filteredThemes.length > 0 ? filteredThemes : allThemes
    );

    try {
      if (themeKind === vscode.ColorThemeKind.Dark) {
        config.update("workbench.preferredDarkColorTheme", selectedTheme, true);
      } else if (themeKind === vscode.ColorThemeKind.Light) {
        config.update(
          "workbench.preferredLightColorTheme",
          selectedTheme,
          true
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error updating theme: ${error}`);
    }

    currentTheme = selectedTheme;
  } else {
    const randomTheme = getRandomElement(allThemes);
    try {
      config.update("workbench.colorTheme", randomTheme, true).then(() => {
        currentTheme = randomTheme;
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Error updating theme: ${error}`);
    }
  }

  updateStatusBarText();
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

export function deactivate() {
  statusBarItem?.dispose();
}
