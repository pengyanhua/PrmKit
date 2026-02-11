# PrmKit — AI Prompt Toolkit for Developers

Manage, queue, and execute AI prompts across different coding assistants (Claude Code, Copilot Chat, Cursor, etc.)

## Features

### 📋 Prompt Queue Management
- Add, edit, delete, and reorder prompts in a visual queue
- Track execution status (pending, running, completed, skipped)
- Record usage count and timestamps for each prompt

### 🚀 Quick Capture
- `Ctrl+Shift+Q` (or `Cmd+Shift+Q` on Mac) — Quick capture prompt input
- Right-click menu "Send to PrmKit" — Send selected text to queue
- Multi-line input support with automatic splitting

### 🎯 Template Variables
Prompts support context-aware variables:
- `{file}` — Current file relative path
- `{filename}` — Current file name
- `{selection}` — Selected text in editor
- `{language}` — Current file language ID
- `{workspace}` — Workspace name
- `{line}` — Current line number

Example: `Review {file} and fix the error on line {line}`

### 🎛 Multi-Target Dispatch
Execute prompts to different destinations:
- **Clipboard** — Copy to clipboard (universal fallback)
- **Terminal** — Send to active terminal
- **Copilot Chat** — (Coming soon)
- **Cursor AI** — (Coming soon)

Configure default target in settings: `prmkit.defaultTarget`

### 📦 Import/Export
- Export queue as JSON for backup or sharing
- Import prompts from JSON files
- Lightweight team knowledge sharing without server setup

### 🔄 Multi-Window Safe
- Automatic file watching and merge on conflicts
- Atomic writes prevent data corruption
- Works across multiple VS Code windows on same project

## Usage

1. Click the PrmKit icon in the Activity Bar
2. Type a prompt in the input box and press Enter
3. Manage your queue: reorder, edit (double-click), or execute
4. Use `Ctrl+Shift+Q` for quick capture anytime

## Data Storage

Prompts are stored locally in `.prmkit/queue.json` at project root.

## Roadmap

- **P0 (MVP)** — Queue management + execution (✅ current)
- **P1** — Interaction history + search
- **P2** — Knowledge base (favorites, tags, templates)
- **P3** — Team sharing + analytics + MCP integration

## License

MIT
