import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

// Known Windsurf Cascade command candidates (verify via Command Palette in Windsurf: Ctrl+Shift+P → "Cascade")
const CASCADE_COMMANDS = [
  'windsurf.cascade',
  'windsurf.openCascade',
  'windsurf.cascade.focus',
  'codeium.openCascade',
];

export class WindsurfTarget implements DispatchTarget {
  readonly id = 'windsurf';
  readonly label = 'Windsurf Cascade';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);

    // Try known Cascade commands until one succeeds
    let opened = false;
    for (const cmd of CASCADE_COMMANDS) {
      try {
        await vscode.commands.executeCommand(cmd);
        opened = true;
        break;
      } catch {
        // command not registered, try next
      }
    }

    if (!opened) {
      // Fallback: content is already in clipboard, user can paste manually
      vscode.window.showInformationMessage(
        'PrmKit: Could not open Cascade automatically. Content copied to clipboard — open Cascade (Ctrl+L) and paste.',
      );
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }

  isAvailable(): boolean {
    // Windsurf is a standalone IDE (VS Code fork) by Codeium
    const appName = vscode.env.appName.toLowerCase();
    return appName.includes('windsurf');
  }
}
