import React, { useState, useRef, useCallback } from 'react';
import { vscode } from '../types';

export function AddInstruction() {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Keep the whole text as ONE item — never split on line breaks,
    // so multi-paragraph prompts stay intact.
    vscode.postMessage({ type: 'addItem', content: trimmed });

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
        placeholder="Type or paste a prompt... (Shift+Enter for new line)"
        rows={5}
        className="input"
      />
      <button className="btn btn-add" onClick={handleSubmit} disabled={!value.trim()}>
        + Add
      </button>
    </div>
  );
}
