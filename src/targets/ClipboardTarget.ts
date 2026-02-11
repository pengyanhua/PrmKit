import * as vscode from 'vscode';
import type { DispatchTarget } from './DispatchTarget';

export class ClipboardTarget implements DispatchTarget {
  readonly id = 'clipboard';
  readonly label = 'Clipboard';

  async send(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage('Prompt copied to clipboard');
  }

  isAvailable(): boolean {
    return true;
  }
}
