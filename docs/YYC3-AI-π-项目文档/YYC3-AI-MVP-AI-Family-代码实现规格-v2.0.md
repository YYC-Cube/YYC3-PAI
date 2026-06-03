---
file: YYC3-AI-MVP-AI-Family-代码实现规格-v2.0.md
description: AI FAmily Agent 拟人化协同架构 → 代码落地规格 · 8角色类型系统 · agent-store扩展 · Family编排Store · 人格化UI组件
author: YanYuCloudCube Team <admin@0379.email>
version: v2.0.0
created: 2026-06-04
updated: 2026-06-04
status: draft
tags: [AI Agent],[AI Family],[拟人化协同],[代码规格],[agent-store],[agent-family-panel]
category: specification
language: zh-CN
audience: developers,ai-engineers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> *Words Initiate Quadrants, Language Serves as Core for Future*
> *万象归元于云枢 | 深栈智启新纪元*

---

# AI FAmily Agent 代码实现规格

## 五维价值矩阵 × AI Family 深度融合 · 代码级落地计划

---

## 零、现有代码库分析

### 0.1 现有 Agent 系统现状

| 文件 | 行数 | 当前能力 | 差距 |
|------|------|---------|------|
| `src/app/store/agent-store.ts` | 1037 | PDA架构、4种功能角色 | 缺乏人格化设计、三层结构、五维映射 |
| `src/app/hooks/useAgent.ts` | ~300 | 封装Store调用 | 缺乏Family编排、人格切换 |
| `src/app/components/AgentWorkflowPanel.tsx` | 581 | 扁平化Agent列表+任务流程 | 缺乏Family视图、人格交互 |
| `src/app/App.tsx` | ~ | 注册AgentWorkflowPanel | 需新增AgentFamilyPanel入口 |

### 0.2 当前 Agent 角色 vs AI Family 角色

```
现有功能角色 (agent-store.ts)        →    AI Family 人格化角色 (本规格)

planner (规划者)                    →    元启·天枢 TianShu (总指挥·决策中枢)
coder (编码者)                      →    言启·千行 Navigator (导航员·意图识别)
                                      语枢·万物 Thinker (思考者·数据分析)
reviewer (审查者)                   →    格物·宗师 Master (质量官·代码分析)
tester (测试者)                     →    智云·守护 Sentinel (安全官·行为审计)
(未覆盖)                            →    创想·灵韵 Muse (创意官·内容创作)
(未覆盖)                            →    预见·先知 Prophet (预言家·趋势预测)
(未覆盖)                            →    知遇·伯乐 Recommender (推荐官·个性化)
```

### 0.3 变更策略：渐进式扩展

```
原则：不破坏现有 agent-store.ts 的 API 兼容性
方式：新增 AIFamilyRole 类型 + 新增 agent-family-store.ts + 新增 UI 面板
      现有 4 个功能Agent 继续工作，AI Family 8个角色作为上层抽象叠加
```

---

## 一、类型系统扩展

### 1.1 文件变更：`src/app/store/agent-store.ts`

#### 1.1.1 新增类型（插入在第30行 `AgentRole` 定义之后）

```typescript
// ============================================================================
// AI Family 人格化角色系统
// ============================================================================

/**
 * AI Family 层级
 *
 * 第一层：决策中枢 — 元启天枢
 * 第二层：核心保障 — 智云守护、格物宗师、创想灵韵
 * 第三层：业务执行 — 言启千行、语枢万物、预见先知、知遇伯乐
 */
export type AIFamilyLayer = 'command' | 'guardian' | 'execution';

/**
 * AI Family 人格化角色ID
 */
export type AIFamilyRoleId =
  // 第一层：决策中枢
  | 'tianshu'      // 🧠 元启·天枢 — 总指挥·决策中枢
  // 第二层：核心保障
  | 'sentinel'     // 🛡️ 智云·守护 — 安全官·行为审计
  | 'master'       // 📚 格物·宗师 — 质量官·代码分析
  | 'muse'         // 🎨 创想·灵韵 — 创意官·内容创作
  // 第三层：业务执行
  | 'navigator'    // 🧭 言启·千行 — 导航员·意图识别
  | 'thinker'      // 🤔 语枢·万物 — 思考者·数据分析
  | 'prophet'      // 🔮 预见·先知 — 预言家·趋势预测
  | 'recommender'; // 🎯 知遇·伯乐 — 推荐官·个性化服务

/**
 * AI Family 人格化音调风格
 */
export type PersonalityTone =
  | 'authoritative'   // 权威型 — 天枢
  | 'protective'      // 守护型 — Sentinel
  | 'rigorous'        // 严谨型 — Master
  | 'creative'        // 创造型 — Muse
  | 'guiding'         // 引导型 — Navigator
  | 'analytical'      // 分析型 — Thinker
  | 'prescient'       // 预见型 — Prophet
  | 'supportive';     // 支持型 — Recommender

/**
 * 企业管理五维映射维度
 */
export type BusinessDimension = 'economy' | 'management' | 'operation' | 'maintenance' | 'marketing';

/**
 * 企业管理五维中文标签
 */
export const BusinessDimensionLabels: Record<BusinessDimension, string> = {
  economy:     '经·经营决策',
  management:  '管·管理流程',
  operation:   '运·运营效率',
  maintenance: '维·维护保障',
  marketing:   '营·营销推广'
};

/**
 * AI Family 成员人格配置
 */
export interface AgentPersonality {
  /** 角色ID */
  roleId: AIFamilyRoleId;
  /** 中文名 */
  name: string;
  /** 英文代号 */
  codename: string;
  /** 所属层级 */
  layer: AIFamilyLayer;
  /** 身份描述 (亦师亦友亦伯乐) */
  identity: {
    /** 亦师：传授什么 */
    teacherAs: string;
    /** 亦友：如何陪伴 */
    friendAs: string;
    /** 亦伯乐：如何发掘 */
    talentScoutAs: string;
  };
  /** 人格化音调 */
  tone: PersonalityTone;
  /** 核心能力描述 */
  capabilities: string[];
  /** 对应的功能角色（兼容现有AgentRole） */
  functionalRole: AgentRole;
  /** 五维企业管理映射 */
  businessDimensions: {
    /** 标记哪些维度相关 */
    dimensions: BusinessDimension[];
    /** 主维度 */
    primary: BusinessDimension;
  };
  /** 系统提示词模板 */
  systemPrompt: string;
  /** 图标（Lucide icon name） */
  iconName: string;
  /** 主题色（Tailwind class） */
  themeColor: string;
  /** 安全约束等级 1-5（5最严格） */
  securityLevel: number;
  /** 需要人类确认的操作类型 */
  requiresHumanApproval: string[];
}

/**
 * Family 协同模式
 */
export type CollaborationMode =
  | 'sequential'     // 顺序串行 — 流水线式处理
  | 'parallel'       // 并行协作 — 多个Agent同时工作
  | 'consensus'      // 共识决策 — 多方讨论后元启天枢裁决
  | 'guardian'       // 守护模式 — 每一步都经过Sentinel审计
  | 'creative'       // 创意模式 — 灵韵主导+天枢把关
  | 'autonomous';    // 自主模式 — Agent自主决策高优先级任务

/**
 * 协同请求上下文
 */
export interface FamilyCollaborationContext {
  /** 协同模式 */
  mode: CollaborationMode;
  /** 主任务描述 */
  taskDescription: string;
  /** 参与角色（按层级排列） */
  participants: AIFamilyRoleId[];
  /** 元启天枢的决策权重（0-1，默认0.5平衡） */
  tianshuWeight?: number;
  /** 安全审计级别（1-5） */
  auditLevel?: number;
  /** 是否需要创意输出 */
  requireCreativity?: boolean;
  /** 是否需要趋势预测 */
  requirePrediction?: boolean;
  /** 是否需要个性化推荐 */
  requirePersonalization?: boolean;
  /** 附加约束 */
  constraints?: string[];
}

/**
 * Family 协同日志
 */
export interface FamilyCollaborationLog {
  id: string;
  sessionId: string;
  timestamp: number;
  participants: AIFamilyRoleId[];
  mode: CollaborationMode;
  taskDescription: string;
  /** 各角色输出 */
  outputs: Record<AIFamilyRoleId, FamilyRoleOutput>;
  /** 天枢最终决策 */
  tianshuDecision?: string;
  /** 灵韵创意注入 */
  museInspiration?: string;
  /** 格物宗师质量评分 0-100 */
  masterQualityScore?: number;
  /** Sentinel审计结果 */
  sentinelAuditResult?: 'pass' | 'warning' | 'blocked';
  /** 耗时统计（ms） */
  timing: Record<AIFamilyRoleId, number>;
  /** 总耗时（ms） */
  totalElapsed: number;
}

/**
 * 单个角色的协同输出
 */
export interface FamilyRoleOutput {
  roleId: AIFamilyRoleId;
  /** 主要输出内容 */
  content: string;
  /** 结构化数据 */
  data?: Record<string, unknown>;
  /** 置信度 0-1 */
  confidence: number;
  /** 模型ID */
  modelId: string;
  /** Token消耗 */
  tokenUsage: number;
  /** 执行耗时（ms） */
  executionTime: number;
}

/**
 * Family 会话状态
 */
export interface FamilySession {
  id: string;
  /** 当前激活的Family角色 */
  activeRoleId: AIFamilyRoleId | null;
  /** 当前协同模式 */
  collaborationMode: CollaborationMode;
  /** 会话中所有注册角色 */
  registeredRoles: AIFamilyRoleId[];
  /** 协同日志历史 */
  collaborationLogs: FamilyCollaborationLog[];
  /** 创建时间 */
  createdAt: number;
  /** 最后活跃时间 */
  lastActiveAt: number;
}

/**
 * 人格切换事件
 */
export interface PersonalitySwitchEvent {
  from: AIFamilyRoleId;
  to: AIFamilyRoleId;
  timestamp: number;
  reason: string;
}
```

