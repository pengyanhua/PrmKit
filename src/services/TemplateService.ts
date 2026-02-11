import * as vscode from 'vscode';
import * as path from 'path';

export class TemplateService {
  resolve(template: string): string {
    return template.replace(/\{(\w+)\}/g, (_match, varName: string) => {
      const value = this._getVariable(varName);
      return value !== undefined ? value : `{${varName}}`;
    });
  }

  private _getVariable(name: string): string | undefined {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    switch (name) {
      case 'file':
        if (editor && workspaceFolder) {
          return path.relative(workspaceFolder.uri.fsPath, editor.document.uri.fsPath);
        }
        return editor?.document.uri.fsPath;

      case 'filename':
        if (editor) {
          return path.basename(editor.document.uri.fsPath);
        }
        return undefined;

      case 'selection':
        if (editor && !editor.selection.isEmpty) {
          return editor.document.getText(editor.selection);
        }
        return undefined;

      case 'language':
        return editor?.document.languageId;

      case 'workspace':
        return workspaceFolder?.name;

      case 'line':
        if (editor) {
          return String(editor.selection.active.line + 1);
        }
        return undefined;

      default:
        return undefined;
    }
  }
}
