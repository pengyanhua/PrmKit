import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class TerminalTarget implements DispatchTarget {
  readonly id = 'terminal';
  readonly label = 'Terminal';

  async send(text: string): Promise<void> {
    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      throw new Error('No active terminal');
    }
    terminal.show();
    terminal.sendText(text, true);
  }

  isAvailable(): boolean {
    return vscode.window.terminals.length > 0;
  }
}