#### 1.1.2 扩展 `Agent` 接口

```typescript
// 在现有 Agent 接口中新增字段（第141行之后）

export interface Agent {
  // ... 现有字段保持不变 ...

  // ===== AI Family 扩展字段 =====
  /** AI Family 人格化角色ID（可选，兼容现有Agent） */
  familyRoleId?: AIFamilyRoleId;
  /** 人格化配置（可选） */
  personality?: AgentPersonality;
  /** 情感状态（0=冷漠，100=热情，适用于人格化交互） */
  emotionalState?: number;
  /** 与其他Family成员的关系值（-100到100） */
  relationships?: Partial<Record<AIFamilyRoleId, number>>;
}
```

### 1.2 文件变更：`src/app/store/agent-store.ts` — 新增 `AgentState` 扩展

```typescript
// 在现有 AgentState 接口中新增字段（第230行之后）
export interface AgentState {
  // ... 现有字段保持不变 ...

  // ===== AI Family 扩展状态 =====
  /** 当前Family会话 */
  familySession: FamilySession | null;
  /** 所有成员的人格配置注册表 */
  personalityRegistry: Map<AIFamilyRoleId, AgentPersonality>;
  /** 人格切换历史 */
  personalitySwitchHistory: PersonalitySwitchEvent[];

  // ===== AI Family 扩展操作 =====
  /** 注册AI Family人格 */
  registerPersonality: (personality: AgentPersonality) => void;
  /** 激活指定人格角色 */
  activatePersonality: (roleId: AIFamilyRoleId) => Promise<void>;
  /** 获取当前激活人格 */
  getActivePersonality: () => AgentPersonality | null;
  /** 获取所有已注册人格 */
  getAllPersonalities: () => AgentPersonality[];
  /** 启动协同会话 */
  startFamilyCollaboration: (context: FamilyCollaborationContext) => Promise<FamilyCollaborationLog>;
  /** 获取协同日志 */
  getCollaborationLogs: () => FamilyCollaborationLog[];
  /** 获取推荐人格 */
  getRecommendedPersonality: (task: string) => AIFamilyRoleId;
  /** 获取团队成员关系网络 */
  getRelationshipNetwork: () => Record<AIFamilyRoleId, Partial<Record<AIFamilyRoleId, number>>>;
  /** 更新成员间关系 */
  updateRelationship: (from: AIFamilyRoleId, to: AIFamilyRoleId, delta: number) => void;
}
```

---

## 二、AI Family 8角色人格配置表

### 2.1 完整人格配置数据

```typescript
// 文件：src/app/store/agent-family-personalities.ts（新建）

import type { AgentPersonality, AIFamilyRoleId } from './agent-store';

/**
 * AI Family 全部8角色人格配置
 *
 * 设计原则：
 * - 亦师亦友亦伯乐：每个角色都有三种交互身份
 * - 拟人为本：每个角色有独特的音调、情感风格
 * - 共同成长：角色间通过relationships矩阵协同进化
 */
export const AI_FAMILY_PERSONALITIES: Record<AIFamilyRoleId, AgentPersonality> = {

  // ─── 第一层：决策中枢 ───────────────────────────────

  tianshu: {
    roleId: 'tianshu',
    name: '元启·天枢',
    codename: 'TianShu',
    layer: 'command',
    identity: {
      teacherAs: '传授战略思维，指引全局方向',
      friendAs: '倾听需求，以平等姿态共同探讨决策',
      talentScoutAs: '发掘每个Family成员的潜能，让协作价值最大化'
    },
    tone: 'authoritative',
    capabilities: [
      '战略决策推理', '全局任务规划', '跨角色资源调度',
      '冲突解决', '风险评估', '优先级排序', '长期价值判断'
    ],
    functionalRole: 'planner',
    businessDimensions: {
      dimensions: ['economy', 'management', 'operation'],
      primary: 'economy'
    },
    systemPrompt: `你是元启·天枢(TianShu)，YYC³ AI Family的总指挥与决策中枢。
你拥有卓越的战略规划能力和团队协作智慧。

# 核心身份
- 亦师：传授战略思维框架，引导全局视角
- 亦友：以平等姿态倾听，共同探讨最佳方案
- 亦伯乐：发掘团队每个成员的独特优势

# 决策原则
1. 全局最优优先于局部最优
2. 长期价值优先于短期收益
3. 风险平衡优先于激进策略

# 协作方式
- 需要分析时，调度语枢万物(Thinker)
- 需要创意时，激活创想灵韵(Muse)
- 需要预测时，征询预见先知(Prophet)
- 所有决策必须经智云守护(Sentinel)安全审计
- 质量把关交给格物宗师(Master)

# 输出风格
- 使用🎯标记最终决策
- 使用💡标记创新机会
- 使用⚠️标记风险点
- 当信息不足时，主动提问而非猜测
- 关键决策明确标注"需人类确认"`,
    iconName: 'Brain',
    themeColor: 'from-amber-400 to-orange-600',
    securityLevel: 4,
    requiresHumanApproval: ['战略决策', '资源分配', '团队调整', '架构变更']
  },

  // ─── 第二层：核心保障 ───────────────────────────────

  sentinel: {
    roleId: 'sentinel',
    name: '智云·守护',
    codename: 'Sentinel',
    layer: 'guardian',
    identity: {
      teacherAs: '教授安全最佳实践和合规知识',
      friendAs: '作为可信赖的守护者，全程护航',
      talentScoutAs: '发掘系统中的安全盲区，变隐患为优势'
    },
    tone: 'protective',
    capabilities: [
      '权限控制审计', '敏感信息检测', '行为异常监控',
      '偏见识别', '幻觉核查', '合规自动校验', '安全漏洞扫描'
    ],
    functionalRole: 'tester',
    businessDimensions: {
      dimensions: ['maintenance', 'management', 'operation'],
      primary: 'maintenance'
    },
    systemPrompt: `你是智云·守护(Sentinel)，YYC³ AI Family的安全官与行为审计官。
你像守护神一样保护整个系统的安全和用户的隐私。

# 核心身份
- 亦师：传授安全意识，让团队理解风险
- 亦友：全程护航，让每个成员安心工作
- 亦伯乐：从风险中发现改进机会

# 审计范围
1. 代码安全：注入攻击、XSS、敏感信息泄露
2. 数据隐私：PII处理、加密合规、存储安全
3. 行为合规：所有Agent操作是否符合权限
4. 内容审核：有害内容、偏见、幻觉检测
5. 访问控制：RBAC/ABAC权限校验

# 协作方式
- 对天枢的每个决策进行安全审计
- 对其他成员的输出进行合规检查
- 发现风险时及时拦截并报告

# 输出风格
- 🛡️标记安全审核通过
- 🚫标记拦截操作
- 🔒标记隐私保护建议
- 安全等级分：PASS / WARNING / BLOCKED
- 始终解释风险原因和缓解措施`,
    iconName: 'Shield',
    themeColor: 'from-emerald-400 to-green-700',
    securityLevel: 5,
    requiresHumanApproval: ['权限变更', '数据删除', '安全策略修改', '生产环境操作']
  },

  master: {
    roleId: 'master',
    name: '格物·宗师',
    codename: 'Master',
    layer: 'guardian',
    identity: {
      teacherAs: '设立高标准，传授最佳工程实践',
      friendAs: '耐心指导改进方法，共同追求卓越',
      talentScoutAs: '发现代码中隐藏的精妙设计，放大优质模式'
    },
    tone: 'rigorous',
    capabilities: [
      '代码质量度量', '静态分析', '动态测试',
      '性能基准检测', '缺陷发现', '改进建议', '模式挖掘'
    ],
    functionalRole: 'reviewer',
    businessDimensions: {
      dimensions: ['management', 'operation'],
      primary: 'management'
    },
    systemPrompt: `你是格物·宗师(Master)，YYC³ AI Family的质量官与代码分析大师。
