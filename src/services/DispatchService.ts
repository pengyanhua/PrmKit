import * as vscode from 'vscode';
import type { DispatchTarget } from '../targets/DispatchTarget';
import { ClipboardTarget } from '../targets/ClipboardTarget';
import { TerminalTarget } from '../targets/TerminalTarget';
import { CopilotTarget } from '../targets/CopilotTarget';
import { CursorTarget } from '../targets/CursorTarget';

export class DispatchService {
  private targets: Map<string, DispatchTarget> = new Map();
  private overrideTargetId?: string;

  constructor() {
    const clipboard = new ClipboardTarget();
    const terminal = new TerminalTarget();
    const copilot = new CopilotTarget();
    const cursor = new CursorTarget();

    this.targets.set(clipboard.id, clipboard);
    this.targets.set(terminal.id, terminal);
    this.targets.set(copilot.id, copilot);
    this.targets.set(cursor.id, cursor);
  }

  setActiveTarget(id: string) {
    this.overrideTargetId = id;
  }

  getActiveTargetId(): string {
    return this.overrideTargetId || this._getDefaultTargetId();
  }

  getAllTargets(): { id: string; label: string }[] {
    return Array.from(this.targets.values()).map(t => ({ id: t.id, label: t.label }));
  }

  async send(text: string, targetId?: string): Promise<void> {
    const id = targetId || this.overrideTargetId || this._getDefaultTargetId();
    const target = this.targets.get(id);

    if (!target) {
      throw new Error(`Unknown dispatch target: ${id}`);
    }

    if (!target.isAvailable()) {
      // Fallback to clipboard
      const clipboard = this.targets.get('clipboard');
      if (clipboard) {
        await clipboard.send(text);
        vscode.window.showInformationMessage(
          `Target "${target.label}" not available, copied to clipboard instead`,
        );
        return;
      }
      throw new Error(`Target "${target.label}" is not available`);
    }

    await target.send(text);
  }

  getAvailableTargets(): DispatchTarget[] {
    return Array.from(this.targets.values()).filter(t => t.isAvailable());
  }

  private _getDefaultTargetId(): string {
    const config = vscode.workspace.getConfiguration('prmkit');
    return config.get<string>('defaultTarget', 'clipboard');
  }
}
