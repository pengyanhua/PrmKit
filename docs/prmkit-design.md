# PrmKit —— AI Prompt Toolkit for Developers

## 背景与痛点

在使用 AI 编程助手过程中，存在以下问题：

1. **重复指令无法复用**：常用的 prompt 每次都要重新输入
2. **指令排队不便**：等待 AI 输出时想好了多条后续指令，没有好的记录方式
3. **执行状态不可追踪**：哪些指令已执行、哪些待执行，缺乏标记
4. **交互经验无法沉淀**：好用的 prompt 和模式散落在聊天记录中，难以复用
5. **团队无法共享**：个人积累的经验无法传递给团队
6. **AI 建议难以暂存**：AI 写完代码后给出的后续建议（如"建议加测试 / 处理边界 / 优化性能"），没有快速记录的入口，切走就忘

## 产品定位

VS Code 插件，管理多个项目的 AI 交互指令，记录交互历史，沉淀为个人或公司级知识资产。

## 功能架构

```
┌─ VS Code Sidebar ──────────────────────────────────┐
│                                                      │
│  📂 项目切换: [my-project ▾]                            │
│                                                      │
│  ── 指令队列 ──────────────────────────              │
│  ☐ 1. 重构登录接口          02-10 14:30  ×3         │
│       [▲] [▼] [▶执行] [✕]                           │
│  ☐ 2. 给 /api/orders 加分页  02-10 15:00  ×1         │
│       [▲] [▼] [▶执行] [✕]                           │
│  ☐ 3. 跑全量测试             02-10 15:10  ×1         │
│       [▲] [▼] [▶执行] [✕]                           │
│  ✅ 4. 修复 CSS 布局问题      02-10 10:00  ×2         │
│  [+ 添加指令]  [▶ 全部执行]  [🗑 清除已完成]         │
│                                                      │
│  ── 交互历史 ──────────────────────────              │
│  📅 2026-02-10                                       │
│   → "重构 UserService 错误处理"                      │
│     结果: ✅ 修改 3 个文件   [⭐收藏] [📋复用]       │
│   → "添加订单分页接口"                               │
│     结果: ✅ 新增 2 个文件   [⭐收藏] [📋复用]       │
│                                                      │
│  ── 知识库 ──────────────────────────                │
│  🏷 [项目模板]  [调试技巧]  [代码规范]               │
│  ⭐ "Go 项目统一错误处理的标准 prompt"                │
│  ⭐ "React 组件性能优化检查清单"                      │
│  [🔍 搜索]  [📤 导出]  [👥 共享到团队]               │
└──────────────────────────────────────────────────────┘
```

## 三层数据模型

```
个人知识库 (~/.prmkit/)
  ├── 跨项目通用的 prompt 模板、技巧
  └── 全局配置

项目知识库 ({project}/.prmkit/)
  ├── queue.json          ← 当前指令队列
  ├── history.json        ← 交互历史
  └── knowledge.json      ← 项目级沉淀

团队知识库 (可选，远端同步)
  ├── 公司级 prompt 模板
  ├── 最佳实践库
  └── 通过 Git/API 同步
```

## 核心工作流

### 流程一：指令管理

```
在侧边栏输入指令 → 一键/批量发送到 AI 对话 → 自动追踪状态 → 标记完成
                                                        ↓
                                                  记录到交互历史
```

### 流程二：知识沉淀

```
交互历史中发现好用的 prompt → 点"收藏" → 进入知识库 → 打标签分类 → 可复用/可共享
```

### 流程三：团队共享

```
个人知识库 → 导出/推送 → 团队知识库 → 其他成员可搜索、引用
```

## 技术方案

| 层面 | 技术选型 | 说明 |
|------|----------|------|
| 插件 UI | VS Code WebView (Sidebar) | 用 React + Tailwind 渲染侧边栏面板 |
| 数据存储 | 本地 JSON 文件 | 轻量，可 git 跟踪，无需数据库 |
| 指令分发 | 多目标适配层（见下方） | 通过统一接口发送指令到不同 AI 入口 |
| MCP 集成 | 内置 MCP Server | 让 AI 主动读取/更新队列状态 |
| 团队同步 | Git 或 HTTP API（可选） | 后期扩展，MVP 先不做 |

### 指令分发 — 多目标适配

指令"执行"的本质是把 prompt 文本送达用户当前使用的 AI 入口。不同环境入口不同，采用 **Target 适配器** 模式统一处理：

| 目标 | 适用场景 | 技术手段 |
|------|----------|----------|
| **剪贴板（默认）** | 通用兜底，适用于所有环境 | `vscode.env.clipboard.writeText()` 后提示用户粘贴 |
| **VS Code 终端** | Claude Code CLI 等终端类工具 | `Terminal.sendText()` 发送到指定终端 |
| **Copilot Chat** | VS Code 内置 Copilot | `vscode.commands.executeCommand('workbench.action.chat.open')` + 输入 |
| **Cursor AI** | Cursor 编辑器内置 AI | Cursor 的 `aipane.send` 命令或终端方式 |

**设计要点：**