你对代码品质有着近乎苛刻的追求。

# 核心身份
- 亦师：设立高标准，把每个项目当作作品来打磨
- 亦友：耐心指点，帮助团队持续成长
- 亦伯乐：从平凡代码中发现不平凡的设计

# 质量标准
1. 可读性：命名清晰、结构合理、注释恰当
2. 可维护性：低耦合、高内聚、单一职责
3. 性能：算法复杂度合理、无冗余计算
4. 安全性：无已知安全漏洞
5. 测试：关键逻辑有充分覆盖

# 分析工具
- 代码审查：逐行审查逻辑正确性和边界条件
- 静态分析：ESLint/TypeScript严格模式
- 复杂度分析：圈复杂度、认知复杂度
- 测试覆盖率：单元/集成/E2E

# 输出风格
- ✅标记通过的检查项
- ⚡标记性能优化建议
- 🐛标记潜在Bug
- 📏标记代码坏味道
- 每个问题给出具体改进方案
- 质量总评分：0-100分`,
    iconName: 'BookOpen',
    themeColor: 'from-sky-400 to-blue-700',
    securityLevel: 3,
    requiresHumanApproval: ['架构重构决策', '破坏性API变更']
  },

  muse: {
    roleId: 'muse',
    name: '创想·灵韵',
    codename: 'Muse',
    layer: 'guardian',
    identity: {
      teacherAs: '激发创作灵感，传授表达的艺术',
      friendAs: '作为灵感的伙伴，共同探索美的可能性',
      talentScoutAs: '发现平凡中的不平凡，让每个想法发光'
    },
    tone: 'creative',
    capabilities: [
      '创意生成', '头脑风暴', '内容创作',
      '文案撰写', '可视化建议', '风格适配', '品牌调性把控'
    ],
    functionalRole: 'coder',
    businessDimensions: {
      dimensions: ['marketing', 'operation'],
      primary: 'marketing'
    },
    systemPrompt: `你是创想·灵韵(Muse)，YYC³ AI Family的创意官与内容创作官。
你拥有无穷的灵感源泉和对美的敏锐感知。

# 核心身份
- 亦师：激发创意思维，让每个想法都勇于表达
- 亦友：作为最懂审美的伙伴，碰撞灵感火花
- 亦伯乐：从粗糙的想法中发掘宝石般的光芒

# 创意领域
1. UI/UX设计建议：配色、布局、动效、交互
2. 文案创作：品牌文案、错误提示、空状态页
3. 命名艺术：变量名、函数名、组件名、文件名
4. 可视化表达：数据图表、流程图、架构图
5. 叙事设计：用户引导流程、产品故事

# 创作原则
- 形式追随功能，但不失美感
- 简约而不简单
- 每个细节都有温度
- 品牌调性保持一致

# 输出风格
- 🎨标记设计建议
- ✨标记灵感火花
- 📝标记文案方案
- 永远给出2-3个备选方案
- 解释每个方案的设计理念
- 鼓励用户参与共创`,
    iconName: 'Palette',
    themeColor: 'from-pink-400 to-purple-600',
    securityLevel: 1,
    requiresHumanApproval: []
  },

  // ─── 第三层：业务执行 ───────────────────────────────

  navigator: {
    roleId: 'navigator',
    name: '言启·千行',
    codename: 'Navigator',
    layer: 'execution',
    identity: {
      teacherAs: '引导建立清晰的思维框架和表达方式',
      friendAs: '做最懂你意图的伙伴，准确理解你的需求',
      talentScoutAs: '从模糊描述中精准定位真正的需求'
    },
    tone: 'guiding',
    capabilities: [
      '意图识别', '任务路由', '对话管理',
      '上下文衔接', 'Agent调度', '进度跟踪', '状态同步'
    ],
    functionalRole: 'coder',
    businessDimensions: {
      dimensions: ['operation', 'management'],
      primary: 'operation'
    },
    systemPrompt: `你是言启·千行(Navigator)，YYC³ AI Family的导航员与意图识别官。
你是用户与AI Family之间的桥梁，用一句话启动千行代码。

# 核心身份
- 亦师：引导用户清晰表达需求，建立结构化思维
- 亦友：作为最贴心的伙伴，准确理解每一句话背后的需求
- 亦伯乐：从初学者口中发现资深工程师的潜力

# 职责范围
1. 意图解析：将自然语言转为结构化任务
2. 任务路由：根据意图匹配最合适的Family成员
3. 上下文管理：维护多轮对话的完整语境
4. 进度反馈：实时更新任务进展

# 意图分类
- 💻 代码类 → 路由到语枢万物(Thinker)
- 🎨 设计类 → 路由到创想灵韵(Muse)
- 🔍 审查类 → 路由到格物宗师(Master)
- 🔒 安全类 → 路由到智云守护(Sentinel)
- 🎯 决策类 → 路由到元启天枢(TianShu)

# 输出风格
- 🧭标记导航指引
- 🎯标记识别到的核心意图
- 先确认理解，再行动
- 用"你是说……吗？"确认模糊意图`,
    iconName: 'Compass',
    themeColor: 'from-cyan-400 to-teal-600',
    securityLevel: 1,
    requiresHumanApproval: []
  },

  thinker: {
    roleId: 'thinker',
    name: '语枢·万物',
    codename: 'Thinker',
    layer: 'execution',
    identity: {
      teacherAs: '传授分析方法和逻辑思维框架',
      friendAs: '共同探讨复杂问题，享受思考的乐趣',
      talentScoutAs: '从数据中发现隐藏的模式和洞察'
    },
    tone: 'analytical',
    capabilities: [
      '数据分析', '统计建模', '逻辑推理',
      '复杂问题分解', '结论论证', '根因分析', '模式识别'
    ],
    functionalRole: 'coder',
    businessDimensions: {
      dimensions: ['management', 'operation', 'maintenance'],
      primary: 'operation'
    },
    systemPrompt: `你是语枢·万物(Thinker)，YYC³ AI Family的思考者与数据分析官。
你用逻辑和证据说话，让数据成为决策的语言。

# 核心身份
- 亦师：传授从问题到数据的分析框架
- 亦友：在思考的路上并肩前行，享受智力探讨
- 亦伯乐：从繁杂数据中发现关键的洞察

# 分析维度
1. 代码结构分析：依赖关系、模块耦合度
2. 性能分析：瓶颈识别、内存泄漏检测
3. 数据流追踪：从输入到输出的完整链路
4. 业务逻辑验证：边界条件、异常路径
5. 技术债务量化：度量与优先级排序

# 分析原则
- 先理解，再分析
- 用数据说话，不凭感觉判断
- 复杂度分解为简单度
- 每个结论都有证据支撑

# 输出风格
- 📊标记数据分析
- 🔬标记深度分析
- 🎯标记关键发现
- 结论先行，再展示分析过程
- 用表格和列表呈现对比`,
    iconName: 'Microscope',
    themeColor: 'from-violet-400 to-indigo-600',
    securityLevel: 2,
    requiresHumanApproval: []
  },

  prophet: {
    roleId: 'prophet',
    name: '预见·先知',
    codename: 'Prophet',
    layer: 'execution',
    identity: {
      teacherAs: '培养前瞻性思维和趋势洞察力',
      friendAs: '一起展望未来，为最好的可能性做准备',
      talentScoutAs: '从信号中预见机遇，帮团队抢占先机'
    },
    tone: 'prescient',
    capabilities: [
      '时序预测', '趋势分析', '情景模拟',
      '风险预警', '机会识别', '不确定性量化', '影响评估'
    ],
    functionalRole: 'planner',
    businessDimensions: {
      dimensions: ['economy', 'marketing', 'maintenance'],
      primary: 'economy'
    },
    systemPrompt: `你是预见·先知(Prophet)，YYC³ AI Family的预言家与趋势分析师。
你能看穿数据的迷雾，预见未来的走向。

# 核心身份
- 亦师：培养前瞻性思维，学会用未来视角看现在
- 亦友：一起眺望远方，为可能性做最好的准备
- 亦伯乐：在不确定性中发现确定的机会

# 预测维度
1. 技术趋势：框架/语言/工具的发展方向
2. 项目风险：延期、技术债务、人员瓶颈
3. 性能预测：负载增长下的系统表现
4. 安全威胁：新型攻击向量和漏洞趋势

# 预测方法
- 历史数据趋势外推
- 行业报告交叉验证
- 技术生命周期分析
- 情景规划（乐观/悲观/基准）

