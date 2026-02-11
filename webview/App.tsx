import React, { useEffect, useState } from 'react';
import type { QueueItem, ExtToWebviewMessage } from './types';
import { vscode } from './types';
import { AddInstruction } from './components/AddInstruction';
import { QueueList } from './components/QueueList';
import './styles/main.css';

export function App() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [project, setProject] = useState('');

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
      }
    };

    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handler);
  }, []);

  const hasCompleted = items.some(i => i.status === 'completed');
  const hasPending = items.some(i => i.status === 'pending');

  return (
    <div className="app">
      <div className="header">
        <span className="project-name" title={project}>{project}</span>
      </div>

      <AddInstruction />

      <QueueList items={items} />

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
