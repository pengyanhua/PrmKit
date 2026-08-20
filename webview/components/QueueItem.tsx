import React, { useState, useRef, useCallback } from 'react';
import type { QueueItem } from '../types';
import { vscode } from '../types';

interface Props {
  item: QueueItem;
  index: number;
  total: number;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const REPEAT_CYCLE = [1, 2, 3, 5];

function nextRepeat(current: number): number {
  const idx = REPEAT_CYCLE.indexOf(current);
  return REPEAT_CYCLE[(idx + 1) % REPEAT_CYCLE.length];
}

export function QueueItemRow({ item, index, total, isDragging, onDragStart, onDrop, onMoveUp, onMoveDown }: Props) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editValue, setEditValue] = useState(item.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Long / multi-paragraph prompts are clamped in CSS and get a toggle.
  const isLong = item.content.includes('\n') || item.content.length > 200;

  const handleEdit = useCallback(() => {
    setEditValue(item.content);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [item.content]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.content) {
      vscode.postMessage({ type: 'updateItem', id: item.id, content: trimmed });
    }
    setEditing(false);
  }, [editValue, item.id, item.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }, [handleSave]);

  const handleCycleRepeat = useCallback(() => {
    const next = nextRepeat(item.repeatCount ?? 1);
    vscode.postMessage({ type: 'setRepeatCount', id: item.id, count: next });
  }, [item.id, item.repeatCount]);

  const statusIcon = {
    pending: '○',
    running: '◎',
    completed: '✓',
    skipped: '—',
  }[item.status];

  const statusClass = `status-${item.status}`;
  const repeatCount = item.repeatCount ?? 1;

  const formattedTime = item.lastUsedAt
    ? formatTime(item.lastUsedAt)
    : formatTime(item.createdAt);

  return (
    <div
      className={`queue-item ${statusClass} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(item.id)}
    >
      <div className="queue-item-header">
        <span className="queue-item-status">{statusIcon}</span>
        <span className="queue-item-index">{index + 1}.</span>

        {editing ? (
          <textarea
            ref={inputRef}
            className="queue-item-edit"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            rows={editValue.includes('\n') ? 8 : 2}
          />
        ) : (
          <span
            className={`queue-item-content ${expanded ? 'expanded' : ''}`}
            onDoubleClick={handleEdit}
            title="Double-click to edit"
          >
            {item.content}
          </span>
        )}
      </div>

      <div className="queue-item-meta">
        {isLong && !editing && (
          <button
            className="queue-item-toggle"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <span className="queue-item-time">{formattedTime}</span>
        {item.useCount > 0 && (
          <span className="queue-item-count">×{item.useCount}</span>
        )}
        {item.isTemplate && <span className="queue-item-badge">tpl</span>}
      </div>

      <div className="queue-item-actions">
        <button
          className={`btn-icon btn-fav ${item.favorited ? 'active' : ''}`}
          title={item.favorited ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => vscode.postMessage({ type: 'toggleFavorite', id: item.id })}
        >
          {item.favorited ? '★' : '☆'}
        </button>
        {item.status === 'pending' && (
          <>
            <button
              className="btn-icon"
              title="Move up"
              onClick={() => onMoveUp(item.id)}
              disabled={index === 0}
            >
              ▲
            </button>
            <button
              className="btn-icon"
              title="Move down"
              onClick={() => onMoveDown(item.id)}
              disabled={index === total - 1}
            >
              ▼
            </button>
            <button
              className="btn-icon"
              title="Skip"
              onClick={() => vscode.postMessage({ type: 'updateStatus', id: item.id, status: 'skipped' })}
            >
              ⏭
            </button>
          </>
        )}

        {item.status !== 'running' && (
          <>
            <button
              className={`btn-icon btn-repeat ${repeatCount > 1 ? 'active' : ''}`}
              title={`Repeat × ${repeatCount} (click to cycle: 1→2→3→5)`}
              onClick={handleCycleRepeat}
            >
              {repeatCount > 1 ? `↺${repeatCount}` : '↺'}
            </button>
            <button
              className="btn-icon"
              title={item.status === 'pending' ? 'Execute' : 'Re-run'}
              onClick={() => vscode.postMessage({ type: 'executeItem', id: item.id })}
            >
              ▶
            </button>
          </>
        )}

        <button
          className="btn-icon btn-archive"
          title="Archive"
          onClick={() => vscode.postMessage({ type: 'archiveItem', id: item.id })}
        >
          📦
        </button>
        <button
          className="btn-icon btn-danger"
          title="Delete"
          onClick={() => vscode.postMessage({ type: 'deleteItem', id: item.id })}
        >
          ✕
        </button>
      </div>
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
