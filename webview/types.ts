export type QueueItemStatus = 'pending' | 'running' | 'completed' | 'skipped';
export type QueueItemSource = 'manual' | 'quick-capture' | 'context-menu' | 'import';

export interface QueueItem {
  id: string;
  content: string;
  isTemplate: boolean;
  status: QueueItemStatus;
  source: QueueItemSource;
  createdAt: string;
  lastUsedAt: string | null;
  useCount: number;
  completedAt: string | null;
  skipReason: string | null;
  order: number;
}

export interface TargetInfo {
  id: string;
  label: string;
}

export type SortMode = 'order' | 'frequency';

export type ExtToWebviewMessage =
  | { type: 'updateQueue'; items: QueueItem[] }
  | { type: 'updateProject'; project: string }
  | { type: 'updateTargets'; targets: TargetInfo[]; activeId: string };

export type WebviewToExtMessage =
  | { type: 'addItem'; content: string; source?: QueueItemSource }
  | { type: 'addItems'; contents: string[]; source?: QueueItemSource }
  | { type: 'deleteItem'; id: string }
  | { type: 'updateItem'; id: string; content: string }
  | { type: 'updateStatus'; id: string; status: QueueItemStatus }
  | { type: 'reorderItems'; ids: string[] }
  | { type: 'executeItem'; id: string }
  | { type: 'executeAll' }
  | { type: 'clearCompleted' }
  | { type: 'setTarget'; targetId: string }
  | { type: 'ready' };

declare function acquireVsCodeApi(): {
  postMessage(msg: WebviewToExtMessage): void;
  getState(): any;
  setState(state: any): void;
};

export const vscode = acquireVsCodeApi();
