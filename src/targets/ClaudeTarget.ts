import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class ClaudeTarget implements DispatchTarget {
  readonly id = 'claude-code';
  readonly label = 'Claude Code';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    // Open sidebar and focus input, then paste
    await vscode.commands.executeCommand('claude-vscode.sidebar.open');
    await new Promise(resolve => setTimeout(resolve, 500));
    await vscode.commands.executeCommand('claude-vscode.focus');
    await new Promise(resolve => setTimeout(resolve, 200));
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }

  isAvailable(): boolean {
    return vscode.extensions.getExtension('anthropic.claude-code') !== undefined;
  }
}