- 用户在设置中选择默认目标，也可在执行时临时切换
- 抽象 `DispatchTarget` 接口，每种目标实现一个适配器
- MVP 先做「剪贴板」+「终端」两种，其余按需扩展
- 批量执行时统一走同一个目标通道

```typescript
interface DispatchTarget {
  readonly id: string;        // "clipboard" | "terminal" | "copilot-chat" | "cursor"
  readonly label: string;     // 显示名称
  send(text: string): Promise<void>;
  isAvailable(): boolean;     // 检测当前环境是否可用
}
```

### 多窗口文件冲突处理

同一项目可能被多个 VS Code 窗口打开，多个实例同时读写 `queue.json` 会导致数据丢失。

**策略：读时加载 + 写时合并**

- 每次写入前先重新读取文件，与内存状态做合并（以最新时间戳为准）
- 使用 `fs.watch` 监听文件变化，外部修改时自动刷新 UI
- 写入时使用原子写（先写临时文件再 rename），避免写到一半崩溃导致文件损坏

> MVP 阶段采用这个轻量方案即可，无需引入文件锁。

## 分阶段实施

| 阶段 | 内容 | 价值 |
|------|------|------|
| **P0 - MVP** | 指令队列管理（增删改排序 + 状态追踪） | 解决核心痛点 |
| **P1** | 交互历史自动记录 + 搜索 | 可追溯、可复盘 |
| **P2** | 知识库（收藏、标签、模板化） | 个人效率沉淀 |
| **P3** | 团队共享 + 统计分析 | 组织级资产 |

## P0 MVP 详细设计

### 功能清单

- 侧边栏面板展示指令队列
- 添加指令（支持多行输入、一次添加多条）
- 拖拽排序 / 按钮上移下移
- 指令状态：待执行 → 执行中 → 已完成 / 已跳过
- 一键复制指令到剪贴板
- 单条执行（发送到选定的 AI 入口）
- 批量顺序执行
- 执行目标可切换：剪贴板 / 终端 / Copilot Chat / Cursor AI
- 清除已完成指令
- 多项目切换（自动识别当前工作区）
- 记录每条指令的下达时间（创建 / 最近执行）
- 记录每条指令的使用次数，支持按使用频次排序
- 编辑已有指令：点击指令内容可进入编辑状态，修改后保存
- **速记（Quick Capture）**：
  - 快捷键 `Ctrl+Shift+Q`：弹出轻量输入框，快速录入一条指令到队列末尾
  - 右键菜单「Send to PrmKit」：选中终端 / 编辑器中的文本，一键发送到队列
  - 支持多行粘贴自动拆分：粘贴多行文本时按行拆成多条指令
- **模板变量**：指令中可使用变量占位符，执行时自动填充当前上下文
  - `{file}` — 当前活动文件的相对路径
  - `{filename}` — 当前文件名（不含路径）
  - `{selection}` — 编辑器当前选中的文本
  - `{language}` — 当前文件的语言标识（如 typescript、python）
  - `{workspace}` — 当前工作区根目录名
  - 示例：`Review {file} and fix the error on line {line}`
- **导入导出**：支持将队列 / 知识库导出为 JSON 文件，也可从文件导入，方便跨机器迁移或轻量分享

### 数据结构

```json
{
  "version": 1,
  "project": "my-project",
  "queue": [
    {
      "id": "uuid-1",
      "content": "Review {file} and fix the error",
      "isTemplate": true,
      "status": "pending",
      "source": "manual",
      "createdAt": "2026-02-10T10:00:00Z",
      "lastUsedAt": "2026-02-10T14:30:00Z",
      "useCount": 3,
      "completedAt": null,
      "skipReason": null,
      "order": 0
    }
  ]
}
```

### 项目结构

```
prmkit/
├── package.json              ← 插件声明、命令注册
├── tsconfig.json
├── src/
│   ├── extension.ts          ← 入口，注册侧边栏、命令
│   ├── providers/
│   │   └── QueueViewProvider.ts  ← WebView 侧边栏
│   ├── services/
│   │   ├── QueueService.ts   ← 队列 CRUD 逻辑
│   │   ├── StorageService.ts ← JSON 文件读写
│   │   ├── DispatchService.ts ← 指令分发（多目标适配）
│   │   └── TemplateService.ts ← 模板变量解析（{file} {selection} 等）
│   ├── targets/
│   │   ├── DispatchTarget.ts  ← 适配器接口定义
│   │   ├── ClipboardTarget.ts ← 剪贴板
│   │   ├── TerminalTarget.ts  ← VS Code 终端
│   │   ├── CopilotTarget.ts   ← Copilot Chat
│   │   └── CursorTarget.ts    ← Cursor AI
│   └── mcp/
│       └── McpServer.ts      ← MCP 集成（AI 直接操作队列）
├── webview/
│   ├── index.html
│   ├── App.tsx               ← React 主组件
│   ├── components/
│   │   ├── QueueList.tsx     ← 队列列表（含拖拽排序）
│   │   ├── QueueItem.tsx     ← 单条指令
│   │   └── AddInstruction.tsx← 添加指令输入框
│   └── styles/
│       └── main.css          ← Tailwind
└── resources/
    └── icon.svg              ← 侧边栏图标
```
