
/**
 * @file model-store.tsx
 * @description 模型状态管理模块，管理AI模型和配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags model,ai,state-management
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NetworkError } from "../types/errors";
import { createLogger } from "../utils/logger";
import { aiMetricsStore } from "./ai-metrics-store";

const logger = createLogger('model-store');

// ===== Types =====
export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "ollama" | "custom";
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  isDetected?: boolean;
}

export interface ConnectivityStatus {
  modelId: string;
  status: "unknown" | "checking" | "online" | "offline";
  latencyMs?: number;
  lastChecked?: number;
  error?: string;
}

export interface ModelTestResult {
  success: boolean;
  response?: string;
  latencyMs: number;
  error?: string;
  model?: string;
}

interface ModelStoreContextType {
  aiModels: AIModel[];
  activeModelId: string | null;
  addAIModel: (model: Omit<AIModel, "id">) => void;
  removeAIModel: (id: string) => void;
  updateAIModel: (id: string, updates: Partial<AIModel>) => void;
  activateAIModel: (id: string) => void;
  deactivateAIModel: () => void;
  getActiveModel: () => AIModel | null;
  modelSettingsOpen: boolean;
  modelSettingsInitialTab: string | null;
  openModelSettings: (initialTab?: string) => void;
  closeModelSettings: () => void;
  connectivityMap: Record<string, ConnectivityStatus>;
  lastSuccessTime: number;
  checkConnectivity: (modelId: string) => Promise<ConnectivityStatus>;
  testModel: (modelId: string) => Promise<ModelTestResult>;
  sendToActiveModel: (message: string, options?: { systemPrompt?: string; history?: { role: string; content: string }[] }) => Promise<string>;
}

// ===== localStorage =====
const LS_MODELS = "yyc3_ai_models";
const LS_ACTIVE = "yyc3_active_model_id";

function loadModels(): AIModel[] {
  try { const r = localStorage.getItem(LS_MODELS); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveModels(m: AIModel[]) {
  try { localStorage.setItem(LS_MODELS, JSON.stringify(m)); } catch {/* */ }
}
function loadActiveId(): string | null {
  try { return localStorage.getItem(LS_ACTIVE); } catch { return null; }
}
function saveActiveId(id: string | null) {
  try { if (id) localStorage.setItem(LS_ACTIVE, id); else localStorage.removeItem(LS_ACTIVE); } catch {/* */ }
}
function genId() { return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }

// ===== Response Cache =====
/** 对齐 Guidelines: Caching — 智能缓存减少 API 调用 */
interface CacheEntry {
  response: string;
  timestamp: number;
  latencyMs: number;
}
const RESPONSE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟 TTL
const CACHE_MAX_SIZE = 50;

function getCacheKey(model: string, messages: { role: string; content: string }[]): string {
  return model + "::" + JSON.stringify(messages);
}

function getCachedResponse(key: string): CacheEntry | null {
  const entry = RESPONSE_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    RESPONSE_CACHE.delete(key);
    return null;
  }
  return entry;
}

function setCachedResponse(key: string, response: string, latencyMs: number) {
  // LRU: 超出大小时删除最旧的
  if (RESPONSE_CACHE.size >= CACHE_MAX_SIZE) {
    const oldest = RESPONSE_CACHE.keys().next().value;
    if (oldest !== undefined) RESPONSE_CACHE.delete(oldest);
  }
  RESPONSE_CACHE.set(key, { response, timestamp: Date.now(), latencyMs });
}

