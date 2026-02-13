import * as vscode from 'vscode';
import { QueueViewProvider } from './providers/QueueViewProvider';
import { QueueService } from './services/QueueService';
import { StorageService } from './services/StorageService';
import { DispatchService } from './services/DispatchService';
import { TemplateService } from './services/TemplateService';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return;
  }

  const globalDir = context.globalStorageUri.fsPath;
  const storageService = new StorageService(globalDir, workspaceFolder.uri.fsPath);
  const queueService = new QueueService(storageService, workspaceFolder.name);
  const templateService = new TemplateService();
  const dispatchService = new DispatchService();

  const provider = new QueueViewProvider(
    context.extensionUri,
    queueService,
    dispatchService,
    templateService,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('prmkit.queueView', provider),
  );

  // Quick Capture: Ctrl+Shift+Q
  context.subscriptions.push(
    vscode.commands.registerCommand('prmkit.quickCapture', async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter a prompt to add to the queue',
        placeHolder: 'Type your prompt here...',
      });
      if (input) {
        const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          queueService.addItem(line, 'quick-capture');
        }
        provider.refresh();
      }
    }),
  );

  // Send to PrmKit (context menu)
  context.subscriptions.push(
    vscode.commands.registerCommand('prmkit.sendToQueue', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        if (selection) {
          const lines = selection.split('\n').map(l => l.trim()).filter(Boolean);
          for (const line of lines) {
            queueService.addItem(line, 'context-menu');
          }
          provider.refresh();
          vscode.window.showInformationMessage(
            `Added ${lines.length} prompt(s) to PrmKit queue`,
          );
        }
      }
    }),
  );

  // Export Queue
  context.subscriptions.push(
    vscode.commands.registerCommand('prmkit.exportQueue', async () => {
      const data = queueService.getData();
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('prmkit-queue.json'),
        filters: { JSON: ['json'] },
      });
      if (uri) {
        const content = JSON.stringify(data, null, 2);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
        vscode.window.showInformationMessage('Queue exported successfully');
      }
    }),
  );

  // Import Queue
  context.subscriptions.push(
    vscode.commands.registerCommand('prmkit.importQueue', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { JSON: ['json'] },
      });
      if (uris && uris[0]) {
        const content = await vscode.workspace.fs.readFile(uris[0]);
        const text = Buffer.from(content).toString('utf-8');
        const imported = JSON.parse(text);
        queueService.importItems(imported.queue || []);
        provider.refresh();
        vscode.window.showInformationMessage('Queue imported successfully');
      }
    }),
  );

  // Watch for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newFolder = vscode.workspace.workspaceFolders?.[0];
      if (newFolder) {
        storageService.setProjectPath(newFolder.uri.fsPath);
        queueService.setProject(newFolder.name);
        provider.refresh();
      }
    }),
  );
}

export function deactivate() {}
