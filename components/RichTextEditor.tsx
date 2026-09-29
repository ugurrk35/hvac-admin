// components/RichTextEditor.tsx
"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Undo2, Redo2, Code, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react'

import { useEffect } from 'react'
const lowlight = createLowlight(all)
interface Props {
  value: string
  onChange: (value: string) => void
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: 'my-heading',
          },
        },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="border border-palette-lightBlue rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        {[
          { icon: <Bold size={16} />, cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
          { icon: <Italic size={16} />, cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
          { icon: <UnderlineIcon size={16} />, cmd: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
          { icon: <Strikethrough size={16} />, cmd: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
          { icon: <LinkIcon size={16} />, cmd: () => {
              const url = prompt("Bağlantı URL'si girin:")
              if (url && /^(https?:|mailto:|\/)/i.test(url.trim())) {
                editor.chain().focus().setLink({ href: url.trim() }).run()
              }
            }, active: editor.isActive('link') },
          { icon: <Heading1 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
          { icon: <Heading2 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { icon: <Heading3 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
          { icon: <Heading4 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive('heading', { level: 4 }) },
          { icon: <Heading5 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 5 }).run(), active: editor.isActive('heading', { level: 5 }) },
          { icon: <Heading6 size={16} />, cmd: () => editor.chain().focus().toggleHeading({ level: 6 }).run(), active: editor.isActive('heading', { level: 6 }) },
          { icon: <List size={16} />, cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
          { icon: <ListOrdered size={16} />, cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
          { icon: <Code size={16} />, cmd: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
          { icon: <ImageIcon size={16} />, cmd: () => {
              const url = prompt("Resim URL'si girin:")
              if (url && /^https?:\/\//i.test(url.trim())) {
                editor.chain().focus().setImage({ src: url.trim() }).run()
              }
            }, active: false },
          { icon: <AlignLeft size={16} />, cmd: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
          { icon: <AlignCenter size={16} />, cmd: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
          { icon: <AlignRight size={16} />, cmd: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
          { icon: <Undo2 size={16} />, cmd: () => editor.chain().focus().undo().run(), active: false },
          { icon: <Redo2 size={16} />, cmd: () => editor.chain().focus().redo().run(), active: false },
        ].map((btn, idx) => (
          <button key={idx} onClick={btn.cmd} type="button" className={toolbarBtn(btn.active)}>
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="p-3 min-h-[200px] focus:outline-none" />
    </div>
  )
}

function toolbarBtn(active: boolean) {
  return `p-1 rounded hover:bg-gray-200 ${active ? 'bg-blue-100 text-blue-700' : ''}`
}
