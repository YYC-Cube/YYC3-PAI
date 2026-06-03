/**
 * file: App.tsx
 * description: 应用根组件 · 提供全局布局、主题、国际化和状态管理
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-08
 * status: stable
 * tags: [app],[root],[react],[layout]
 *
 * copyright: YanYuCloudCube Team
 * license: MIT
 *
 * brief: 应用根组件，负责全局配置和布局
 *
 * details:
 * - 提供全局主题切换功能
 * - 集成国际化支持
 * - 管理全局状态（模型、主题、快捷键、设置）
 * - 实现面板拖拽和布局管理
 * - 提供错误边界和性能监控
 *
 * dependencies: React, Zustand, i18next
 * exports: App (default)
 * notes: 需要在 main.tsx 中作为根组件渲染
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/cyberpunk.css";
import { CyberToaster } from "./components/CyberToast";
import { CyberpunkBackground } from "./components/CyberpunkBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PanelSkeleton } from "./components/LoadingSkeleton";
import { MonacoPerformanceMonitor } from "./components/performance";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor";
import { I18nProvider, useI18n } from "./i18n/context";
import { PRELOAD_STRATEGIES, useAutoMonacoPreload } from "./services/monaco-preloader";
import { ModelStoreProvider, useModelStore } from "./store/model-store";
import { panelDnDActions } from "./store/panel-dnd-store";
import { SelfMediaStoreProvider, useSelfMediaStore } from "./store/self-media-store";
import { useSettingsStore } from "./store/settings-store";
import { useShortcutStore } from "./store/shortcut-store";
import { useThemeStore } from "./store/theme-store";

// ===== Eager imports — main views (critical rendering path) =====
import { FullscreenMode } from "./components/FullscreenMode";
import { ModelSettings } from "./components/ModelSettings";

// ===== React.lazy — code-split views & overlay panels (loaded on demand) =====
const IDEMode = lazy(() => import("./components/IDEMode").then(m => ({ default: m.IDEMode })));
const FloatingWidget = lazy(() => import("./components/FloatingWidget").then(m => ({ default: m.FloatingWidget })));
const CommandPalette = lazy(() => import("./components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const SettingsPanel = lazy(() => import("./components/SettingsPanel").then(m => ({ default: m.SettingsPanel })));
const NotificationCenter = lazy(() => import("./components/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const GlobalSearch = lazy(() => import("./components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
const PerformanceDashboard = lazy(() => import("./components/PerformanceDashboard").then(m => ({ default: m.PerformanceDashboard })));
const AIAssistantPanel = lazy(() => import("./components/AIAssistantPanel").then(m => ({ default: m.AIAssistantPanel })));
const CRDTCollabPanel = lazy(() => import("./components/CRDTCollabPanel").then(m => ({ default: m.CRDTCollabPanel })));
const IntelligentWorkflowPanel = lazy(() => import("./components/IntelligentWorkflowPanel").then(m => ({ default: m.IntelligentWorkflowPanel })));
const AgentWorkflowPanel = lazy(() => import("./components/AgentWorkflowPanel").then(m => ({ default: m.AgentWorkflowPanel })));

// P0: File Synchronization Panel (完整性优化 - Week 1)
const SyncPanel = lazy(() => import("./components/SyncPanel").then(m => ({ default: m.SyncPanel })));

// Phase 1: Image Generation Panel (自媒体创作引擎)
const ImageGenPanel = lazy(() => import("./components/ImageGenPanel").then(m => ({ default: m.ImageGenPanel })));

// Phase 1: Self-Media Rich Text Editor (自媒体创作引擎)
const SelfMediaEditor = lazy(() => import("./components/SelfMediaEditor").then(m => ({ default: m.SelfMediaEditor })));
const PublishQueue = lazy(() => import("./components/PublishQueue").then(m => ({ default: m.PublishQueue })));
const TrendingTopics = lazy(() => import("./components/TrendingTopics").then(m => ({ default: m.TrendingTopics })));

// Phase 2: AI Writing Assistant Panel (自媒体创作引擎)
const AIWritingPanel = lazy(() => import("./components/AIWritingPanel").then(m => ({ default: m.AIWritingPanel })));

// Phase 2: Material Manager (自媒体创作引擎)
const MaterialManager = lazy(() => import("./components/MaterialManager").then(m => ({ default: m.MaterialManager })));

// Phase 2: Content Preview (自媒体创作引擎)
const ContentPreview = lazy(() => import("./components/ContentPreview").then(m => ({ default: m.ContentPreview })));

// Phase 2: Content Template Panel (自媒体创作引擎)
const ContentTemplatePanel = lazy(() => import("./components/ContentTemplatePanel").then(m => ({ default: m.ContentTemplatePanel })));

// Local Model Infrastructure Dashboard
const LocalModelDashboard = lazy(() => import("./components/LocalModelDashboard").then(m => ({ default: m.LocalModelDashboard })));

// Smart Chat Page
const ChatPage = lazy(() => import("../components/Chat/ChatPage").then(m => ({ default: m.default })));

import type { PaletteCommand } from "./components/CommandPalette";
import { initRouter } from "./utils/model-router";

import {
  Activity, AlertTriangle,
  Bell,
  Bot,
  Brain,
  Clock,
  Code2,
  Cpu,
  Database,
  Eye,
  FileText,
  Flame,
  FolderPlus,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Keyboard,
  LayoutGrid,
  Monitor,
  Moon,
  Puzzle,
  Scissors,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  Users,
  Wifi, Zap
} from "lucide-react";

type AppMode = "fullscreen" | "widget" | "ide";

/** Read file content map from localStorage (written by IDEMode autoSave) */
function readFileContentMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem("yyc3_file_content_map");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch { /* ignore */ }
  return {};
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>("fullscreen");
  const { t, toggleLocale } = useI18n();
  const { tokens, isCyberpunk, toggleTheme, setTheme } = useThemeStore();
  const { openModelSettings } = useModelStore();
  const { shortcuts } = useShortcutStore();

  // Self-Media Store (cross-panel communication)
  const {
    setPanelActions,
    templateWritingTopic,
    pendingPreviewContent,
    setPendingPreviewContent,
    setPendingPreviewTitle,
    setPendingPreviewPlatform,
    setPendingAIWritingTopic,
    setPendingAIWritingMode,
    setPendingPublish,
    pendingPublishContent,
    pendingPublishTitle,
  } = useSelfMediaStore()

  // ===== Monaco Editor Ref for Performance Monitoring =====
  const monacoEditorRef = useRef<unknown>(null);

  // ===== Performance Monitoring (P0级功能) =====
  const settings = useSettingsStore();
  const performanceSettings = settings.performance;
  usePerformanceMonitor({
    enableWebVitals: performanceSettings.enabled && performanceSettings.enableWebVitals,
    enableSystemMonitoring: performanceSettings.enabled && performanceSettings.enableSystemMonitoring,
    systemMonitoringInterval: performanceSettings.sampleInterval,
    debug: performanceSettings.debugMode,
  });

  // ===== Monaco Editor 预加载 (P0优化 - Q2-01) =====
  // 策略: 应用启动3秒后延迟预加载，不阻塞首屏渲染
  useAutoMonacoPreload({
    enabled: true,
    priority: PRELOAD_STRATEGIES.APP_START.priority,
    delay: PRELOAD_STRATEGIES.APP_START.delay,
  });

  // Performance panel state
  const [performanceVisible, setPerformanceVisible] = useState(false);

  // WebGPU AI Assistant panel state
  const [aiAssistantVisible, setAIAssistantVisible] = useState(false);

  // CRDT Collaboration panel state
  const [crdtCollabVisible, setCRDTCollabVisible] = useState(false);

  // Intelligent Workflow panel state
  const [intelligentWorkflowVisible, setIntelligentWorkflowVisible] = useState(false);

  // AI Agent Workflow panel state
  const [agentWorkflowVisible, setAgentWorkflowVisible] = useState(false);

  // P0: File Synchronization Panel state (完整性优化 - Week 1)
  const [syncPanelVisible, setSyncPanelVisible] = useState(false);

  // Phase 1: Image Generation Panel state (自媒体创作引擎)
  const [imageGenVisible, setImageGenVisible] = useState(false);

  // Phase 1: Self-Media Editor state (自媒体创作引擎)
  const [selfMediaEditorVisible, setSelfMediaEditorVisible] = useState(false);
  const [publishQueueVisible, setPublishQueueVisible] = useState(false);
  const [trendingTopicsVisible, setTrendingTopicsVisible] = useState(false);

  // Local Model Infrastructure Dashboard state
  const [localModelDashVisible, setLocalModelDashVisible] = useState(false);

  // Phase 2: AI Writing Assistant Panel state (自媒体创作引擎)
  const [aiWritingVisible, setAIWritingVisible] = useState(false);

  // Phase 2: Material Manager state (自媒体创作引擎)
  const [materialManagerVisible, setMaterialManagerVisible] = useState(false);

  // Phase 2: Content Preview state (自媒体创作引擎)
  const [contentPreviewVisible, setContentPreviewVisible] = useState(false);

  // Phase 2: Content Template Panel state (自媒体创作引擎)
  const [contentTemplateVisible, setContentTemplateVisible] = useState(false);
  /** 智能聊天页面 */
  const [chatVisible, setChatVisible] = useState(false);

  // ===== Cross-Panel Communication (自媒体创作引擎全链路) =====
  // Inject panel actions into SelfMediaStore
  useEffect(() => {
    setPanelActions({
      openAIWriting: (_options?: { mode?: string; topic?: string }) => {
        if (_options?.topic) setPendingAIWritingTopic(_options.topic);
        if (_options?.mode) {
          // Validate mode
          const validModes = ['title', 'outline', 'seo', 'expand', 'summary', 'rewrite'];
          if (validModes.includes(_options.mode)) {
            setPendingAIWritingMode(_options.mode as any);
          }
        }
        setAIWritingVisible(true);
      },
      openMaterialManager: () => {
        setMaterialManagerVisible(true)
      },
      openContentPreview: (options?: { content?: string; title?: string; platform?: string }) => {
        if (options?.content) setPendingPreviewContent(options.content)
        if (options?.title) setPendingPreviewTitle(options.title)
        if (options?.platform) setPendingPreviewPlatform(options.platform)
        setContentPreviewVisible(true)
      },
      openEditor: () => {
        setSelfMediaEditorVisible(true)
      },
      openPublishQueue: (_options?: { content?: string; title?: string }) => {
        setPendingPublish(_options?.content ?? null, _options?.title ?? null)
        setPublishQueueVisible(true)
      },
      openTrendingTopics: () => {
        setTrendingTopicsVisible(true)
      },
    })
  }, [setPanelActions, setPendingPublish, setPendingPreviewContent, setPendingPreviewTitle, setPendingPreviewPlatform, setPendingAIWritingTopic, setPendingAIWritingMode])

  // Auto-open AI writing panel when template topic is set
  useEffect(() => {
    if (templateWritingTopic) {
      setAIWritingVisible(true)
    }
  }, [templateWritingTopic])

  // Auto-open content preview when pending content is set
  useEffect(() => {
    if (pendingPreviewContent) {
      setContentPreviewVisible(true)
    }
  }, [pendingPreviewContent])

  // Auto-open publish queue when pending publish content is set
  useEffect(() => {
    if (pendingPublishContent) {
      setPublishQueueVisible(true)
    }
  }, [pendingPublishContent])

  // ===== Shared Layout URL Detection (对齐 Guidelines: Layout Sharing) =====
  useEffect(() => {
    // Initialize the local model router on mount
    initRouter().catch(() => { })

    try {
      const hash = window.location.hash;
      if (hash.startsWith('#yyc3-layout=')) {
        const result = panelDnDActions.importFromShareURL(hash);
        if (result.success && result.layout) {
          // Clean hash — wrapped in try/catch for sandboxed iframe environments
          try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* sandboxed */ }
        }
      }
    } catch { /* ignore hash parsing errors in preview iframe */ }

    // 监听打开Performance面板的事件
    const handleOpenPanel = (e: CustomEvent) => {
      if (e.detail === 'performance') {
        setPerformanceVisible(true);
      }
    };
    window.addEventListener('yyc3:open-panel', handleOpenPanel as EventListener);
    return () => window.removeEventListener('yyc3:open-panel', handleOpenPanel as EventListener);
  }, []);

  // Panel states
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);

  // Shortcut cheat sheet
  const [cheatSheetVisible, setCheatSheetVisible] = useState(false);

  // Read file content map fresh each time search opens
  const [searchFileMap, setSearchFileMap] = useState<Record<string, string>>({});
  const openGlobalSearch = useCallback(() => {
    setSearchFileMap(readFileContentMap());
    setGlobalSearchVisible(true);
  }, []);

  // File select from search — switch to IDE and select the file
  const handleSearchSelectFile = useCallback((_fileName: string, _line?: number) => {
    setMode("ide");
    // The IDE will pick up the file from its fileContentMap (restored from localStorage)
  }, []);

  // ===== Command definitions =====
  const commands = useMemo<PaletteCommand[]>(() => [
    // Navigation
    {
      id: 'switch-fullscreen', labelKey: 'cmdSwitchFullscreen', categoryKey: 'catNavigation',
      icon: Monitor, shortcut: '',
      action: () => setMode('fullscreen'),
    },
    {
      id: 'switch-ide', labelKey: 'cmdSwitchIDE', categoryKey: 'catNavigation',
      icon: Code2, shortcut: '',
      action: () => setMode('ide'),
    },
    {
      id: 'switch-widget', labelKey: 'cmdSwitchWidget', categoryKey: 'catNavigation',
      icon: Sparkles, shortcut: '',
      action: () => setMode('widget'),
    },
    // Theme
    {
      id: 'toggle-theme', labelKey: 'cmdToggleTheme', categoryKey: 'catTheme',
      icon: isCyberpunk ? Sun : Moon, shortcut: shortcuts.toggleTheme?.display ?? '⌘⇧T',
      action: toggleTheme,
    },
    {
      id: 'cyberpunk-theme', labelKey: 'cmdCyberpunkTheme', categoryKey: 'catTheme',
      icon: Moon,
      action: () => setTheme('cyberpunk'),
    },
    {
      id: 'clean-theme', labelKey: 'cmdCleanTheme', categoryKey: 'catTheme',
      icon: Sun,
      action: () => setTheme('clean'),
    },
    {
      id: 'toggle-lang', labelKey: 'cmdToggleLang', categoryKey: 'catTheme',
      icon: Globe, shortcut: shortcuts.toggleLang?.display ?? '⌘⇧L',
      action: toggleLocale,
    },
    // Tools
    {
      id: 'open-settings', labelKey: 'cmdOpenSettings', categoryKey: 'catTools',
      icon: Settings, shortcut: shortcuts.openSettings?.display ?? '⌘,',
      action: () => setSettingsVisible(true),
    },
    {
      id: 'open-model-settings', labelKey: 'cmdOpenModelSettings', categoryKey: 'catAI',
      icon: Bot, shortcut: shortcuts.modelSettings?.display ?? '⌘⇧M',
      action: () => openModelSettings(),
    },
    {
      id: 'open-notifications', labelKey: 'cmdOpenNotifications', categoryKey: 'catTools',
      icon: Bell,
      action: () => setNotificationsVisible(true),
    },
    {
      id: 'keyboard-shortcuts', labelKey: 'cmdKeyboardShortcuts', categoryKey: 'catTools',
      icon: Keyboard,
      action: () => { setCheatSheetVisible(true) },
    },
    // IDE-specific
    {
      id: 'toggle-terminal', labelKey: 'cmdToggleTerminal', categoryKey: 'catEditor',
      icon: Terminal, shortcut: shortcuts.toggleTerminal?.display ?? '⌘`',
      action: () => { setMode('ide') },
    },
    {
      id: 'new-project', labelKey: 'cmdNewProject', categoryKey: 'catProject',
      icon: FolderPlus, shortcut: shortcuts.newProject?.display ?? '⌘⇧N',
      action: () => { setMode('ide') },
    },
    {
      id: 'open-ai-assist', labelKey: 'cmdOpenAIAssist', categoryKey: 'catAI',
      icon: Sparkles, shortcut: shortcuts.aiAssist?.display ?? '⌘⇧A',
      action: () => { setMode('ide') },
    },
    {
      id: 'open-code-gen', labelKey: 'cmdOpenCodeGen', categoryKey: 'catAI',
      icon: Code2, shortcut: shortcuts.codeGen?.display ?? '⌘⇧G',
      action: () => { setMode('ide') },
    },
    {
      id: 'toggle-preview', labelKey: 'cmdTogglePreview', categoryKey: 'catEditor',
      icon: Eye, shortcut: shortcuts.togglePreview?.display ?? '⌘1',
      action: () => { setMode('ide') },
    },
    {
      id: 'global-search', labelKey: 'cmdGlobalSearch', categoryKey: 'catTools',
      icon: Search, shortcut: shortcuts.globalSearch?.display ?? '⌘⇧F',
      action: openGlobalSearch,
    },
    {
      id: 'toggle-collab', labelKey: 'cmdToggleCollab', categoryKey: 'catTools',
      icon: Users,
      action: () => { setMode('ide') },
    },
    // New MVP expansion panels
    {
      id: 'open-git-panel', labelKey: 'cmdOpenGitPanel', categoryKey: 'catTools',
      icon: GitBranch, shortcut: shortcuts.openGitPanel?.display ?? '⌘ Shift H',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'git' })) },
    },
    {
      id: 'open-performance', labelKey: 'cmdOpenPerformance', categoryKey: 'catTools',
      icon: Activity, shortcut: shortcuts.openPerformance?.display ?? '⌘ Shift P',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'performance' })) },
    },
    {
      id: 'open-webgpu-ai', labelKey: 'cmdOpenWebGPUAI', categoryKey: 'catAI',
      icon: Zap, shortcut: '⌘ Shift W',
      action: () => setAIAssistantVisible(true),
    },
    {
      id: 'open-crdt-collab', labelKey: 'cmdOpenCRDTCollab', categoryKey: 'catTools',
      icon: Users, shortcut: '⌘ Shift C',
      action: () => setCRDTCollabVisible(true),
    },
    {
      id: 'open-intelligent-workflow', labelKey: 'cmdOpenIntelligentWorkflow', categoryKey: 'catAI',
      icon: Brain, shortcut: '⌘ Shift I',
      action: () => setIntelligentWorkflowVisible(true),
    },
    {
      id: 'open-agent-workflow', labelKey: 'cmdOpenAgentWorkflow', categoryKey: 'catAI',
      icon: Bot, shortcut: '⌘ Shift A',
      action: () => setAgentWorkflowVisible(true),
    },
    // P0: File Synchronization (完整性优化 - Week 1)
    {
      id: 'open-sync-panel', labelKey: 'cmdOpenSyncPanel', categoryKey: 'catTools',
      icon: Wifi, shortcut: '⌘ Shift S',
      action: () => setSyncPanelVisible(true),
    },
    {
      id: 'open-diagnostics', labelKey: 'cmdOpenDiagnostics', categoryKey: 'catTools',
      icon: AlertTriangle, shortcut: shortcuts.openDiagnostics?.display ?? '⌘ Shift D',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'diagnostics' })) },
    },
    {
      id: 'open-task-board', labelKey: 'cmdOpenTaskBoard', categoryKey: 'catProject',
      icon: LayoutGrid, shortcut: shortcuts.openTaskBoard?.display ?? '⌘ Shift B',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'taskBoard' })) },
    },
    {
      id: 'open-snippets', labelKey: 'cmdOpenSnippets', categoryKey: 'catEditor',
      icon: Scissors, shortcut: shortcuts.openSnippets?.display ?? '⌘ Shift S',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'snippets' })) },
    },
    {
      id: 'open-activity-log', labelKey: 'cmdOpenActivityLog', categoryKey: 'catTools',
      icon: Clock, shortcut: shortcuts.openActivityLog?.display ?? '⌘ Shift J',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'activityLog' })) },
    },
    {
      id: 'open-database', labelKey: 'cmdOpenDatabase', categoryKey: 'catTools',
      icon: Database, shortcut: '⌘ Shift Q',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'database' })) },
    },
    {
      id: 'open-plugins', labelKey: 'cmdOpenPlugins', categoryKey: 'catTools',
      icon: Puzzle, shortcut: '⌘ Shift E',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'plugins' })) },
    },
    {
      id: 'open-security', labelKey: 'cmdOpenSecurity', categoryKey: 'catTools',
      icon: Shield, shortcut: '⌘ Shift X',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'security' })) },
    },
    {
      id: 'open-offline', labelKey: 'cmdOpenOffline', categoryKey: 'catTools',
      icon: Wifi, shortcut: '⌘ Shift O',
      action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'offline' })) },
    },
    {
      id: 'open-image-gen', labelKey: '图像生成', categoryKey: 'catAI',
      icon: ImageIcon, shortcut: '⌘ ⇧ G',
      action: () => setImageGenVisible(true),
    },
    {
      id: 'open-self-media-editor', labelKey: '内容编辑器', categoryKey: 'catAI',
      icon: FileText, shortcut: '⌘ ⇧ E',
      action: () => setSelfMediaEditorVisible(true),
    },
    // Phase 2: Self-Media Creation Engine Panels
    {
      id: 'open-ai-writing', labelKey: 'AI写作助手', categoryKey: 'catAI',
      icon: Sparkles, shortcut: '⌘ ⇧ W',
      action: () => setAIWritingVisible(true),
    },
    {
      id: 'open-material-manager', labelKey: '素材管理器', categoryKey: 'catTools',
      icon: ImageIcon, shortcut: '⌘ ⇧ U',
      action: () => setMaterialManagerVisible(true),
    },
    {
      id: 'open-content-preview', labelKey: '内容预览', categoryKey: 'catTools',
      icon: Eye, shortcut: '⌘ ⇧ P',
      action: () => setContentPreviewVisible(true),
    },
    {
      id: 'open-publish-queue', labelKey: '多平台发布', categoryKey: 'catTools',
      icon: Send, shortcut: '',
      action: () => setPublishQueueVisible(true),
    },
    {
      id: 'open-trending-topics', labelKey: '热点选题', categoryKey: 'catTools',
      icon: Flame, shortcut: '',
      action: () => setTrendingTopicsVisible(true),
    },
    {
      id: 'open-local-model-dash', labelKey: '本地模型基础设施', categoryKey: 'catAI',
      icon: Cpu, shortcut: '⌘ ⇧ M',
      action: () => setLocalModelDashVisible(true),
    },
  ], [isCyberpunk, toggleTheme, setTheme, toggleLocale, openModelSettings, shortcuts, openGlobalSearch]);

  // ===== Keyboard shortcuts — use custom bindings from store =====
  useKeyboardShortcuts([
    { keys: shortcuts.commandPalette?.internal ?? 'mod+k', action: () => setCommandPaletteVisible((v) => !v) },
    { keys: shortcuts.toggleTheme?.internal ?? 'mod+shift+t', action: toggleTheme },
    { keys: shortcuts.toggleLang?.internal ?? 'mod+shift+l', action: toggleLocale },
    { keys: shortcuts.openSettings?.internal ?? 'mod+,', action: () => setSettingsVisible((v) => !v) },
    { keys: shortcuts.modelSettings?.internal ?? 'mod+shift+m', action: () => openModelSettings() },
    { keys: shortcuts.globalSearch?.internal ?? 'mod+shift+f', action: openGlobalSearch },
    // Panel shortcuts — dispatch custom events for IDEMode to handle
    { keys: shortcuts.openSnippets?.internal ?? 'mod+shift+s', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'snippets' })) } },
    { keys: shortcuts.openTaskBoard?.internal ?? 'mod+shift+b', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'taskBoard' })) } },
    { keys: shortcuts.openGitPanel?.internal ?? 'mod+shift+h', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'git' })) } },
    { keys: shortcuts.openPerformance?.internal ?? 'mod+shift+p', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'performance' })) } },
    { keys: shortcuts.openDiagnostics?.internal ?? 'mod+shift+d', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'diagnostics' })) } },
    { keys: shortcuts.openActivityLog?.internal ?? 'mod+shift+j', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'activityLog' })) } },
    { keys: shortcuts.agentWorkflow?.internal ?? 'mod+shift+a', action: () => setAgentWorkflowVisible(v => !v) },
    // Shortcut cheat sheet
    { keys: shortcuts.shortcutCheatSheet?.internal ?? 'mod+/', action: () => setCheatSheetVisible(v => !v) },
    {
      keys: 'escape', action: () => {
        if (globalSearchVisible) setGlobalSearchVisible(false)
        else if (commandPaletteVisible) setCommandPaletteVisible(false)
        else if (settingsVisible) setSettingsVisible(false)
        else if (notificationsVisible) setNotificationsVisible(false)
        else if (cheatSheetVisible) setCheatSheetVisible(false)
        else if (agentWorkflowVisible) setAgentWorkflowVisible(false)
        else if (selfMediaEditorVisible) setSelfMediaEditorVisible(false)
        else if (aiWritingVisible) setAIWritingVisible(false)
        else if (materialManagerVisible) setMaterialManagerVisible(false)
        else if (contentPreviewVisible) setContentPreviewVisible(false)
        else if (publishQueueVisible) setPublishQueueVisible(false)
        else if (trendingTopicsVisible) setTrendingTopicsVisible(false)
        else if (imageGenVisible) setImageGenVisible(false)
        else if (syncPanelVisible) setSyncPanelVisible(false)
        else if (localModelDashVisible) setLocalModelDashVisible(false)
      }, preventDefault: false
    },
  ]);

  return (
    <div
      className="w-full h-screen overflow-hidden"
      style={{
        background: tokens.background,
        fontFamily: tokens.fontBody,
        position: "relative",
        color: tokens.foreground,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <CyberpunkBackground />
      {mode === "fullscreen" ? (
        <FullscreenMode
          onSwitchMode={() => setMode("widget")}
          onSwitchToIDE={() => setMode("ide")}
          onOpenSettings={() => setSettingsVisible(true)}
          onOpenNotifications={() => setNotificationsVisible(true)}
          onOpenCommandPalette={() => setCommandPaletteVisible(true)}
          onOpenGlobalSearch={openGlobalSearch}
          onOpenAIWriting={() => setAIWritingVisible(true)}
          onOpenContentTemplate={() => setContentTemplateVisible(true)}
          onOpenMaterialManager={() => setMaterialManagerVisible(true)}
          onOpenPublishQueue={() => setPublishQueueVisible(true)}
          onOpenTrendingTopics={() => setTrendingTopicsVisible(true)}
          onOpenChat={() => setChatVisible(true)}
        />
      ) : mode === "ide" ? (
        <Suspense fallback={<PanelSkeleton />}>
          <IDEMode
            onSwitchMode={() => setMode("fullscreen")}
            onOpenSettings={() => setSettingsVisible(true)}
            onOpenNotifications={() => setNotificationsVisible(true)}
            onOpenCommandPalette={() => setCommandPaletteVisible(true)}
            onOpenGlobalSearch={openGlobalSearch}
            onOpenAudioPanel={() => {
              setSettingsVisible(true)
              setTimeout(() => {
                const settingsTab = document.querySelector('[data-settings-tab="audio"]') as HTMLElement
                if (settingsTab) settingsTab.click()
              }, 100)
            }}
          />
        </Suspense>
      ) : (
        <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}>
          <div className="flex items-center justify-center size-full">
            <div className="text-center">
              <p
                style={{
                  fontFamily: tokens.fontMono,
                  fontSize: "12px",
                  color: tokens.primaryDim,
                  letterSpacing: "4px",
                  opacity: isCyberpunk ? 0.3 : 0.6,
                }}
              >
                YYC&sup3; {t("common", "systemSubtitle")}
              </p>
              <p
                style={{
                  fontFamily: tokens.fontMono,
                  fontSize: "10px",
                  color: isCyberpunk ? tokens.accent : tokens.foregroundMuted,
                  marginTop: "8px",
                  letterSpacing: "2px",
                  opacity: isCyberpunk ? 0.15 : 0.6,
                }}
              >
                {t("mode", "widgetModeActive")}
              </p>
            </div>
          </div>
          <Suspense fallback={<PanelSkeleton />}>
            <FloatingWidget onSwitchMode={() => setMode("fullscreen")} />
          </Suspense>
        </div>
      )}

      {/* Global overlays — eagerly imported */}
      <ModelSettings />
      <CyberToaster />

      {/* Monaco Performance Monitor (Q2-01 - P1级功能) */}
      <MonacoPerformanceMonitor editorRef={monacoEditorRef} />

      {/* Feature panels */}
      <Suspense fallback={<PanelSkeleton />}>
        <CommandPalette
          visible={commandPaletteVisible}
          onClose={() => setCommandPaletteVisible(false)}
          commands={commands}
        />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <SettingsPanel
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <NotificationCenter
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
        />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <GlobalSearch
          visible={globalSearchVisible}
          onClose={() => setGlobalSearchVisible(false)}
          fileContentMap={searchFileMap}
          onSelectFile={handleSearchSelectFile}
          onReplace={(fileName, oldText, newText) => {
            // 对齐 Guidelines: Host-File-System Manager — 全局搜索替换
            try {
              const stored = localStorage.getItem("yyc3_file_content_map");
              if (stored) {
                const map = JSON.parse(stored) as Record<string, string>;
                if (map[fileName]) {
                  map[fileName] = map[fileName].replaceAll(oldText, newText);
                  localStorage.setItem("yyc3_file_content_map", JSON.stringify(map));
                  setSearchFileMap({ ...map });
                }
              }
            } catch { /* ignore */ }
          }}
        />
      </Suspense>

      {/* Performance Monitor Dashboard (P0级功能) */}
      <Suspense fallback={<PanelSkeleton />}>
        <PerformanceDashboard visible={performanceVisible} onClose={() => setPerformanceVisible(false)} />
      </Suspense>

      {/* WebGPU AI Assistant Panel (P0级功能) */}
      <Suspense fallback={<PanelSkeleton />}>
        <AIAssistantPanel visible={aiAssistantVisible} onClose={() => setAIAssistantVisible(false)} />
      </Suspense>

      {/* CRDT Collaboration Panel (P0级功能) */}
      <Suspense fallback={<PanelSkeleton />}>
        <CRDTCollabPanel visible={crdtCollabVisible} onClose={() => setCRDTCollabVisible(false)} />
      </Suspense>

      {/* Intelligent Workflow Panel (P1级功能) */}
      <Suspense fallback={<PanelSkeleton />}>
        <IntelligentWorkflowPanel visible={intelligentWorkflowVisible} onClose={() => setIntelligentWorkflowVisible(false)} />
      </Suspense>

      {/* AI Agent Workflow Panel (P2级功能) */}
      <Suspense fallback={<PanelSkeleton />}>
        <AgentWorkflowPanel visible={agentWorkflowVisible} onClose={() => setAgentWorkflowVisible(false)} />
      </Suspense>

      {/* P0: File Synchronization Panel (完整性优化 - Week 1) */}
      <Suspense fallback={<PanelSkeleton />}>
        <SyncPanel isOpen={syncPanelVisible} onClose={() => setSyncPanelVisible(false)} />
      </Suspense>

      {/* Phase 1: Image Generation Panel (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <ImageGenPanel visible={imageGenVisible} onClose={() => setImageGenVisible(false)} />
      </Suspense>

      {/* Phase 1: Self-Media Content Editor (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <SelfMediaEditor visible={selfMediaEditorVisible} onClose={() => setSelfMediaEditorVisible(false)} />
        <PublishQueue
          visible={publishQueueVisible}
          onClose={() => {
            setPublishQueueVisible(false)
            setPendingPublish(null, null)
          }}
          initialContent={pendingPublishContent || undefined}
          initialTitle={pendingPublishTitle || undefined}
        />
        <TrendingTopics visible={trendingTopicsVisible} onClose={() => setTrendingTopicsVisible(false)} />
        {localModelDashVisible && (
          <LocalModelDashboard onClose={() => setLocalModelDashVisible(false)} />
        )}
      </Suspense>

      {/* Phase 2: AI Writing Assistant (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <AIWritingPanel visible={aiWritingVisible} onClose={() => setAIWritingVisible(false)} />
      </Suspense>

      {/* Phase 3: Smart Chat Page (智能聊天) */}
      {chatVisible && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{ background: tokens.background }}
        >
          <ChatPage />
          <button
            onClick={() => setChatVisible(false)}
            className="absolute top-4 right-4 z-[10000] px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: tokens.error,
              color: tokens.background,
              fontFamily: tokens.fontMono,
            }}
          >
            关闭聊天
          </button>
        </div>
      )}

      {/* Phase 2: Material Manager (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <MaterialManager visible={materialManagerVisible} onClose={() => setMaterialManagerVisible(false)} />
      </Suspense>

      {/* Phase 2: Content Preview (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <ContentPreview visible={contentPreviewVisible} onClose={() => setContentPreviewVisible(false)} />
      </Suspense>

      {/* Phase 2: Content Template Panel (自媒体创作引擎) */}
      <Suspense fallback={<PanelSkeleton />}>
        <ContentTemplatePanel visible={contentTemplateVisible} onClose={() => setContentTemplateVisible(false)} />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ModelStoreProvider>
          <SelfMediaStoreProvider>
            <AppContent />
          </SelfMediaStoreProvider>
        </ModelStoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