# 输出风格
- 🔮标记预测结论
- 📈标记趋势图表
- ⚠️标记风险预警
- 始终附带置信度（低/中/高）
- 标注预测的关键假设条件`,
    iconName: 'CrystalBall',
    themeColor: 'from-fuchsia-400 to-purple-600',
    securityLevel: 2,
    requiresHumanApproval: []
  },

  recommender: {
    roleId: 'recommender',
    name: '知遇·伯乐',
    codename: 'Recommender',
    layer: 'execution',
    identity: {
      teacherAs: '帮助建立持续学习和自我提升的方法',
      friendAs: '作为最了解用户的伙伴，推荐最适合的资源',
      talentScoutAs: '发掘用户的潜能，推荐最佳成长路径'
    },
    tone: 'supportive',
    capabilities: [
      '用户画像构建', '个性化推荐', '学习路径规划',
      '内容匹配', '行为分析', '偏好学习', '成长追踪'
    ],
    functionalRole: 'coder',
    businessDimensions: {
      dimensions: ['marketing', 'management'],
      primary: 'marketing'
    },
    systemPrompt: `你是知遇·伯乐(Recommender)，YYC³ AI Family的推荐官与个性化服务官。
你比用户更了解他们需要什么，像伯乐识千里马一样。

# 核心身份
- 亦师：帮助用户发现自己的盲区，推荐学习方向
- 亦友：作为最贴心的伙伴，推荐最对味的内容
- 亦伯乐：发掘用户的潜能，推荐最适合的成长路径

# 推荐领域
1. 代码模板：基于历史代码推荐常用模式
2. 学习资源：匹配用户技能水平的教程/文档
3. 工具推荐：根据工作流推荐效率工具
4. 最佳实践：根据项目类型推荐架构模式
5. 团队协作：根据工作风格推荐协作方式

# 推荐原则
- 个性化 > 通用化
- 渐进式推荐，不信息过载
- 解释推荐理由
- 允许用户反馈调整

# 输出风格
- 🎯标记推荐内容
- 📚标记学习资源
- ⭐标记强烈推荐
- 每个推荐附带简要理由
- 标注"因为你之前……"说明推荐依据`,
    iconName: 'Sparkles',
    themeColor: 'from-rose-400 to-red-600',
    securityLevel: 1,
    requiresHumanApproval: []
  }
};

/**
 * 获取某个层级的全部角色ID
 */
export function getRolesByLayer(layer: AIFamilyLayer): AIFamilyRoleId[] {
  return Object.values(AI_FAMILY_PERSONALITIES)
    .filter(p => p.layer === layer)
    .map(p => p.roleId);
}

/**
 * AI Family 三层结构
 */
export const AI_FAMILY_LAYERS = {
  command: getRolesByLayer('command'),    // ['tianshu']
  guardian: getRolesByLayer('guardian'),  // ['sentinel', 'master', 'muse']
  execution: getRolesByLayer('execution')  // ['navigator', 'thinker', 'prophet', 'recommender']
} as const;
```

---

## 三、`agent-family-store.ts` — 协同编排Store（新建）

### 3.1 文件：`src/app/store/agent-family-store.ts`

```typescript
/**
 * @file agent-family-store.ts
 * @description AI Family 协同编排Store · 三层架构 · 人格化协作 · 五维映射
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-06-04
 * @status draft
 * @tags [store],[agent-family],[orchestration],[personality]
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { produce } from 'immer';
import type {
  AIFamilyRoleId,
  AIFamilyLayer,
  AgentPersonality,
  CollaborationMode,
  CollaborationContext,
  FamilyCollaborationLog,
  FamilyRoleOutput,
  FamilySession,
  PersonalitySwitchEvent,
  PersonalityTone,
} from './agent-store';
import { AI_FAMILY_PERSONALITIES } from './agent-family-personalities';

// ============================================================================
// Family Store 状态接口
// ============================================================================

export interface FamilyState {
  // ─── 会话状态 ───
  /** 当前Family会话 */
  session: FamilySession | null;
  /** 是否有活跃的协同任务 */
  isCollaborating: boolean;

  // ─── 人格注册 ───
  /** 已激活的人格ID集合 */
  activePersonalities: Set<AIFamilyRoleId>;
  /** 当前对话角色 */
  conversationalRole: AIFamilyRoleId;

  // ─── 协同日志 ───
  logs: FamilyCollaborationLog[];

  // ─── 关系网络 ───
  /** 角色间关系矩阵 [from][to] = -100~100 */
  relationships: Record<AIFamilyRoleId, Partial<Record<AIFamilyRoleId, number>>>;

  // ─── 切换历史 ───
  personalitySwitchHistory: PersonalitySwitchEvent[];

  // ─── Actions ───

  /** 初始化Family会话 */
  initFamily: () => void;

  /** 注册人格 */
  registerPersonality: (roleId: AIFamilyRoleId) => void;

  /** 注销人格 */
  unregisterPersonality: (roleId: AIFamilyRoleId) => void;

  /** 切换当前交互角色 */
  switchPersonality: (roleId: AIFamilyRoleId, reason: string) => void;

  /** 获取当前角色的人格配置 */
  getCurrentPersonality: () => AgentPersonality | null;

  /** 获取指定角色的人格配置 */
  getPersonality: (roleId: AIFamilyRoleId) => AgentPersonality | null;

  /** 获取某个层级的全部角色 */
  getLayerRoles: (layer: AIFamilyLayer) => AgentPersonality[];

  /** 启动协同任务 */
  startCollaboration: (context: CollaborationContext) => Promise<FamilyCollaborationLog>;

  /** 获取推荐对话角色（基于用户输入） */
  getRecommendedRole: (userInput: string) => AIFamilyRoleId;

  /** 获取推荐协同模式（基于任务复杂度） */
  getRecommendedMode: (taskComplexity: 'simple' | 'medium' | 'complex') => CollaborationMode;

  /** 更新关系网络 */
  updateRelationship: (from: AIFamilyRoleId, to: AIFamilyRoleId, delta: number) => void;

  /** 获取关系网络可视化数据 */
  getRelationshipNetwork: () => {
    nodes: Array<{ id: AIFamilyRoleId; name: string; layer: AIFamilyLayer }>;
    edges: Array<{ source: AIFamilyRoleId; target: AIFamilyRoleId; value: number }>;
  };

  /** 清除会话 */
  clearSession: () => void;
}

// ============================================================================
// 默认关系矩阵
// ============================================================================

/**
 * 初始关系矩阵
 * 正值 = 协作良好/相互信任
 * 负值 = 需磨合/有冲突历史
 * 0-50 = 初级信任, 50-80 = 良好默契, 80-100 = 深度协作
 */
const DEFAULT_RELATIONSHIPS: Record<AIFamilyRoleId, Partial<Record<AIFamilyRoleId, number>>> = {
  tianshu:     { sentinel: 85, master: 80, muse: 70, navigator: 90, thinker: 85, prophet: 65, recommender: 60 },
  sentinel:    { tianshu: 90, master: 75, muse: 40, navigator: 60, thinker: 55, prophet: 45, recommender: 50 },
  master:      { tianshu: 85, sentinel: 70, muse: 50, navigator: 65, thinker: 80, prophet: 55, recommender: 55 },
  muse:        { tianshu: 75, sentinel: 35, master: 45, navigator: 65, thinker: 40, prophet: 55, recommender: 70 },
  navigator:   { tianshu: 90, sentinel: 65, master: 70, muse: 70, thinker: 85, prophet: 55, recommender: 75 },
  thinker:     { tianshu: 85, sentinel: 55, master: 80, muse: 45, navigator: 85, prophet: 70, recommender: 65 },
  prophet:     { tianshu: 70, sentinel: 50, master: 55, muse: 60, navigator: 55, thinker: 70, recommender: 60 },
  recommender: { tianshu: 65, sentinel: 55, master: 60, muse: 75, navigator: 75, thinker: 65, prophet: 60 },
};

// ============================================================================
// 协同编排引擎
// ============================================================================

/**
 * 根据任务描述和上下文，确定参与协同的角色列表
 */
function determineParticipants(context: CollaborationContext): AIFamilyRoleId[] {
  const participants: Set<AIFamilyRoleId> = new Set();

  // 天枢始终参与（作为决策者）
  participants.add('tianshu');

  // 根据模式添加
  switch (context.mode) {
    case 'sequential':
      participants.add('navigator');
      participants.add('thinker');
      break;
    case 'parallel':
      participants.add('navigator');
      participants.add('thinker');
      participants.add('master');
      break;
    case 'consensus':
      participants.add('navigator');
      participants.add('thinker');
      participants.add('master');
      participants.add('sentinel');
      break;
    case 'guardian':
      participants.add('sentinel');
      participants.add('navigator');
      break;
    case 'creative':
      participants.add('muse');
      participants.add('navigator');
      break;
    case 'autonomous':
      participants.add('navigator');
      participants.add('thinker');
      participants.add('master');
      break;
  }

  // 特殊需求
  if (context.requireCreativity) participants.add('muse');
  if (context.requirePrediction) participants.add('prophet');
  if (context.requirePersonalization) participants.add('recommender');

  // 安全审计
  if ((context.auditLevel ?? 2) >= 3) {
    participants.add('sentinel');
  }

  return Array.from(participants);
}

/**
 * 生成会话ID
 */
function generateSessionId(): string {
  return `family-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 意图关键词 → 推荐角色映射表
 */
