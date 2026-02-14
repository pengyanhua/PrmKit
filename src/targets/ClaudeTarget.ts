import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class ClaudeTarget implements DispatchTarget {
  readonly id = 'claude-code';
  readonly label = 'Claude Code';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    // Try to focus Claude Code's chat view
    try {
      await vscode.commands.executeCommand('claude.focusInput');
    } catch {
      // Fallback: try alternative command names
      try {
        await vscode.commands.executeCommand('claude.openChat');
      } catch {
        vscode.window.showInformationMessage(
          'Claude Code chat opened — paste the prompt from clipboard'
        );
        return;
      }
    }
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }

  isAvailable(): boolean {
    return (
      vscode.extensions.getExtension('saoudrizwan.claude-dev') !== undefined ||
      vscode.extensions.getExtension('anthropics.claude-code') !== undefined
    );
  }
}
