import React, { useEffect, useState, useMemo } from 'react';
import type { QueueItem, ExtToWebviewMessage, TargetInfo, SortMode } from './types';
import { vscode } from './types';
import { AddInstruction } from './components/AddInstruction';
import { QueueList } from './components/QueueList';
import './styles/main.css';

export function App() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [project, setProject] = useState('');
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [activeTarget, setActiveTarget] = useState('clipboard');
  const [sortMode, setSortMode] = useState<SortMode>('order');

  useEffect(() => {
    const handler = (event: MessageEvent<ExtToWebviewMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'updateQueue':
          setItems(msg.items);
          break;
        case 'updateProject':
          setProject(msg.project);
          break;
        case 'updateTargets':
          setTargets(msg.targets);
          setActiveTarget(msg.activeId);
          break;
      }
    };

    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handler);
  }, []);

  const sortedItems = useMemo(() => {
    if (sortMode === 'frequency') {
      return [...items].sort((a, b) => b.useCount - a.useCount);
    }
    return items;
  }, [items, sortMode]);

  const hasCompleted = items.some(i => i.status === 'completed');
  const hasPending = items.some(i => i.status === 'pending');

  return (
    <div className="app">
      <div className="header">
        <span className="project-name" title={project}>{project}</span>
      </div>

      <AddInstruction />

      {/* Toolbar: sort + target */}
      <div className="toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Sort:</span>
          <button
            className={`btn-chip ${sortMode === 'order' ? 'active' : ''}`}
            onClick={() => setSortMode('order')}
          >
            Manual
          </button>
          <button
            className={`btn-chip ${sortMode === 'frequency' ? 'active' : ''}`}
            onClick={() => setSortMode('frequency')}
          >
            Freq
          </button>
        </div>
        {targets.length > 0 && (
          <div className="toolbar-group">
            <span className="toolbar-label">To:</span>
            <select
              className="target-select"
              value={activeTarget}
              onChange={e => {
                setActiveTarget(e.target.value);
                vscode.postMessage({ type: 'setTarget', targetId: e.target.value });
              }}
            >
              {targets.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <QueueList items={sortedItems} />

      <div className="actions">
        {hasPending && (
          <button
            className="btn btn-primary"
            onClick={() => vscode.postMessage({ type: 'executeAll' })}
          >
            Execute All
          </button>
        )}
        {hasCompleted && (
          <button
            className="btn btn-secondary"
            onClick={() => vscode.postMessage({ type: 'clearCompleted' })}
          >
            Clear Completed
          </button>
        )}
      </div>
    </div>
  );
}