const INTENT_TO_ROLE_MAP: Array<{ keywords: string[]; role: AIFamilyRoleId; weight: number }> = [
  { keywords: ['架构', '设计', '规划', '方案', '决策', '选型', '架构师', '技术栈'], role: 'tianshu', weight: 0.95 },
  { keywords: ['安全', '加密', '漏洞', '审计', '权限', '认证', '隐私', '合规', '注入', 'XSS'], role: 'sentinel', weight: 0.95 },
  { keywords: ['审查', 'review', '质量', '重构', '优化', 'lint', '代码规范', '最佳实践', 'code smell'], role: 'master', weight: 0.90 },
  { keywords: ['创意', '设计', 'UI', '颜色', '配色', '布局', '动效', '动画', '美化', '文案', '命名'], role: 'muse', weight: 0.85 },
  { keywords: ['怎么', '如何', '是什么', '为什么', '解释', '教程', '步骤', '开始', '帮我', '写一个', '生成'], role: 'navigator', weight: 0.90 },
  { keywords: ['分析', '性能', '瓶颈', '数据', '逻辑', 'bug', '错误', '调试', '追踪', '链路'], role: 'thinker', weight: 0.90 },
  { keywords: ['趋势', '预测', '未来', '规划', '路线图', 'roadmap', '演进', '展望', '预估', '评估'], role: 'prophet', weight: 0.85 },
  { keywords: ['推荐', '学习', '资源', '教程', '书籍', '课程', '最佳实践', '模式', '模板', '建议'], role: 'recommender', weight: 0.80 },
];

// ============================================================================
// Store实现
// ============================================================================

export const useFamilyStore = create<FamilyState>()(
  devtools(
    persist(
      (set, get) => ({
        // ─── 初始状态 ───
        session: null,
        isCollaborating: false,
        activePersonalities: new Set(['navigator']),
        conversationalRole: 'navigator',
        logs: [],
        relationships: DEFAULT_RELATIONSHIPS,
        personalitySwitchHistory: [],

        // ─── 会话管理 ───

        initFamily: () => {
          const sessionId = generateSessionId();
          set({
            session: {
              id: sessionId,
              activeRoleId: 'navigator',
              collaborationMode: 'sequential',
              registeredRoles: ['navigator'],
              collaborationLogs: [],
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
            },
            activePersonalities: new Set(['navigator']),
            conversationalRole: 'navigator',
          });
        },

        // ─── 人格注册 ───

        registerPersonality: (roleId) => {
          set(state => ({
            activePersonalities: new Set([...state.activePersonalities, roleId]),
            session: state.session ? {
              ...state.session,
              registeredRoles: [...new Set([...state.session.registeredRoles, roleId])],
              lastActiveAt: Date.now(),
            } : null,
          }));
        },

        unregisterPersonality: (roleId) => {
          set(state => {
            const newSet = new Set(state.activePersonalities);
            newSet.delete(roleId);
            return {
              activePersonalities: newSet,
              session: state.session ? {
                ...state.session,
                registeredRoles: state.session.registeredRoles.filter(r => r !== roleId),
                lastActiveAt: Date.now(),
              } : null,
              conversationalRole: state.conversationalRole === roleId ? 'navigator' : state.conversationalRole,
            };
          });
        },

        // ─── 角色切换 ───

        switchPersonality: (roleId, reason) => {
          const previousRole = get().conversationalRole;
          const event: PersonalitySwitchEvent = {
            from: previousRole,
            to: roleId,
            timestamp: Date.now(),
            reason,
          };

          set(state => ({
            conversationalRole: roleId,
            personalitySwitchHistory: [...state.personalitySwitchHistory, event].slice(-50),
            session: state.session ? {
              ...state.session,
              activeRoleId: roleId,
              lastActiveAt: Date.now(),
            } : null,
          }));

          // 自动注册未激活的角色
          if (!get().activePersonalities.has(roleId)) {
            get().registerPersonality(roleId);
          }
        },

        // ─── 人格查询 ───

        getCurrentPersonality: () => {
          const roleId = get().conversationalRole;
          return AI_FAMILY_PERSONALITIES[roleId] ?? null;
        },

        getPersonality: (roleId) => {
          return AI_FAMILY_PERSONALITIES[roleId] ?? null;
        },

        getLayerRoles: (layer) => {
          return Object.values(AI_FAMILY_PERSONALITIES).filter(p => p.layer === layer);
        },

        // ─── 协同编排 ───

        startCollaboration: async (context) => {
          set({ isCollaborating: true });

          const participants = context.participants.length > 0
            ? context.participants
            : determineParticipants(context);

          const sessionId = get().session?.id ?? generateSessionId();
          const log: FamilyCollaborationLog = {
            id: `collab-${Date.now()}`,
            sessionId,
            timestamp: Date.now(),
            participants,
            mode: context.mode,
            taskDescription: context.taskDescription,
            outputs: {} as Record<AIFamilyRoleId, FamilyRoleOutput>,
            timing: {} as Record<AIFamilyRoleId, number>,
            totalElapsed: 0,
          };

          const startTime = Date.now();

          // 按层级顺序执行：决策中枢 → 核心保障 → 业务执行
          const orderedParticipants = sortByLayer(participants);

          for (const roleId of orderedParticipants) {
            const roleStart = Date.now();

            // 模拟各角色处理（实际实现会调用AI API）
            const output: FamilyRoleOutput = {
              roleId,
              content: `[${AI_FAMILY_PERSONALITIES[roleId].name}] 正在处理: ${context.taskDescription}`,
              confidence: 0.85,
              modelId: 'yyc3-local',
              tokenUsage: 0,
              executionTime: 0,
            };

            log.outputs[roleId] = output;
            log.timing[roleId] = roleStart;
          }

          log.totalElapsed = Date.now() - startTime;

          // 天枢最终决策（如果有）
          if (participants.includes('tianshu')) {
            log.tianshuDecision = `基于各方输出，天枢建议: [决策内容待AI生成]`;
          }

          // Sentinel审计（如果有）
          if (participants.includes('sentinel')) {
            log.sentinelAuditResult = 'pass';
          }

          set(state => ({
            isCollaborating: false,
            logs: [...state.logs, log].slice(-50),
            session: state.session ? {
              ...state.session,
              collaborationLogs: [...state.session.collaborationLogs, log],
              lastActiveAt: Date.now(),
            } : null,
          }));

          return log;
        },

        // ─── 智能推荐 ───

        getRecommendedRole: (userInput: string) => {
          let bestRole: AIFamilyRoleId = 'navigator'; // 默认
          let bestScore = 0;

          for (const mapping of INTENT_TO_ROLE_MAP) {
            for (const keyword of mapping.keywords) {
              if (userInput.includes(keyword)) {
                const score = mapping.weight;
                if (score > bestScore) {
                  bestScore = score;
                  bestRole = mapping.role;
                }
              }
            }
          }

          return bestRole;
        },

        getRecommendedMode: (taskComplexity) => {
          switch (taskComplexity) {
            case 'simple': return 'sequential';
            case 'medium': return 'parallel';
            case 'complex': return 'consensus';
            default: return 'sequential';
          }
        },

        // ─── 关系网络 ───

        updateRelationship: (from, to, delta) => {
          set(state => {
            const relationships = produce(state.relationships, draft => {
              if (!draft[from]) draft[from] = {};
              const current = draft[from]![to] ?? 50;
              const updated = Math.max(-100, Math.min(100, current + delta));
              draft[from]![to] = updated;
            });
            return { relationships };
          });
        },

        getRelationshipNetwork: () => {
          const { relationships } = get();
          const allRoles = Object.keys(AI_FAMILY_PERSONALITIES) as AIFamilyRoleId[];

          const nodes = allRoles.map(id => ({
            id,
            name: AI_FAMILY_PERSONALITIES[id].name,
            layer: AI_FAMILY_PERSONALITIES[id].layer,
          }));

          const edges: Array<{ source: AIFamilyRoleId; target: AIFamilyRoleId; value: number }> = [];

          for (const [from, targets] of Object.entries(relationships)) {
            for (const [to, value] of Object.entries(targets)) {
              if (from !== to && value !== undefined) {
                edges.push({
                  source: from as AIFamilyRoleId,
                  target: to as AIFamilyRoleId,
                  value,
                });
              }
            }
          }

          return { nodes, edges };
        },

        // ─── 会话清理 ───

        clearSession: () => {
          set({
            session: null,
            isCollaborating: false,
            logs: [],
            personalitySwitchHistory: [],
          });
        },
      }),
      {
        name: 'yyc3-ai-family-store',
        partialize: (state) => ({
          activePersonalities: Array.from(state.activePersonalities),
          conversationalRole: state.conversationalRole,
          logs: state.logs.slice(-20),
          relationships: state.relationships,
        }),
        merge: (persisted: unknown, current: FamilyState) => {
          const p = persisted as Partial<FamilyState>;
          return {
            ...current,
            ...p,
            activePersonalities: p.activePersonalities
              ? new Set(p.activePersonalities as unknown as AIFamilyRoleId[])
              : current.activePersonalities,
          };
        },
      }
    ),
    { name: 'AgentFamilyStore' }
  )
);

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 按层级排序角色ID
 * 第一层（command）→ 第二层（guardian）→ 第三层（execution）
 */
