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

    if (text.includes('\n')) {
      // Wrap in bracketed paste so the shell / CLI treats the whole block as a
      // single pasted input instead of running each line as its own command.
      terminal.sendText(`\x1b[200~${text}\x1b[201~`, false);
      terminal.sendText('', true);
    } else {
      terminal.sendText(text, true);
    }
  }

  isAvailable(): boolean {
    return vscode.window.terminals.length > 0;
  }
}
