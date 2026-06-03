# YYC³ AI-PAI 富文本方案-03

# YYC³-Family-AI 聊天模块第五阶段全量迭代（五项功能闭环，兼容现有代码、本地持久化、PWA离线）

整体新增：**暗黑自动跟随系统、流式打字输出、多会话管理、全局消息检索、对话导出 MD/JSON**，全部本地 localStorage 存储，贴合本地优先产品定位，分步替换/新增代码。
> 依赖不变，无需额外装包，沿用已有 `uuid`、tailwind、markdown 组件。

## 一、先扩展类型定义 src/types/chat.ts

```ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  folded: boolean;
  timestamp: number;
}
// 会话结构体
export interface ChatSession {
  sid: string;          // 会话唯一id
  title: string;        // 会话标题
  createAt: number;
  updateAt: number;
  list: ChatMessage[];
}
// 主题模式
export type ThemeMode = 'system'|'light'|'dark'
```

## 二、功能1：暗黑模式自动跟随系统（全局+组件自动切换）

### 1. 新建 src/hooks/useTheme.ts（全局主题钩子）

```tsx
import { useEffect, useState } from 'react'
import { ThemeMode } from '@/types/chat'

const THEME_KEY = 'yyc3-theme-mode'

export function useTheme(){
  const [mode, setModeRaw] = useState<ThemeMode>(()=>{
    const cache = localStorage.getItem(THEME_KEY)
    return (cache as ThemeMode) || 'system'
  })
  const [isDark, setIsDark] = useState(false)

  // 跟随系统+手动切换
  useEffect(()=>{
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const calcDark = ()=>{
      if(mode === 'system') return media.matches
      return mode === 'dark'
    }
    setIsDark(calcDark())

    const handler = ()=> setIsDark(calcDark())
    media.addEventListener('change',handler)
    return ()=> media.removeEventListener('change',handler)
  },[mode])

  // html class 挂载，全局暗黑
  useEffect(()=>{
    document.documentElement.classList.toggle('dark',isDark)
  },[isDark])

  const setMode = (v:ThemeMode)=>{
    setModeRaw(v)
    localStorage.setItem(THEME_KEY,v)
  }

  return {mode,isDark,setMode}
}
```

### 2. 聊天页面顶部增加主题切换按钮

后续聊天主页面引入 `useTheme`，页面最上方渲染切换按钮：

```tsx
const {mode,isDark,setMode} = useTheme()
// dom
<div className="flex justify-between items-center">
  <h1 className="text-2xl font-bold">YYC³-Family-AI 智能编程助手</h1>
  <div className="flex gap-2">
    <button onClick={()=>setMode('system')} className={`px-2 rounded ${mode==='system'?'bg-sky-500 text-white':'border'}`}>跟随系统</button>
    <button onClick={()=>setMode('light')} className={`px-2 rounded ${mode==='light'?'bg-amber-400':'border'}`}>浅色</button>
    <button onClick={()=>setMode('dark')} className={`px-2 rounded ${mode==='dark'?'bg-gray-700 text-white':'border'}`}>暗黑</button>
  </div>
</div>
```

> tailwind 配置已开 dark:class，全局自动变色，原有所有组件 `dark:xxx` 样式自动生效。

## 三、功能2：AI流式打字机输出（分片逐字渲染，打字动画，不阻塞界面）

### 1. 新增流式自定义Hook src/hooks/useStreamText.ts

```tsx
import { useState, useEffect, useRef } from 'react'

export function useStreamText(){
  const [renderText, setRenderText] = useState('')
  const finishRef = useRef(false)

  // 开始流式填入
  const startStream = async (fullStr:string, speed:number=12)=>{
    finishRef.current = false
    setRenderText('')
    let cur = ''
    for(let i=0;i<fullStr.length;i++){
      if(finishRef.current) break
      cur += fullStr[i]
      setRenderText(cur)
      await new Promise(r=>setTimeout(r,speed))
    }
  }
  // 立刻结束流式、全量填充
  const fastFinish = (fullStr:string)=>{
    finishRef.current = true
    setRenderText(fullStr)
  }
  return {renderText,startStream,fastFinish}
}
```

### 2. 修改发送逻辑：AI返回分片流式，新增临时loading消息
>
> 原有 `fetchAIResponse` 改为模拟分片流，实际对接后端SSE/Ollama流式接口。
在ChatPage组件内：

