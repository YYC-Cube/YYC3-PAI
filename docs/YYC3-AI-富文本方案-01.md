# YYC3 AI 富文本方案

# 一、前置依赖安装

```bash
npm i react-markdown remark-gfm rehype-katex remark-mermaid mermaid katex @tiptap/react @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-image @shikijs/rehype @tailwindcss/typography
```

## tailwind.config.js 追加配置

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  plugins: [
    require('@tailwindcss/typography')
  ]
}
```

# 二、AI消息富文本渲染组件 `src/components/Chat/AiMessageRender.tsx`

```tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMermaid from 'remark-mermaid'
import rehypeKatex from 'rehype-katex'
import { codeBlockPlugin } from './CodeBlockWrap' // 代码块操作按钮内置

interface Props {
  content: string
  onInsertEditor?: (code: string) => void // 代码回填IDE回调
}

export default function AiMessageRender({ content, onInsertEditor }: Props) {
  return (
    <div className="prose dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMermaid, { mermaidConfig: { theme: 'base' } }]]}
        rehypePlugins={[rehypeKatex, [codeBlockPlugin, { onInsertEditor }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

## 配套代码块拦截插件 `src/components/Chat/CodeBlockWrap.tsx`

```tsx
import type { Plugin } from 'rehype'
import { visit } from 'unist-util-visit'

type Opt = { onInsertEditor?: (code: string) => void }
export const codeBlockPlugin: Plugin<[Opt]> = (opt) => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        const codeText = (node.children[0].children?.[0]?.value ?? '') as string
        const lang = ((node.children[0].properties.className || []) as string[])
          .find(s => s.startsWith('language-'))?.replace('language-','') || 'txt'

        node.properties.className = 'relative group'
        node.children.unshift({
          type: 'element',
          tagName: 'div',
          properties: { className: 'absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity' },
          children: [
            {
              type:'element',tagName:'button',properties:{
                className:'px-2 py-1 bg-gray-500 text-white rounded text-xs',
                onClick:`navigator.clipboard.writeText(\`${codeText.replace('`','\\`')}\`)`
              },children:[{type:'text',value:'复制'}]
            },
            {
              type:'element',tagName:'button',properties:{
                className:'px-2 py-1 bg-blue-600 text-white rounded text-xs',
                onClick:`window.__insertCode && window.__insertCode(\`${codeText.replace('`','\\`')}\`)`
              },children:[{type:'text',value:'填入编辑器'}]
            }
          ]
        })
      }
    })
  }
}
```

# 三、双模输入框组件（MD快捷输入 + Tiptap富文本切换）`src/components/Chat/ChatInputBox.tsx`

```tsx
import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'

interface Props {
  onSend: (mdText: string) => void
}

export default function ChatInputBox({ onSend }: Props) {
  const [mode, setMode] = useState<'md'|'rich'>('md')
  const [mdVal, setMdVal] = useState('')

  const editor = useEditor({
    extensions: [StarterKit, Table, TableRow, TableCell, Image],
    content: '',
    editorProps: { attributes: { class: 'min-h-[120px] p-2 border rounded dark:border-gray-600' } }
  })

  // 富文本转MD简易输出（生产可接入turndown）
  const getMarkdown = useCallback(() => {
    if(mode === 'md') return mdVal
    return editor?.getHTML() || ''
  },[mode,mdVal,editor])

  const handleSend = () => {
    const text = getMarkdown()
    if(!text.trim()) return
    onSend(text)
    setMdVal('')
    editor?.commands.clearContent()
  }

  // 快捷插入MD语法
  const insertMd = (s: string) => {
    setMdVal(prev => prev + s)
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button onClick={()=>setMode('md')} className={`px-2 rounded ${mode==='md'?'bg-blue-500 text-white':'border'}`}>Markdown</button>
          <button onClick={()=>setMode('rich')} className={`px-2 rounded ${mode==='rich'?'bg-blue-500 text-white':'border'}`}>富文本</button>
        </div>
        {mode==='md' && (
          <div className="flex gap-1">
            <button onClick={()=>insertMd('**粗体**')} className="px-1 border rounded">B</button>
            <button onClick={()=>insertMd('`行内代码`')} className="px-1 border rounded">Code</button>
            <button onClick={()=>insertMd('\n```ts\n\n```\n')} className="px-1 border rounded">代码块</button>
            <button onClick={()=>insertMd('\n|a|b|\n|-|-|\n|1|2|\n')} className="px-1 border rounded">表格</button>
          </div>
        )}
      </div>

      {mode === 'md' ? (
        <textarea
          className="w-full min-h-[120px] p-2 border rounded dark:border-gray-600 bg-transparent"
          value={mdVal}
          onChange={e=>setMdVal(e.target.value)}
          placeholder="支持Markdown，粘贴图片自动base64..."
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <div className="flex justify-end mt-2">
        <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded">发送</button>
      </div>
    </div>
  )
}
```

# 四、聊天页面最简调用示例

```tsx
import { useState } from 'react'
import AiMessageRender from '@/components/Chat/AiMessageRender'
import ChatInputBox from '@/components/Chat/ChatInputBox'

type Msg = {role:'user'|'ai',content:string}
export default function ChatPage() {
  const [list, setList] = useState<Msg[]>([])
  window.__insertCode = (c:string)=>{
    // 填入Monaco编辑器逻辑在此处
    console.log('回填代码',c)
  }

  const sendMsg = (txt:string)=>{
    setList(p=>[...p,{role:'user',content:txt}])
    // 此处对接LLM请求，拿到aiContent后push列表
  }

  return <>
    <div className="space-y-4 mb-6 max-h-[70vh] overflow-auto p-2">
      {list.map((item,i)=>(
        <div key={i} className={item.role==='ai'?'bg-gray-100 dark:bg-gray-800 p-3 rounded':'p-3'}>
          <AiMessageRender content={item.content}/>
        </div>
      ))}
    </div>
    <ChatInputBox onSend={sendMsg}/>
  </>
}
```

# 五、落地迭代顺序

1. 先接入`AiMessageRender`，实现**代码高亮、表格、公式、Mermaid图表**渲染
2. 接入`ChatInputBox`，完成MD/富文本双输入
3. 对接Monaco：「填入编辑器」按钮回调替换为实际光标插入代码
4. 优化：粘贴图片自动转Base64、消息导出MD/PDF
