import React, { useState, useCallback } from 'react';
import type { QueueItem as QueueItemType } from '../types';
import { vscode } from '../types';
import { QueueItemRow } from './QueueItem';

interface Props {
  items: QueueItemType[];
}

export function QueueList({ items }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDrop = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }

    const ids = items.map(i => i.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);

    vscode.postMessage({ type: 'reorderItems', ids });
    setDragId(null);
  }, [dragId, items]);

  if (items.length === 0) {
    return <div className="empty">No prompts in queue. Add one above.</div>;
  }

  return (
    <div className="queue-list">
      {items.map((item, index) => (
        <QueueItemRow
          key={item.id}
          item={item}
          index={index}
          isDragging={dragId === item.id}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
