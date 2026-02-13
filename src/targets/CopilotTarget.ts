import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class CopilotTarget implements DispatchTarget {
  readonly id = 'copilot-chat';
  readonly label = 'Copilot Chat';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }

  isAvailable(): boolean {
    return (
      vscode.extensions.getExtension('github.copilot-chat') !== undefined ||
      vscode.extensions.getExtension('github.copilot') !== undefined
    );
  }
}
