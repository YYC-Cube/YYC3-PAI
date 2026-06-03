/**
 * @file CodeBlockWrap.tsx
 * @description Rehype 插件：代码块顶部操作栏（复制 + 填入编辑器）
 * 适配 YYC³ AI-PAI 项目主题系统（useThemeStore tokens）
 */

import { visit } from 'unist-util-visit'

type Opt = { onInsertEditor?: (code: string) => void }

export const codeBlockPlugin = (_opt: Opt) => {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        const codeNode = node.children[0]
        const codeText = (codeNode.children?.[0]?.value ?? '') as string
        const classNameArr = (codeNode.properties?.className ?? []) as string[]
        const lang = classNameArr
          .find((s: string) => s.startsWith('language-'))
          ?.replace('language-', '') || 'txt'

        // 安全转义反引号用于内联 onclick
        const safeCode = codeText.replace(/`/g, '\\`').replace(/\$/g, '\\$')

        node.properties.className = 'relative group my-2 rounded-lg overflow-hidden'

        // 语言标签 + 操作栏
        node.children.unshift({
          type: 'element',
          tagName: 'div',
          properties: {
            className:
              'flex items-center justify-between px-3 py-1.5 border-b',
            style:
              'border-color: color-mix(in srgb, currentColor 15%, transparent); background: color-mix(in srgb, currentColor 5%, transparent);',
          },
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                className: 'text-xs font-mono uppercase tracking-wider opacity-60',
              },
              children: [{ type: 'text', value: lang }],
            },
            {
              type: 'element',
              tagName: 'div',
              properties: { className: 'flex gap-2' },
              children: [
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    className:
                      'text-xs px-2 py-0.5 rounded transition-all hover:opacity-80',
                    style:
                      'background: color-mix(in srgb, currentColor 12%, transparent);',
                    onClick: `navigator.clipboard.writeText(\`${safeCode}\`)`,
                    'data-action': 'copy',
                  },
                  children: [{ type: 'text', value: '复制' }],
                },
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    className:
                      'text-xs px-2 py-0.5 rounded transition-all hover:opacity-80',
                    style:
                      'background: color-mix(in srgb, currentColor 12%, transparent);',
                    onClick: `window.__insertCode && window.__insertCode(\`${safeCode}\`)`,
                    'data-action': 'insert',
                  },
                  children: [{ type: 'text', value: '填入编辑器' }],
                },
              ],
            },
          ],
        })
      }
    })
  }
}
