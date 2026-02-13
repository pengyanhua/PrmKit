import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { QueueData } from '../types';

const QUEUE_FILE = 'queue.json';

/**
 * Data stored at: {globalStoragePath}/{projectHash}/queue.json
 * Each project identified by hash of its absolute path — no files in project dir.
 */
export class StorageService {
  private globalDir: string;
  private projectPath: string;
  private watcher?: fs.FSWatcher;
  private _onChange?: () => void;

  constructor(globalDir: string, projectPath: string) {
    this.globalDir = globalDir;
    this.projectPath = projectPath;
  }

  setProjectPath(projectPath: string) {
    this.projectPath = projectPath;
    this._stopWatch();
    this._startWatch();
  }

  onDidChange(cb: () => void) {
    this._onChange = cb;
    this._startWatch();
  }

  private get projectHash(): string {
    return crypto.createHash('md5').update(this.projectPath).digest('hex').slice(0, 12);
  }

  private get dirPath(): string {
    return path.join(this.globalDir, this.projectHash);
  }

  private get filePath(): string {
    return path.join(this.dirPath, QUEUE_FILE);
  }

  read(): QueueData | null {
    try {
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as QueueData;
    } catch {
      return null;
    }
  }

  write(data: QueueData): void {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    // Atomic write: write to temp file then rename
    const tmpPath = path.join(this.dirPath, `queue.tmp.${Date.now()}.json`);
    const content = JSON.stringify(data, null, 2) + '\n';

    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  private _startWatch() {
    if (this.watcher) return;
    if (!fs.existsSync(this.dirPath)) return;

    try {
      this.watcher = fs.watch(this.dirPath, (eventType, filename) => {
        if (filename === QUEUE_FILE && this._onChange) {
          this._onChange();
        }
      });
    } catch {
      // Silently ignore watch errors
    }
  }

  private _stopWatch() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }

  dispose() {
    this._stopWatch();
  }
}
