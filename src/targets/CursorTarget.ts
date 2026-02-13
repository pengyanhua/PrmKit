import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class CursorTarget implements DispatchTarget {
  readonly id = 'cursor';
  readonly label = 'Cursor AI';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    await vscode.commands.executeCommand('aipopup.action.modal.generate');
    await new Promise(resolve => setTimeout(resolve, 300));
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }

  isAvailable(): boolean {
    // Cursor is a fork of VS Code — detect via appName or the command palette
    const appName = vscode.env.appName.toLowerCase();
    return appName.includes('cursor');
  }
}
