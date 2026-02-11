import * as vscode from 'vscode';
import { QueueService } from '../services/QueueService';
import { DispatchService } from '../services/DispatchService';
import { TemplateService } from '../services/TemplateService';
import type { WebviewToExtMessage } from '../types';

export class QueueViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly queueService: QueueService,
    private readonly dispatchService: DispatchService,
    private readonly templateService: TemplateService,
  ) {
    this.queueService.onDidChange(() => this.refresh());
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
      ],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewToExtMessage) => {
      this._handleMessage(msg);
    });
  }

  refresh() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateQueue',
        items: this.queueService.getItems(),
      });
      this._view.webview.postMessage({
        type: 'updateProject',
        project: this.queueService.getProject(),
      });
    }
  }

  private async _handleMessage(msg: WebviewToExtMessage) {
    switch (msg.type) {
      case 'ready':
        this.refresh();
        break;
      case 'addItem':
        this.queueService.addItem(msg.content, msg.source || 'manual');
        break;
      case 'addItems':
        for (const content of msg.contents) {
          this.queueService.addItem(content, msg.source || 'manual');
        }
        break;
      case 'deleteItem':
        this.queueService.deleteItem(msg.id);
        break;
      case 'updateItem':
        this.queueService.updateItem(msg.id, msg.content);
        break;
      case 'updateStatus':
        this.queueService.updateStatus(msg.id, msg.status);
        break;
      case 'reorderItems':
        this.queueService.reorder(msg.ids);
        break;
      case 'executeItem':
        await this._executeItem(msg.id);
        break;
      case 'executeAll':
        await this._executeAll();
        break;
      case 'clearCompleted':
        this.queueService.clearCompleted();
        break;
    }
  }

  private async _executeItem(id: string) {
    const item = this.queueService.getItem(id);
    if (!item) return;

    const resolved = this.templateService.resolve(item.content);
    this.queueService.updateStatus(id, 'running');

    try {
      await this.dispatchService.send(resolved);
      this.queueService.markUsed(id);
      this.queueService.updateStatus(id, 'completed');
    } catch {
      this.queueService.updateStatus(id, 'pending');
      vscode.window.showErrorMessage('Failed to dispatch prompt');
    }
  }

  private async _executeAll() {
    const pending = this.queueService.getItems().filter(i => i.status === 'pending');
    for (const item of pending) {
      await this._executeItem(item.id);
    }
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'index.js'),
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>PrmKit</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
