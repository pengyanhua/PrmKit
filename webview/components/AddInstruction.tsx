import React, { useState, useRef, useCallback } from 'react';
import { vscode } from '../types';

export function AddInstruction() {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 1) {
      vscode.postMessage({ type: 'addItem', content: lines[0] });
    } else {
      vscode.postMessage({ type: 'addItems', contents: lines });
    }

    setValue('');
    textareaRef.current?.focus();
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="add-instruction">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a prompt... (Shift+Enter for multi-line)"
        rows={2}
        className="input"
      />
      <button className="btn btn-add" onClick={handleSubmit} disabled={!value.trim()}>
        + Add
      </button>
    </div>
  );
}
