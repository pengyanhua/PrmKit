import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class ClaudeTarget implements DispatchTarget {
  readonly id = 'claude-code';
  readonly label = 'Claude Code';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    // Open sidebar and focus input
    try {
      await vscode.commands.executeCommand('claude-vscode.sidebar.open');
      await new Promise(resolve => setTimeout(resolve, 500));
      await vscode.commands.executeCommand('claude-vscode.focus');
    } catch {
      // Sidebar may already be open, just focus
      try {
        await vscode.commands.executeCommand('claude-vscode.focus');
      } catch {
        // ignore
      }
    }
    vscode.window.showInformationMessage(
      'Prompt copied — press Ctrl+V to paste into Claude Code'
    );
  }

  isAvailable(): boolean {
    return vscode.extensions.getExtension('anthropic.claude-code') !== undefined;
  }
}