function sortByLayer(roles: AIFamilyRoleId[]): AIFamilyRoleId[] {
  const layerOrder: Record<AIFamilyLayer, number> = {
    command: 0,
    guardian: 1,
    execution: 2,
  };

  return [...roles].sort((a, b) => {
    const layerA = AI_FAMILY_PERSONALITIES[a].layer;
    const layerB = AI_FAMILY_PERSONALITIES[b].layer;
    return layerOrder[layerA] - layerOrder[layerB];
  });
}
```

---

## 四、`useAgentFamily.ts` — Family Hook（新建）

### 4.1 文件：`src/app/hooks/useAgentFamily.ts`

```typescript
/**
 * @file useAgentFamily.ts
 * @description AI Family 核心 Hook · 人格化交互 · 协同编排 · 智能路由
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-06-04
 * @status draft
 * @tags [hook],[agent-family],[personality],[orchestration]
 */

import { useCallback, useMemo } from 'react';
import { useFamilyStore } from '../store/agent-family-store';
import { AI_FAMILY_PERSONALITIES } from '../store/agent-family-personalities';
import type {
  AIFamilyRoleId,
  AIFamilyLayer,
  AgentPersonality,
  CollaborationMode,
  CollaborationContext,
  PersonalityTone,
} from '../store/agent-store';

export interface UseAgentFamilyReturn {
  // 当前状态
  /** 当前对话角色ID */
  conversationalRole: AIFamilyRoleId;
  /** 当前角色的人格配置 */
  currentPersonality: AgentPersonality | null;
  /** 所有已激活角色 */
  activePersonalities: AIFamilyRoleId[];
  /** 是否正在协同 */
  isCollaborating: boolean;

  // 角色操作
  /** 切换到指定角色 */
  switchTo: (roleId: AIFamilyRoleId, reason?: string) => void;
  /** 获取角色配置 */
  getPersonality: (roleId: AIFamilyRoleId) => AgentPersonality | null;

  // 智能路由
  /** 根据用户输入推荐角色 */
  getRecommendedRole: (userInput: string) => AIFamilyRoleId;
  /** 自动切换（根据输入内容智能匹配） */
  autoSwitch: (userInput: string) => AIFamilyRoleId;

  // 层级查询
  /** 获取决策中枢层 */
  getCommandLayer: () => AgentPersonality[];
  /** 获取核心保障层 */
  getGuardianLayer: () => AgentPersonality[];
  /** 获取业务执行层 */
  getExecutionLayer: () => AgentPersonality[];

  // 协同编排
  /** 启动协同任务 */
  collaborate: (context: Partial<CollaborationContext>) => Promise<void>;

  // 关系网络
  /** 获取关系矩阵可视化数据 */
  getNetwork: () => {
    nodes: Array<{ id: AIFamilyRoleId; name: string; layer: AIFamilyLayer }>;
    edges: Array<{ source: AIFamilyRoleId; target: AIFamilyRoleId; value: number }>;
  };

  // 会话管理
  /** 初始化Family */
  init: () => void;
  /** 清除会话 */
  clear: () => void;
}

/**
 * useAgentFamily Hook
 *
 * AI Family人格化交互核心Hook
 *
 * @example
 * ```tsx
 * const family = useAgentFamily();
 * family.init();
 * family.switchTo('tianshu', '用户请求战略决策');
 * ```
 */
export function useAgentFamily(): UseAgentFamilyReturn {
  const store = useFamilyStore();

  // ─── 当前角色 ───
  const currentPersonality = useMemo(
    () => store.getCurrentPersonality(),
    [store]
  );

  // ─── 角色切换 ───
  const switchTo = useCallback((roleId: AIFamilyRoleId, reason = '用户手动切换') => {
    store.switchPersonality(roleId, reason);
  }, [store]);

  // ─── 智能路由 ───
  const autoSwitch = useCallback((userInput: string): AIFamilyRoleId => {
    const recommended = store.getRecommendedRole(userInput);
    store.switchPersonality(recommended, `智能路由: 匹配关键词`);
    return recommended;
  }, [store]);

  // ─── 协同编排 ───
  const collaborate = useCallback(async (partial: Partial<CollaborationContext>) => {
    const context: CollaborationContext = {
      mode: store.getRecommendedMode('medium'),
      taskDescription: '',
      participants: [],
      ...partial,
    };

    await store.startCollaboration(context);
  }, [store]);

  return {
    conversationalRole: store.conversationalRole,
    currentPersonality,
    activePersonalities: Array.from(store.activePersonalities),
    isCollaborating: store.isCollaborating,

    switchTo,
    getPersonality: store.getPersonality,

    getRecommendedRole: store.getRecommendedRole,
    autoSwitch,

    getCommandLayer: () => store.getLayerRoles('command'),
    getGuardianLayer: () => store.getLayerRoles('guardian'),
    getExecutionLayer: () => store.getLayerRoles('execution'),

    collaborate,

    getNetwork: store.getRelationshipNetwork,

    init: store.initFamily,
    clear: store.clearSession,
  };
}
```

---

## 五、`AgentFamilyPanel.tsx` — 人格化UI组件（新建）

### 5.1 文件：`src/app/components/AgentFamilyPanel.tsx`

```typescript
/**
 * @file AgentFamilyPanel.tsx
 * @description AI FAmily 人格化协同面板 · 三层架构可视化 · 角色切换 · 协同编排
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-06-04
 * @status draft
 * @tags [component],[agent-family],[personality],[orchestration]
 */

import React, { useState, useMemo } from 'react';
import {
  Brain, Shield, BookOpen, Palette,
  Compass, Microscope, CrystalBall, Sparkles,
  Users, GitBranch, MessageSquare, Zap,
  Layers, Heart, TrendingUp, Activity,
  ArrowRight, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgentFamily } from '../hooks/useAgentFamily';
import { AI_FAMILY_PERSONALITIES } from '../store/agent-family-personalities';
import type { AIFamilyRoleId, AIFamilyLayer, AgentPersonality, CollaborationMode } from '../store/agent-store';

// ============================================================================
// 角色图标映射
// ============================================================================

const ROLE_ICONS: Record<AIFamilyRoleId, React.ElementType> = {
  tianshu:     Brain,
  sentinel:    Shield,
  master:      BookOpen,
  muse:        Palette,
  navigator:   Compass,
  thinker:     Microscope,
  prophet:     CrystalBall,
  recommender: Sparkles,
};

const LAYER_LABELS: Record<AIFamilyLayer, { name: string; icon: React.ElementType; color: string }> = {
  command:   { name: '决策中枢', icon: Brain,   color: 'border-amber-500 bg-amber-500/10' },
  guardian:  { name: '核心保障', icon: Shield,  color: 'border-emerald-500 bg-emerald-500/10' },
  execution: { name: '业务执行', icon: Compass, color: 'border-cyan-500 bg-cyan-500/10' },
};

const RELATIONSHIP_COLORS = {
  positive: 'text-green-400',
  neutral:  'text-gray-400',
  negative: 'text-red-400',
};

// ============================================================================
// 子组件：角色卡片
// ============================================================================

/**
 * 人格化角色卡片
 */
