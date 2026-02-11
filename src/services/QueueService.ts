import { randomUUID } from 'crypto';
import type { QueueData, QueueItem, QueueItemSource, QueueItemStatus } from '../types';
import { StorageService } from './StorageService';

type ChangeListener = () => void;

export class QueueService {
  private data: QueueData;
  private listeners: ChangeListener[] = [];

  constructor(
    private readonly storage: StorageService,
    projectName: string,
  ) {
    this.data = this.storage.read() || {
      version: 1,
      project: projectName,
      queue: [],
    };

    this.storage.onDidChange(() => {
      const fresh = this.storage.read();
      if (fresh) {
        this.data = fresh;
        this._notify();
      }
    });
  }

  onDidChange(cb: ChangeListener) {
    this.listeners.push(cb);
  }

  getProject(): string {
    return this.data.project;
  }

  setProject(name: string) {
    this.data.project = name;
    this._reload();
  }

  getData(): QueueData {
    return this.data;
  }

  getItems(): QueueItem[] {
    return [...this.data.queue].sort((a, b) => a.order - b.order);
  }

  getItem(id: string): QueueItem | undefined {
    return this.data.queue.find(item => item.id === id);
  }

  addItem(content: string, source: QueueItemSource = 'manual'): QueueItem {
    const maxOrder = this.data.queue.reduce((max, i) => Math.max(max, i.order), -1);
    const hasVariables = /\{(file|filename|selection|language|workspace|line)\}/.test(content);

    const item: QueueItem = {
      id: randomUUID(),
      content,
      isTemplate: hasVariables,
      status: 'pending',
      source,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      useCount: 0,
      completedAt: null,
      skipReason: null,
      order: maxOrder + 1,
    };

    this.data.queue.push(item);
    this._save();
    return item;
  }

  deleteItem(id: string) {
    this.data.queue = this.data.queue.filter(i => i.id !== id);
    this._save();
  }

  updateItem(id: string, content: string) {
    const item = this.data.queue.find(i => i.id === id);
    if (item) {
      item.content = content;
      item.isTemplate = /\{(file|filename|selection|language|workspace|line)\}/.test(content);
      this._save();
    }
  }

  updateStatus(id: string, status: QueueItemStatus) {
    const item = this.data.queue.find(i => i.id === id);
    if (item) {
      item.status = status;
      if (status === 'completed') {
        item.completedAt = new Date().toISOString();
      }
      this._save();
    }
  }

  markUsed(id: string) {
    const item = this.data.queue.find(i => i.id === id);
    if (item) {
      item.useCount += 1;
      item.lastUsedAt = new Date().toISOString();
      this._save();
    }
  }

  reorder(ids: string[]) {
    ids.forEach((id, index) => {
      const item = this.data.queue.find(i => i.id === id);
      if (item) {
        item.order = index;
      }
    });
    this._save();
  }

  clearCompleted() {
    this.data.queue = this.data.queue.filter(i => i.status !== 'completed');
    this._save();
  }

  importItems(items: QueueItem[]) {
    const maxOrder = this.data.queue.reduce((max, i) => Math.max(max, i.order), -1);
    items.forEach((item, index) => {
      const newItem: QueueItem = {
        ...item,
        id: randomUUID(),
        status: 'pending',
        source: 'import',
        order: maxOrder + 1 + index,
        completedAt: null,
      };
      this.data.queue.push(newItem);
    });
    this._save();
  }

  private _reload() {
    const fresh = this.storage.read();
    if (fresh) {
      this.data = fresh;
    } else {
      this.data.queue = [];
    }
    this._notify();
  }

  private _save() {
    this.storage.write(this.data);
    this._notify();
  }

  private _notify() {
    for (const cb of this.listeners) {
      cb();
    }
  }
}