// ===== Rate Limiter =====
/** 对齐 Guidelines: Rate Limiting — 客户端侧速率控制 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 30;   // 每分钟最大请求数
const rateLimitTracker = new Map<string, number[]>();

function checkRateLimit(modelKey: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitTracker.get(modelKey) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitTracker.set(modelKey, recent);
  return recent.length < RATE_LIMIT_MAX_REQUESTS;
}

function recordRateLimit(modelKey: string) {
  const timestamps = rateLimitTracker.get(modelKey) || [];
  timestamps.push(Date.now());
  rateLimitTracker.set(modelKey, timestamps);
}

// ===== API helper =====
async function callChatAPI(
  endpoint: string, apiKey: string, model: string,
  messages: { role: string; content: string }[], signal?: AbortSignal
) {
  const start = performance.now();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const resp = await fetch(endpoint, {
    method: "POST", headers, signal,
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const latencyMs = Math.round(performance.now() - start);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || data?.message?.content || data?.response || JSON.stringify(data).slice(0, 300);
  return { content, latencyMs };
}

// ===== Context =====
const Ctx = createContext<ModelStoreContextType | null>(null);

export function ModelStoreProvider({ children }: { children: ReactNode }) {
  const [aiModels, setAiModels] = useState<AIModel[]>(loadModels);
  const [activeModelId, setActiveModelId] = useState<string | null>(loadActiveId);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [modelSettingsInitialTab, setModelSettingsInitialTab] = useState<string | null>(null);
  const [connectivityMap, setConnectivityMap] = useState<Record<string, ConnectivityStatus>>({});
  const [lastSuccessTime, setLastSuccessTime] = useState<number>(0);
  const modelsRef = useRef(aiModels);

  useEffect(() => {
    modelsRef.current = aiModels;
  }, [aiModels]);

  useEffect(() => { saveModels(aiModels); }, [aiModels]);
  useEffect(() => { saveActiveId(activeModelId); }, [activeModelId]);
  useEffect(() => {
    if (activeModelId && !aiModels.find((m) => m.id === activeModelId)) queueMicrotask(() => setActiveModelId(null));
  }, [aiModels, activeModelId]);

  // ===== 自动网络检测（对齐 Guidelines: Intelligent Detection） =====
  // 每 60 秒自动检测活跃模型连接状态
  const activeModelIdRef = useRef(activeModelId);

  useEffect(() => {
    activeModelIdRef.current = activeModelId;
  }, [activeModelId]);

  const autoCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoCheckRef.current) clearInterval(autoCheckRef.current);
    if (!activeModelId) return;

    // 首次立即检测
    const doCheck = () => {
      const mid = activeModelIdRef.current;
      if (!mid) return;
      const m = modelsRef.current.find((x) => x.id === mid);
      if (!m) return;
      // 轻量级 HEAD/GET 检测，不影响主线程
      const pingUrl = m.provider === "ollama"
        ? m.endpoint.replace(/\/api\/.*$/, "") + "/api/tags"
        : m.endpoint;
      const method = m.provider === "ollama" ? "GET" : "POST";
      const hdrs: Record<string, string> = { "Content-Type": "application/json" };
      if (m.apiKey) hdrs["Authorization"] = `Bearer ${m.apiKey}`;
      const body = method === "POST" ? JSON.stringify({ model: m.name, messages: [{ role: "user", content: "ping" }], max_tokens: 1 }) : undefined;
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 6000);
      const start = performance.now();
      fetch(pingUrl, { method, headers: hdrs, body, signal: ctrl.signal })
        .then(r => {
          clearTimeout(tm);
          const lat = Math.round(performance.now() - start);
          setConnectivityMap((p) => ({ ...p, [mid]: { modelId: mid, status: r.ok ? "online" : "offline", latencyMs: lat, lastChecked: Date.now(), error: r.ok ? undefined : `HTTP ${r.status}` } }));
        })
        .catch((err: Error | NetworkError | unknown) => {
          clearTimeout(tm);
          const errorName = err instanceof Error ? err.name : '';
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setConnectivityMap((p) => ({ ...p, [mid]: { modelId: mid, status: "offline", lastChecked: Date.now(), error: errorName === "AbortError" ? "Timeout" : errorMessage } }));
        });
    };

    // 延迟 2 秒后首次检测，避免启动阻塞
    const initTm = setTimeout(doCheck, 2000);
    autoCheckRef.current = setInterval(doCheck, 60_000);

    return () => {
      clearTimeout(initTm);
      if (autoCheckRef.current) clearInterval(autoCheckRef.current);
    };
  }, [activeModelId]);

  const addAIModel = useCallback((model: Omit<AIModel, "id">) => {
    setAiModels((p) => [...p, { ...model, id: genId() }]);
  }, []);

  const removeAIModel = useCallback((id: string) => {
    setAiModels((p) => p.filter((m) => m.id !== id));
    setActiveModelId((p) => (p === id ? null : p));
  }, []);

  const updateAIModel = useCallback((id: string, updates: Partial<AIModel>) => {
    setAiModels((p) => p.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const activateAIModel = useCallback((id: string) => {
    setAiModels((p) => p.map((m) => ({ ...m, isActive: m.id === id })));
    setActiveModelId(id);
  }, []);

  const deactivateAIModel = useCallback(() => {
    setAiModels((p) => p.map((m) => ({ ...m, isActive: false })));
    setActiveModelId(null);
  }, []);

  const getActiveModel = useCallback((): AIModel | null => {
    if (!activeModelId) return null;
    return modelsRef.current.find((m) => m.id === activeModelId) ?? null;
  }, [activeModelId]);

  const openModelSettings = useCallback((initialTab?: string) => {
    setModelSettingsOpen(true);
    setModelSettingsInitialTab(initialTab || null);
  }, []);
  const closeModelSettings = useCallback(() => setModelSettingsOpen(false), []);

  const checkConnectivity = useCallback(async (modelId: string): Promise<ConnectivityStatus> => {
    const model = modelsRef.current.find((m) => m.id === modelId);
    if (!model) return { modelId, status: "offline", error: "Model not found" };

    setConnectivityMap((p) => ({ ...p, [modelId]: { modelId, status: "checking", lastChecked: Date.now() } }));

    try {
      let pingUrl = model.endpoint;
      let method = "POST";
      let body: string | undefined = JSON.stringify({ model: model.name, messages: [{ role: "user", content: "hi" }], max_tokens: 1 });
      if (model.provider === "ollama") {
        pingUrl = model.endpoint.replace(/\/api\/.*$/, "") + "/api/tags";
        method = "GET";
        body = undefined;
      }
      const start = performance.now();
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 8000);
      const hdrs: Record<string, string> = { "Content-Type": "application/json" };
      if (model.apiKey) hdrs["Authorization"] = `Bearer ${model.apiKey}`;
      const resp = await fetch(pingUrl, { method, headers: hdrs, body, signal: ctrl.signal });
      clearTimeout(tm);
      const latencyMs = Math.round(performance.now() - start);
      const r: ConnectivityStatus = { modelId, status: resp.ok ? "online" : "offline", latencyMs, lastChecked: Date.now(), error: resp.ok ? undefined : `HTTP ${resp.status}` };
      setConnectivityMap((p) => ({ ...p, [modelId]: r }));
      return r;
    } catch (err: Error | NetworkError | unknown) {
      const errorName = err instanceof Error ? err.name : '';
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const r: ConnectivityStatus = { modelId, status: "offline", lastChecked: Date.now(), error: errorName === "AbortError" ? "Timeout" : errorMessage };
      setConnectivityMap((p) => ({ ...p, [modelId]: r }));
      return r;
    }
  }, []);

  const testModel = useCallback(async (modelId: string): Promise<ModelTestResult> => {
    const model = modelsRef.current.find((m) => m.id === modelId);
    if (!model) return { success: false, latencyMs: 0, error: "Model not found" };
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 30000);
      const { content, latencyMs } = await callChatAPI(
        model.endpoint, model.apiKey, model.name,
        [{ role: "system", content: "Reply briefly." }, { role: "user", content: "Hello! Confirm you are working." }],
        ctrl.signal
      );
      clearTimeout(tm);
      setConnectivityMap((p) => ({ ...p, [modelId]: { modelId, status: "online", latencyMs, lastChecked: Date.now() } }));
      return { success: true, response: content, latencyMs, model: model.name };
    } catch (err: Error | NetworkError | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setConnectivityMap((p) => ({ ...p, [modelId]: { modelId, status: "offline", lastChecked: Date.now(), error: errorMessage } }));
      return { success: false, latencyMs: 0, error: errorMessage, model: model.name };
    }
  }, []);

  /**
   * 对齐 Guidelines: 智能容错 + 缓存 + 速率限制的统一 AI 请求入口
   * 流程：缓存检查 → 速率限制 → API 请求 → 失败时自动 Fallback 到备选模型
   */
  const sendToActiveModel = useCallback(async (message: string, options?: { systemPrompt?: string; history?: { role: string; content: string }[] }): Promise<string> => {
    const model = activeModelId ? modelsRef.current.find((m) => m.id === activeModelId) : null;
    if (!model) throw new Error("No active model");

    // 构建消息列表
    const msgs: { role: string; content: string }[] = [];
    if (options?.systemPrompt) msgs.push({ role: "system", content: options.systemPrompt });
    if (options?.history) msgs.push(...options.history);
    msgs.push({ role: "user", content: message });

    // 1) 缓存检查
    const cacheKey = getCacheKey(model.name, msgs);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached.response;

    // 2) 速率限制检查
    const rateLimitKey = `${model.provider}:${model.name}`;
    if (!checkRateLimit(rateLimitKey)) {
      throw new Error("Rate limit exceeded. Please wait a moment.");
    }

    // 3) 尝试调用指定模型
    const tryModel = async (m: AIModel): Promise<string> => {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 60000);
      const startTime = performance.now();
      try {
        recordRateLimit(`${m.provider}:${m.name}`);
        const { content, latencyMs } = await callChatAPI(m.endpoint, m.apiKey, m.name, msgs, ctrl.signal);
        clearTimeout(tm);
        setCachedResponse(getCacheKey(m.name, msgs), content, latencyMs);
        const inputLen = msgs.reduce((s, mg) => s + mg.content.length, 0);
        aiMetricsStore.recordSuccess({
          providerId: m.provider,
          modelId: m.name,
          modelName: m.name,
          latencyMs,
          inputTokens: Math.ceil(inputLen / 4),
          outputTokens: Math.ceil(content.length / 4),
        });
        // 更新连接状态为在线
        setConnectivityMap((p) => ({ ...p, [m.id]: { modelId: m.id, status: "online", latencyMs, lastChecked: Date.now() } }));
        // 更新最后成功时间戳
        setLastSuccessTime(Date.now());
        return content;
      } catch (err: Error | NetworkError | unknown) {
        clearTimeout(tm);
        const latencyMs = Math.round(performance.now() - startTime);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        aiMetricsStore.recordError({
          providerId: m.provider,
          providerName: m.provider,
          modelId: m.name,
          modelName: m.name,
          latencyMs,
          errorMessage: errorMessage,
          httpStatus: undefined,
        });
        setConnectivityMap((p) => ({ ...p, [m.id]: { modelId: m.id, status: "offline", lastChecked: Date.now(), error: errorMessage } }));
        throw err;
      }
    };

    try {
      return await tryModel(model);
    } catch (primaryErr) {
      // 4) 智能容错：Fallback 到备选模型
      const fallbacks = modelsRef.current.filter(
        (m) => m.id !== model.id && m.endpoint && m.name
      );
      for (const fb of fallbacks) {
        try {
          logger.info(`[YYC³ Fallback] Trying fallback model: ${fb.name}`);
          const result = await tryModel(fb);
          return result;
        } catch {
          // 继续尝试下一个
        }
      }
      // 所有模型均失败
      throw primaryErr;
    }
  }, [activeModelId]);

  const value = useMemo<ModelStoreContextType>(() => ({
    aiModels, activeModelId,
    addAIModel, removeAIModel, updateAIModel, activateAIModel, deactivateAIModel, getActiveModel,
    modelSettingsOpen, modelSettingsInitialTab, openModelSettings, closeModelSettings,
    connectivityMap, lastSuccessTime, checkConnectivity, testModel, sendToActiveModel,
  }), [aiModels, activeModelId, modelSettingsOpen, modelSettingsInitialTab, connectivityMap, lastSuccessTime,
    addAIModel, removeAIModel, updateAIModel, activateAIModel, deactivateAIModel, getActiveModel,
    openModelSettings, closeModelSettings, checkConnectivity, testModel, sendToActiveModel]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const fallbackModelStore: ModelStoreContextType = {
  aiModels: [],
  activeModelId: null,
  addAIModel: () => { },
  removeAIModel: () => { },
  updateAIModel: () => { },
  activateAIModel: () => { },
  deactivateAIModel: () => { },
  getActiveModel: () => null,
  modelSettingsOpen: false,
  modelSettingsInitialTab: null,
  openModelSettings: () => { },
  closeModelSettings: () => { },
  connectivityMap: {},
  lastSuccessTime: 0,
  checkConnectivity: async (modelId: string) => ({ modelId, status: "unknown" as const }),
  testModel: async () => ({ success: false, latencyMs: 0, error: "No provider" }),
  sendToActiveModel: async () => "",
};

export function useModelStore() {
  const ctx = useContext(Ctx);
  if (!ctx) return fallbackModelStore;
  return ctx;
}