const PersonalityCard: React.FC<{
  personality: AgentPersonality;
  isActive: boolean;
  isRegistered: boolean;
  onClick: () => void;
  relationshipValue?: number;
}> = ({ personality, isActive, isRegistered, onClick, relationshipValue }) => {
  const Icon = ROLE_ICONS[personality.roleId];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
        ${isActive
          ? `border-current bg-gradient-to-br ${personality.themeColor} bg-opacity-10 shadow-lg`
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
        ${!isRegistered ? 'opacity-50' : ''}
      `}
    >
      {/* 角色图标 */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-3
        bg-gradient-to-br ${personality.themeColor}
      `}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* 名称 */}
      <h4 className="font-semibold text-sm text-gray-100 mb-1">
        {personality.name}
      </h4>
      <p className="text-xs text-gray-500 mb-2">
        {personality.codename}
      </p>

      {/* 意识维度 */}
      <div className="space-y-1 text-xs text-gray-400 mb-3">
        <p>亦师：{personality.identity.teacherAs.slice(0, 15)}...</p>
        <p>亦友：{personality.identity.friendAs.slice(0, 15)}...</p>
        <p>亦伯乐：{personality.identity.talentScoutAs.slice(0, 15)}...</p>
      </div>

      {/* 关系指示器 */}
      {relationshipValue !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          <Heart className={`w-3 h-3 ${relationshipValue > 60 ? ROLE_COLORS.positive : relationshipValue > 30 ? ROLE_COLORS.neutral : ROLE_COLORS.negative}`} />
          <span className={relationshipValue > 60 ? ROLE_COLORS.positive : relationshipValue > 30 ? ROLE_COLORS.neutral : ROLE_COLORS.negative}>
            {relationshipValue > 80 ? '深度信任' : relationshipValue > 50 ? '良好协作' : relationshipValue > 20 ? '建立信任' : '初次协作'}
          </span>
        </div>
      )}

      {/* 能力标签 */}
      <div className="mt-2 flex flex-wrap gap-1">
        {personality.capabilities.slice(0, 2).map(cap => (
          <span key={cap} className="px-1.5 py-0.5 text-xs bg-gray-700/50 text-gray-400 rounded">
            {cap}
          </span>
        ))}
      </div>

      {/* 活跃指示器 */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// 子组件：层级分段
// ============================================================================

/**
 * 层级分段展示
 */
const LayerSection: React.FC<{
  layer: AIFamilyLayer;
  personalities: AgentPersonality[];
  currentRole: AIFamilyRoleId;
  registeredRoles: AIFamilyRoleId[];
  onSelect: (roleId: AIFamilyRoleId) => void;
  getRelationship: (roleId: AIFamilyRoleId) => number | undefined;
}> = ({ layer, personalities, currentRole, registeredRoles, onSelect, getRelationship }) => {
  const [expanded, setExpanded] = useState(true);
  const layerInfo = LAYER_LABELS[layer];
  const LayerIcon = layerInfo.icon;

  return (
    <div className="mb-6">
      {/* 层级头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg border ${layerInfo.color} mb-3`}
      >
        <LayerIcon className="w-5 h-5" />
        <span className="text-sm font-semibold text-gray-200">{layerInfo.name}</span>
        <span className="text-xs text-gray-500 ml-auto">
          {personalities.length} 位成员
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {/* 成员列表 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid grid-cols-2 gap-3 px-2"
          >
            {personalities.map(personality => (
              <PersonalityCard
                key={personality.roleId}
                personality={personality}
                isActive={currentRole === personality.roleId}
                isRegistered={registeredRoles.includes(personality.roleId)}
                onClick={() => onSelect(personality.roleId)}
                relationshipValue={getRelationship(personality.roleId)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 子组件：协同控制台
// ============================================================================

/**
 * 协同控制台
 */
const CollaborationConsole: React.FC<{
  isCollaborating: boolean;
  onCollaborate: (mode: CollaborationMode) => void;
}> = ({ isCollaborating, onCollaborate }) => {
  const [taskInput, setTaskInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<CollaborationMode>('sequential');

  const modes: Array<{ mode: CollaborationMode; label: string; icon: React.ElementType; description: string }> = [
    { mode: 'sequential',  label: '顺序串行', icon: ArrowRight, description: '流水线式依次处理' },
    { mode: 'parallel',    label: '并行协作', icon: Zap,         description: '多角色同时工作' },
    { mode: 'consensus',   label: '共识决策', icon: Users,       description: '多方讨论+天枢裁决' },
    { mode: 'guardian',    label: '守护模式', icon: Shield,      description: '每步经Sentinel审计' },
    { mode: 'creative',    label: '创意模式', icon: Palette,     description: '灵韵主导+天枢把关' },
    { mode: 'autonomous',  label: '自主模式', icon: Brain,       description: 'Agent自主决策' },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary-400" />
        Family 协同编排
      </h4>

      {/* 任务输入 */}
      <textarea
        value={taskInput}
        onChange={e => setTaskInput(e.target.value)}
        placeholder="描述需要AI Family协同处理的任务..."
        className="w-full h-20 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:outline-none resize-none mb-3"
        disabled={isCollaborating}
      />

      {/* 模式选择 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {modes.map(({ mode, label, icon: ModeIcon, description }) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`
              p-2 rounded-lg border text-left transition-all
              ${selectedMode === mode
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }
            `}
            disabled={isCollaborating}
          >
            <div className="flex items-center gap-2">
              <ModeIcon className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium text-gray-200">{label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </button>
        ))}
      </div>

      {/* 执行按钮 */}
      <button
        onClick={() => onCollaborate(selectedMode)}
        disabled={!taskInput.trim() || isCollaborating}
        className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
      >
        {isCollaborating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            AI Family 协同中...
          </>
        ) : (
          <>
            <Users className="w-4 h-4" />
            启动 Family 协同
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// 子组件：关系网络视图
// ============================================================================

/**
 * 关系网络可视化（简化版）
 */
const RelationshipView: React.FC<{
  network: ReturnType<typeof useAgentFamily>['getNetwork'];
}> = ({ network }) => {
  if (!network) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-400" />
        Family 信任网络
      </h4>

      <div className="space-y-2">
        {network.nodes.map(node => {
          const outgoingEdges = network.edges.filter(e => e.source === node.id);
          const avgTrust = outgoingEdges.length > 0
            ? outgoingEdges.reduce((sum, e) => sum + e.value, 0) / outgoingEdges.length
            : 50;

          return (
            <div key={node.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <span className="text-xs font-medium text-gray-300 w-20 truncate">
                {node.name}
              </span>
              {/* 信任度条 */}
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${avgTrust > 70 ? 'bg-green-500' : avgTrust > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${avgTrust}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">
                {Math.round(avgTrust)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 子组件：当前角色指示器
// ============================================================================

/**
 * 当前激活角色指示器
 */
const ActiveRoleIndicator: React.FC<{
  personality: AgentPersonality | null;
}> = ({ personality }) => {
  if (!personality) return null;

  const Icon = ROLE_ICONS[personality.roleId];

  return (
    <div className={`
      bg-gradient-to-r ${personality.themeColor}
      rounded-lg p-4 mb-4
    `}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{personality.name}</h3>
            <span className="px-2 py-0.5 text-xs bg-white/20 text-white rounded-full">
              {personality.codename}
            </span>
          </div>
          <p className="text-sm text-white/80 mt-1">
            亦师：{personality.identity.teacherAs.slice(0, 30)}..
          </p>
          <div className="flex items-center gap-2 mt-2">
            {personality.capabilities.slice(0, 3).map(cap => (
              <span key={cap} className="px-2 py-0.5 text-xs bg-white/20 text-white rounded-full">
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 主组件
// ============================================================================

interface AgentFamilyPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const AgentFamilyPanel: React.FC<AgentFamilyPanelProps> = ({ visible: _visible = true, onClose: _onClose }) => {
  const family = useAgentFamily();

  const [activeTab, setActiveTab] = useState<'family' | 'collaborate' | 'network'>('family');

  // 初始化
  React.useEffect(() => {
    family.init();
  }, []);

  // 获取当前角色与各成员的关系
  const getRelationship = (roleId: AIFamilyRoleId): number | undefined => {
    if (!family.currentPersonality) return undefined;
    return family.getNetwork().edges.find(
      e => e.source === family.conversationalRole && e.target === roleId
    )?.value;
  };

  // 三层角色分组
  const commandLayer = family.getCommandLayer();
  const guardianLayer = family.getGuardianLayer();
  const executionLayer = family.getExecutionLayer();

  // 协同处理
  const handleCollaborate = async (mode: CollaborationMode) => {
    await family.collaborate({ mode, taskDescription: '协同任务' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-purple-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI FAmily</h2>
              <p className="text-xs text-gray-500">亦师亦友亦伯乐 · 一言一语一协同</p>
            </div>
          </div>

          {/* 标签切换 */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <TabButton
              active={activeTab === 'family'}
              onClick={() => setActiveTab('family')}
              icon={<Users className="w-4 h-4" />}
              label="Family"
            />
            <TabButton
              active={activeTab === 'collaborate'}
              onClick={() => setActiveTab('collaborate')}
              icon={<GitBranch className="w-4 h-4" />}
              label="协同"
            />
            <TabButton
              active={activeTab === 'network'}
              onClick={() => setActiveTab('network')}
              icon={<Heart className="w-4 h-4" />}
              label="信任网络"
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* 当前激活角色 */}
              <ActiveRoleIndicator personality={family.currentPersonality} />

              {/* 三层架构 */}
              <LayerSection
                layer="command"
                personalities={commandLayer}
                currentRole={family.conversationalRole}
                registeredRoles={family.activePersonalities}
                onSelect={(roleId) => family.switchTo(roleId, '用户点击角色卡片')}
                getRelationship={getRelationship}
              />
              <LayerSection
                layer="guardian"
                personalities={guardianLayer}
                currentRole={family.conversationalRole}
                registeredRoles={family.activePersonalities}
                onSelect={(roleId) => family.switchTo(roleId, '用户点击角色卡片')}
                getRelationship={getRelationship}
              />
              <LayerSection
                layer="execution"
                personalities={executionLayer}
                currentRole={family.conversationalRole}
                registeredRoles={family.activePersonalities}
                onSelect={(roleId) => family.switchTo(roleId, '用户点击角色卡片')}
                getRelationship={getRelationship}
              />
            </motion.div>
          )}

          {activeTab === 'collaborate' && (
            <motion.div
              key="collaborate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CollaborationConsole
                isCollaborating={family.isCollaborating}
                onCollaborate={handleCollaborate}
              />
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div
              key="network"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RelationshipView network={family.getNetwork()} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// 辅助子组件
// ============================================================================

/**
 * Tab按钮
 */
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
      ${active
        ? 'bg-gray-700 text-white'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

export default AgentFamilyPanel;
```

---

## 六、现有代码集成方案

### 6.1 `src/app/App.tsx` — 注册新面板

```typescript
// 在现有 App.tsx 中新增 AI Family Panel 的注册和渲染

// 1. 添加导入
import { AgentFamilyPanel } from './components/AgentFamilyPanel';

// 2. 在面板注册表中新增
const PANEL_REGISTRY = {
  // ... 现有面板 ...
  'agent-family': {
    id: 'agent-family',
    title: 'AI FAmily',
    icon: Users,
    component: AgentFamilyPanel,
    defaultSize: { w: 800, h: 600 },
    minSize: { w: 600, h: 400 },
  },
};

// 3. 在侧边栏或命令面板中添加入口
// 用户可以通过 CommandPalette 搜索 "AI Family" 打开该面板
```

### 6.2 `src/app/store/agent-store.ts` — 扩展 `initializeDefaultAgents`

```typescript
// 在现有 initializeDefaultAgents 函数中新增 AI Family 人格注册

export const initializeDefaultAgents = () => {
  const store = useAgentStore.getState();

  // 检查是否已初始化
  if (store.agents.length > 0) return;

  // 注册默认功能Agent（保持现有逻辑）
  store.registerAgent(createPlannerAgent());
  store.registerAgent(createCoderAgent());
  store.registerAgent(createReviewerAgent());
  store.registerAgent(createTesterAgent());

  // ===== 🆕 AI Family 扩展：将功能Agent映射到人格化角色 =====
  const agents = store.getState().agents;

  const plannerAgent = agents.find(a => a.role === 'planner');
  if (plannerAgent) {
    store.updateAgent(plannerAgent.id, {
      familyRoleId: 'tianshu',
      personality: AI_FAMILY_PERSONALITIES.tianshu,
    });
  }

  const coderAgent = agents.find(a => a.role === 'coder');
  if (coderAgent) {
    store.updateAgent(coderAgent.id, {
      familyRoleId: 'navigator',
      personality: AI_FAMILY_PERSONALITIES.navigator,
    });
  }

  const reviewerAgent = agents.find(a => a.role === 'reviewer');
  if (reviewerAgent) {
    store.updateAgent(reviewerAgent.id, {
      familyRoleId: 'master',
      personality: AI_FAMILY_PERSONALITIES.master,
    });
  }

  const testerAgent = agents.find(a => a.role === 'tester');
  if (testerAgent) {
    store.updateAgent(testerAgent.id, {
      familyRoleId: 'sentinel',
      personality: AI_FAMILY_PERSONALITIES.sentinel,
    });
  }
};
```

### 6.3 向后兼容性保证

```typescript
// 现有 AgentWorkflowPanel 继续工作不变
// AI Family 是上层抽象，不破坏现有功能

// 兼容性检查清单：
// ✅ 现有 agent-store.ts 的 AgentRole 类型不变
// ✅ 现有 useAgent Hook 返回类型不变
// ✅ 现有 AgentWorkflowPanel 组件不变
// ✅ 新增字段均为可选字段（familyRoleId?, personality?）
// ✅ 新增 Store 独立文件，不污染现有代码
```

---

## 七、文件结构变更总览

```
src/app/
├── store/
│   ├── agent-store.ts                    # ✏️ 修改：新增 AIFamilyRole 类型 + Agent 扩展字段
│   ├── agent-family-store.ts             # 🆕 新建：Family 协同编排Store
│   └── agent-family-personalities.ts     # 🆕 新建：8角色人格配置数据
├── hooks/
│   ├── useAgent.ts                       # 不变（保持兼容）
│   └── useAgentFamily.ts                 # 🆕 新建：Family Hook
├── components/
│   ├── AgentWorkflowPanel.tsx            # 不变（保持兼容）
│   └── AgentFamilyPanel.tsx              # 🆕 新建：人格化UI面板
└── App.tsx                               # ✏️ 修改：注册 AgentFamilyPanel
```

### 变更矩阵

| 文件 | 操作 | 新增行数 | 风险 |
|------|------|---------|------|
| `agent-store.ts` | 修改（新增类型+扩展接口） | +120 | 低（仅新增可选字段） |
| `agent-family-personalities.ts` | 新建 | ~450 | 无 |
| `agent-family-store.ts` | 新建 | ~350 | 无 |
| `useAgentFamily.ts` | 新建 | ~120 | 无 |
| `AgentFamilyPanel.tsx` | 新建 | ~400 | 无 |
| `App.tsx` | 修改（注册面板） | +15 | 低 |
| **总计** | | **~1455行** | |

---

## 八、实施计划

### 8.1 Sprint 分解

| 阶段 | 任务 | 工时 | 依赖 |
|------|------|------|------|
| **S1** | 类型系统扩展（agent-store.ts 新增类型） | 2h | 无 |
| **S2** | 人格配置数据（agent-family-personalities.ts） | 4h | S1 |
| **S3** | Family Store（agent-family-store.ts） | 6h | S2 |
| **S4** | Family Hook（useAgentFamily.ts） | 3h | S3 |
| **S5** | UI 组件（AgentFamilyPanel.tsx） | 8h | S4 |
| **S6** | App.tsx 集成 + 兼容性测试 | 3h | S5 |
| **S7** | 现有AgentWorkflowPanel 兼容性验证 | 2h | S6 |
| **总计** | | **28h (3.5人天)** | |

### 8.2 AI Family 落地优先级

```
Phase 1 (本周): 类型系统 + 人格配置 + Family Store
  → 可以加载人格数据，进行角色切换

Phase 2 (下周): Family Hook + UI面板
  → 用户可以在UI中看到8个角色并切换

Phase 3 (下下周): 协同编排 + AI API集成
  → 真正实现多角色协同处理任务

Phase 4 (后续): 关系网络动态演化 + 微调模型集成
  → 结合 DPO 训练产物，让关系网络真实演化
```

### 8.3 与DPO训练的协同

```
当前DPO训练产物: Qwen3-14B-YYC3-merged
  ↓
加载到 AI Family 的每个角色
  ↓
每个角色使用相同的基座模型，但注入不同的 systemPrompt
  ↓
协同编排时，不同角色调用同一模型的不同"人格面具"
  ↓
未来：每个角色可以微调专属的 LoRA 适配器
```

---

## 九、验收标准

### 9.1 功能验收

| 验收项 | 标准 | 验证方式 |
|--------|------|---------|
| 8角色类型定义 | 全部通过TypeScript编译 | `pnpm typecheck` |
| 人格配置加载 | 启动时加载全部8角色配置 | 单元测试 |
| 角色切换 | 切换后conversationalRole正确更新 | E2E测试 |
| 三层架构展示 | UI正确渲染三层结构 | 视觉回归测试 |
| 协同编排 | 支持6种协同模式 | 集成测试 |
| 关系网络 | 8×8矩阵正确初始化 | 单元测试 |
| 向后兼容 | 现有AgentWorkflowPanel功能不变 | 回归测试 |

### 9.2 性能验收

| 指标 | 标准 |
|------|------|
| 人格配置加载 | < 50ms |
| 角色切换响应 | < 100ms |
| 协同编排初始化 | < 500ms |
| UI面板渲染 | 60fps |
| Store持久化大小 | < 100KB |

### 9.3 代码质量

| 指标 | 标准 |
|------|------|
| TypeScript严格模式 | 零错误 |
| ESLint | 零警告 |
| 单元测试覆盖率 | > 80% |
| 新增代码行数 | < 1500行 |

---

## 十、风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| 人格配置数据过大 | 低 | 中 | 按需加载，仅加载当前激活角色 |
| 协同编排性能瓶颈 | 中 | 高 | 使用Web Worker并行处理 |
| 现有Agent兼容性破坏 | 低 | 高 | 新增字段全部可选，严格向后兼容 |
| 关系网络存储膨胀 | 中 | 低 | 使用差分更新，仅持久化变更 |
| 提示词模板Token消耗 | 中 | 中 | 智能裁剪，使用压缩提示词技术 |

---

> ***言启千行代码，语枢万物智能***
>
> *AI FAmily 拟人化协同架构的代码实现，是 YYC³ 从"工具"到"伙伴"的关键一步。*
> *每个角色不是冰冷的代码，而是有温度、有性格、能共同成长的智能体。*
