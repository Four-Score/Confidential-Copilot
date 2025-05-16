"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button_d"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input_d"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card_d"
import { DocumentChatbot } from "@/components/document/document-chatbot"
import { Download, Save, Eye, Edit2, Settings, ChevronDown, ChevronUp } from "lucide-react"
import type { DocumentType } from "@/lib/types"
import ReactMarkdown from 'react-markdown'

interface DocumentEditorProps {
  document: DocumentType
  onSave: (document: DocumentType) => void
}

export function DocumentEditor({ document: docData, onSave }: DocumentEditorProps) {
  const [activeTab, setActiveTab] = useState("edit")
  const [documentTitle, setDocumentTitle] = useState(docData.title)
  const [documentContent, setDocumentContent] = useState(docData.content)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Ensure content is treated as markdown
  useEffect(() => {
    // If the content is in HTML format (from older documents), convert it to markdown
    if (docData.content && docData.content.startsWith("<")) {
      // Basic conversion - in a real app, you'd want a proper HTML to Markdown converter
      console.log("Legacy HTML document detected - treating as markdown")
    }
  }, [docData.content])

  const handleSave = () => {
    const updatedDocument = {
      ...docData,
      title: documentTitle,
      content: documentContent,
      lastModified: new Date().toISOString(),
    }
    onSave(updatedDocument)
  }

  const handleDownload = () => {
    const element = window.document.createElement("a")
    const file = new Blob([documentContent], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = `${documentTitle}.md`
    window.document.body.appendChild(element)
    element.click()
    window.document.body.removeChild(element)
  }

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      const textarea = editorRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const content = textarea.value

      setDocumentContent(content.substring(0, start) + text + content.substring(end))

      // Set cursor position after inserted text
      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = start + text.length
          textarea.focus()
        }
      }, 0)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{documentTitle}</h2>
            <p className="text-muted-foreground">
              {docData.template} • {docData.pages} pages
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" /> Preview
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-title">Document Title</Label>
                <Input id="document-title" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-content">Content (Markdown)</Label>
                <Textarea
                  id="document-content"
                  ref={editorRef}
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="pt-4">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <h1>{documentTitle}</h1>
                  
                  {/* Render markdown content instead of HTML */}
                  <div className="markdown-preview">
                    <ReactMarkdown>{documentContent}</ReactMarkdown>
                  </div>

                  {docData.referencedDocuments && docData.referencedDocuments.length > 0 && (
                    <div className="mt-8 p-4 border rounded-md bg-blue-50">
                      <h3 className="text-[#4287f5]">Referenced Documents</h3>
                      <ul>
                        {docData.referencedDocuments.map((doc) => (
                          <li key={doc.id} className="text-sm">
                            {doc.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="pt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-template">Template</Label>
                  <Input id="document-template" defaultValue={docData.template} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-format">Format</Label>
                  <Input id="document-format" defaultValue="Markdown" disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-pages">Pages</Label>
                  <Input
                    id="document-pages"
                    type="number"
                    defaultValue={docData.pages}
                    onChange={(e) => {
                      docData.pages = Number.parseInt(e.target.value)
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-created">Created</Label>
                  <Input id="document-created" defaultValue={new Date(docData.createdAt).toLocaleString()} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <div className="sticky top-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Document Assistant</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)} className="lg:hidden">
              {isChatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className={`${isChatOpen ? "block" : "hidden lg:block"}`}>
            <DocumentChatbot document={docData} onInsertText={insertTextAtCursor} />
          </div>
        </div>
      </div>
    </div>
  )
}