import React from 'react';
import type { QueueItem } from '../types';
import { vscode } from '../types';

interface Props {
  items: QueueItem[];
}

export function ArchiveList({ items }: Props) {
  return (
    <div className="archive-list">
      {items.map(item => (
        <div key={item.id} className="archive-item">
          <div className="archive-item-content">
            <span className="archive-item-text" title={item.content}>
              {item.content}
            </span>
          </div>
          <div className="archive-item-meta">
            <span className="archive-item-time">
              {item.archivedAt ? `Archived ${formatTime(item.archivedAt)}` : formatTime(item.createdAt)}
            </span>
            {item.useCount > 0 && (
              <span className="archive-item-count">×{item.useCount}</span>
            )}
          </div>
          <div className="archive-item-actions">
            <button
              className="btn-icon"
              title="Restore to queue"
              onClick={() => vscode.postMessage({ type: 'restoreItem', id: item.id })}
            >
              ↩
            </button>
            <button
              className="btn-icon btn-danger"
              title="Delete permanently"
              onClick={() => vscode.postMessage({ type: 'deleteItem', id: item.id })}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${min}`;
}