```ts
const {renderText,startStream,fastFinish} = useStreamText()
const [streamingMsgId, setStreamingMsgId] = useState('')

// 改写handleSend
const handleSend = async (text: string) => {
  const userMsg: ChatMessage = {id:uuidv4(),role:'user',content:text,folded:false,timestamp:Date.now()}
  setMessages(p=>[...p,userMsg])
  setQuoteContent('')

  // 先插空AI消息占位
  const tempAiId = uuidv4()
  setStreamingMsgId(tempAiId)
  const emptyAi:ChatMessage={id:tempAiId,role:'ai',content:'',folded:false,timestamp:Date.now()}
  setMessages(p=>[...p,emptyAi])
  setActiveMsgId(tempAiId)

  // 模拟流式分段数据（真实项目替换为SSE/ollama stream）
  const fullRes = `## 代码示例\n\`\`\`ts\nfunction demo(){return true}\n\`\`\`\n公式：$E=mc^2$，**加粗富文本**`
  await startStream(fullRes)

  // 流式结束，替换完整内容
  setMessages(p=>p.map(item=>item.id===tempAiId ? {...item,content:fullRes,folded:fullRes.length>800}:item))
  setStreamingMsgId('')
}
```

### 3. 消息渲染兼容流式临时内容

在`ChatMessageList`渲染AI消息时：

```tsx
{msg.role === 'ai' ? (
  <AiMessageRender
    message={streamingMsgId===msg.id ? {...msg,content:renderText} : msg}
    onInsertEditor={onInsertEditor}
    onRegenerate={onRegenerate}
    onQuote={onQuote}
  />
) : ...}
```

效果：AI回复逐字打字、富文本实时动态渲染（代码块/标题/表格边输出边渲染）。

## 四、功能3：多会话管理（左侧边栏：新建/切换/删除/自动生成标题，localStorage持久化）

### 1. 新建会话管理Hook src/hooks/useSession.ts

```tsx
import { useState, useEffect } from 'react'
import { ChatSession,ChatMessage } from '@/types/chat'
import {v4 as uuidv4} from 'uuid'

const SESSION_STORE_KEY = 'yyc3-chat-sessions'

export function useChatSession(){
  const [sessionList, setSessionList] = useState<ChatSession[]>([])
  const [currentSid, setCurrentSid] = useState('')

  // 初始化读取本地存储
  useEffect(()=>{
    const raw = localStorage.getItem(SESSION_STORE_KEY)
    const arr:ChatSession[] = raw ? JSON.parse(raw) : []
    setSessionList(arr)
    // 默认选中第一条/新建会话
    if(arr.length>0) setCurrentSid(arr[0].sid)
    else createNewSession()
  },[])

  // 本地持久化存储
  const saveLocal = (list:ChatSession[])=>{
    localStorage.setItem(SESSION_STORE_KEY,JSON.stringify(list))
    setSessionList(list)
  }

  // 新建会话
  const createNewSession = ()=>{
    const sid = uuidv4()
    const newItem:ChatSession={
      sid,
      title:`会话${new Date().getMonth()+1}-${new Date().getDate()}`,
      createAt:Date.now(),
      updateAt:Date.now(),
      list:[]
    }
    const next = [...sessionList,newItem]
    saveLocal(next)
    setCurrentSid(sid)
  }

  // 删除会话
  const delSession = (sid:string)=>{
    const next = sessionList.filter(s=>s.sid!==sid)
    saveLocal(next)
    if(currentSid===sid){
      if(next.length>0) setCurrentSid(next[0].sid)
      else createNewSession()
    }
  }

  // 更新当前会话消息
  const updateCurrentMsg = (newMsgList:ChatMessage[])=>{
    const next = sessionList.map(s=>{
      if(s.sid === currentSid){
        return {...s,list:newMsgList,updateAt:Date.now(),
          // 自动取第一条用户提问作为标题
          title: newMsgList.filter(m=>m.role==='user')[0]?.content.slice(0,22) || s.title
        }
      }
      return s
    })
    saveLocal(next)
  }

  // 获取当前会话消息
  const getCurrentMsg = ()=>{
    const cur = sessionList.find(s=>s.sid===currentSid)
    return cur?.list || []
  }

  return {
    sessionList,currentSid,
    createNewSession,delSession,setCurrentSid,
    updateCurrentMsg,getCurrentMsg
  }
}
```

### 2. 页面布局改为【左侧会话侧边栏 + 右侧聊天主体】

聊天页面结构：

```tsx
const {sessionList,currentSid,createNewSession,delSession,setCurrentSid,updateCurrentMsg,getCurrentMsg} = useChatSession()
const [messages, setMessages] = useState<ChatMessage[]>(getCurrentMsg())

// 每次切换会话替换消息
useEffect(()=>{
  setMessages(getCurrentMsg())
},[currentSid])

// 消息变更自动落地到会话
useEffect(()=>{
  updateCurrentMsg(messages)
},[messages])

// DOM布局：左右分栏
<div className={`flex h-screen ${isDark?'dark bg-gray-900':'bg-white'}`}>
  {/*左侧会话栏*/}
  <div className="w-60 border-r dark:border-gray-700 p-3 flex flex-col">
    <button onClick={createNewSession} className="w-full py-2 bg-blue-500 text-white rounded mb-4">+ 新建会话</button>
    <div className="flex-1 overflow-auto space-y-2">
      {sessionList.map(ss=>(
        <div key={ss.sid} className={`flex justify-between p-2 rounded ${currentSid===ss.sid?'bg-sky-100 dark:bg-sky-900':''}`}>
          <span className="truncate flex-1 cursor-pointer" onClick={()=>setCurrentSid(ss.sid)}>{ss.title}</span>
          <button onClick={()=>delSession(ss.sid)} className="text-red-500 text-sm">×</button>
        </div>
      ))}
    </div>
  </div>
  {/*右侧聊天区（原有全部聊天内容）*/}
  <div className="flex-1 flex flex-col p-4">
    {/*原有标题+主题切换、消息列表、输入框全部放这里*/}
  </div>
</div>
```

> 特性：新建会话空对话、切换历史会话自动加载历史消息、自动用首条用户提问生成会话标题、删除会话本地同步清除，全量 localStorage 永久保存。

## 五、功能4：全局消息关键词检索（跨全部会话搜索）

### 1. 页面顶部增加搜索框

```tsx
const [searchKey, setSearchKey] = useState('')
const [searchResult, setSearchResult] = useState<{sid:string;msg:ChatMessage}[]>([])

// 搜索逻辑
const doSearch = ()=>{
  if(!searchKey.trim()){
    setSearchResult([])
    return
  }
  const res:typeof searchResult = []
  sessionList.forEach(ss=>{
    ss.list.forEach(msg=>{
      if(msg.content.toLowerCase().includes(searchKey.toLowerCase())){
        res.push({sid:ss.sid,msg})
      }
    })
  })
  setSearchResult(res)
}
// 点击搜索结果：跳转对应会话+锚定本条消息
const jumpToMsg = (sid:string,mid:string)=>{
  setCurrentSid(sid)
  setActiveMsgId(mid)
  setSearchKey('')
  setSearchResult([])
}

// dom搜索框
<div className="flex gap-2 my-3">
  <input value={searchKey} onChange={e=>setSearchKey(e.target.value)} placeholder="全局搜索对话内容..." className="border px-2 rounded flex-1 dark:bg-gray-800"/>
  <button onClick={doSearch} className="px-3 bg-blue-500 text-white rounded">搜索</button>
</div>
{searchResult.length>0 && (
  <div className="border rounded p-2 mb-3 max-h-40 overflow-auto dark:border-gray-700">
    {searchResult.map(item=>(
      <div key={item.msg.id} className="py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={()=>jumpToMsg(item.sid,item.msg.id)}>
        {item.msg.content.slice(0,60)}...
      </div>
    ))}
  </div>
)}
```

> 能力：跨所有会话全文检索，点击条目自动切会话+滚动锚定对应消息。

## 六、功能5：单会话对话导出（MD / JSON双格式，前端本地下载）

### 1. 页面增加导出按钮，封装导出函数

```tsx
// 导出为markdown
const exportToMd = ()=>{
  let md = `# YYC³-Family-AI 对话\n会话：${sessionList.find(s=>s.sid===currentSid)?.title}\n导出时间：${new Date().toLocaleString()}\n\n`
  messages.forEach(m=>{
    const role = m.role==='user'?'## 用户':'## AI'
    md += `${role}\n${m.content}\n\n`
  })
  downloadFile(`${new Date().getTime()}_chat.md`,md,'text/markdown')
}
// 导出原始JSON
const exportToJson = ()=>{
  const data = {title:sessionList.find(s=>s.sid===currentSid)?.title,messages}
  downloadFile(`${new Date().getTime()}_chat.json`,JSON.stringify(data,null,2),'application/json')
}
// 浏览器本地下载通用方法
const downloadFile = (fname:string,text:string,mime:string)=>{
  const blob = new Blob([text],{type:mime})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fname
  a.click()
  URL.revokeObjectURL(a.href)
}

// dom按钮放在输入框上方
<div className="flex gap-2 mb-2">
  <button onClick={exportToMd} className="px-2 py-1 border rounded">导出MD</button>
  <button onClick={exportToJson} className="px-2 py-1 border rounded">导出JSON</button>
</div>
```

> 纯前端生成文件，**不上传任何内容到云端**，契合本地优先隐私定位。

## 七、当前全套功能汇总（完整闭环）

1. **暗黑自动模式**：跟随系统明暗切换 / 手动锁定浅色/深色，全站组件自动适配样式、持久化配置
2. **AI流式打字**：逐字符动态渲染富文本，代码块/表格实时逐步展示，可一键快速结束动画
3. **多会话管理**：侧边栏会话列表、新建/删除/切换、自动标题、全量本地持久化
4. **全局消息检索**：跨全部会话关键词查找，点击直达对应消息+自动锚定
5. **对话导出**：一键导出 Markdown（便于文档归档）/ JSON（备份二次解析），纯前端离线生成
