// src\components\document\document-creator.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button_d"
import { Card } from "@/components/ui/card_d"
import { Input } from "@/components/ui/input_d"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, X, FileUp, Search, Zap, Plus, AlertCircle } from "lucide-react"
import { templates, sampleDocuments } from "@/lib/sample-data"
import type { DocumentType, Tool } from "@/lib/types"
import { generateDocumentContent } from "@/lib/document-generator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentLoadingScreen } from "@/components/document/document-loading-screen"

import { getGroqApiKey, saveGroqApiKey } from "@/lib/env-config"

interface DocumentCreatorProps {
  onDocumentCreated: (document: DocumentType) => void
}

export function DocumentCreator({ onDocumentCreated }: DocumentCreatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [documentName, setDocumentName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [pageCount, setPageCount] = useState("5")
  const [details, setDetails] = useState("")
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentType[]>([])
  const [groqApiKey, setGroqApiKey] = useState(getGroqApiKey() || "")
  const [error, setError] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<{
    title: string
    template: string
    preview: string
  } | null>(null)

  const tools: Tool[] = [
    { id: "internet", label: "Internet Search", icon: Search },
    { id: "research", label: "Deep Research", icon: Zap },
    { id: "analysis", label: "Content Analysis", icon: FileText },
  ]

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]))
  }

  const addDocument = (doc: DocumentType) => {
    if (!selectedDocuments.some((d) => d.id === doc.id)) {
      setSelectedDocuments((prev) => [...prev, doc])
    }
  }

  const removeDocument = (docId: string) => {
    setSelectedDocuments((prev) => prev.filter((doc) => doc.id !== docId))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newDocs: DocumentType[] = files.map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        title: file.name,
        template: "Uploaded Document",
        content: "<p>Uploaded document content</p>",
        createdAt: new Date().toISOString(),
        pages: 1,
        projectId: "project1",
        type: "uploaded",
        size: `${Math.round(file.size / 1024)} KB`,
      }))

      setSelectedDocuments((prev) => [...prev, ...newDocs])
    }
  }

  const handleCreateDocument = async () => {
    if (!documentName || !selectedTemplate) {
      setError("Document name and template are required")
      return
    }

    if (!groqApiKey) {
      setError("Groq API key is required")
      return
    }

    // Save the API key for future use
    saveGroqApiKey(groqApiKey)
    
    setIsLoading(true)
    setShowLoadingScreen(true)
    setError(null)

    try {
      const template = templates.find((t) => t.id === selectedTemplate)
      if (!template) {
        throw new Error("Selected template not found")
      }

      // Format referenced documents for the prompt
      const referencedContent = selectedDocuments
        .map((doc) => {
          return `Document Title: ${doc.title}
Content: ${doc.content ? doc.content.substring(0, 500) + (doc.content.length > 500 ? "..." : "") : "No content available"}`
        })
        .join("\n\n")

      console.log("Generating document with Groq...")
      
      // Generate content using LangChain and Groq
      const generatedContent = await generateDocumentContent({
        templateName: template.name,
        templatePurpose: template.description || "Generic document template",
        details: details || "Create a professional document following the template structure.",
        referencedDocuments: referencedContent || "No referenced documents provided.",
        apiKey: groqApiKey,
      })

      console.log("Document generation complete")

      // Create the new document
      const newDocument: DocumentType = {
        id: `doc-${Date.now()}`,
        title: documentName,
        template: template.name,
        content: generatedContent,
        createdAt: new Date().toISOString(),
        pages: Number.parseInt(pageCount),
        projectId: "project1",
        referencedDocuments: selectedDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
        })),
      }

      // Keep the loading screen visible for at least a minimum amount of time (22 seconds)
      // This ensures the loading animation completes even if the API responds quickly
      const minLoadingTime = 22000
      const startTime = Date.now()
      const elapsedTime = Date.now() - startTime
      
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
      }

      onDocumentCreated(newDocument)
    } catch (err) {
      console.error("Error creating document:", err)
      setError(err instanceof Error ? err.message : "Failed to generate document. Please check your API key and try again.")
    } finally {
      setShowLoadingScreen(false)
      setIsLoading(false)
    }
  }

  const updatePreview = () => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate)

      // Create preview with referenced documents
      const referencedPreview =
        selectedDocuments.length > 0
          ? `<h3>Referenced Documents</h3>
           <ul>
             ${selectedDocuments.map((doc) => `<li>${doc.title}</li>`).join("")}
           </ul>`
          : ""

      setPreviewDocument({
        title: documentName || "Untitled Document",
        template: template?.name || "Custom Template",
        preview: `
          ${template?.preview || "No preview available"}
          ${referencedPreview}
        `,
      })
    }
  }

  // Update preview when relevant fields change
  useEffect(() => {
    updatePreview()
  }, [documentName, selectedTemplate, selectedDocuments])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Loading Screen */}
      <DocumentLoadingScreen 
        isOpen={showLoadingScreen}
        documentName={documentName || "Untitled Document"}
        templateName={templates.find(t => t.id === selectedTemplate)?.name || ""}
      />

      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-6">Create New Document</h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  placeholder="Enter document name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page-count">Number of Pages</Label>
                <Select value={pageCount} onValueChange={setPageCount}>
                  <SelectTrigger id="page-count">
                    <SelectValue placeholder="Select page count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 10, 15, 20, 30].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} pages
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tools</Label>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <Button
                      key={tool.id}
                      type="button"
                      variant={selectedTools.includes(tool.id) ? "default" : "outline"}
                      className={selectedTools.includes(tool.id) ? "bg-[#4287f5] hover:bg-[#3a76d8]" : ""}
                      onClick={() => toggleTool(tool.id)}
                    >
                      <tool.icon className="mr-2 h-4 w-4" />
                      {tool.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groq-api-key">Groq API Key</Label>
              <Input
                id="groq-api-key"
                placeholder="Enter your Groq API key"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Using Llama 3.3 70B model via Groq. Get your API key at{" "}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">
                  console.groq.com
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea
                id="details"
                placeholder="Describe what you want in your document..."
                className="min-h-[120px]"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Documents</Label>
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                  <TabsTrigger value="project">Project Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">Drag and drop files here or click to browse</p>
                    <Input type="file" multiple className="hidden" id="file-upload" onChange={handleFileUpload} />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="mt-2" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </span>
                      </Button>
                    </Label>
                  </div>
                </TabsContent>

                <TabsContent value="project" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sampleDocuments.slice(0, 4).map((doc) => (
                      <Card
                        key={doc.id}
                        className="p-3 cursor-pointer hover:border-[#4287f5] flex justify-between items-center"
                        onClick={() => addDocument(doc)}
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm truncate">{doc.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            addDocument(doc)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {selectedDocuments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map((doc) => (
                      <Badge key={doc.id} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                        <span className="text-xs truncate max-w-[150px]">{doc.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 rounded-full ml-1"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="sticky top-4">
          <h3 className="text-lg font-medium mb-4">Document Preview</h3>

          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h4 className="font-medium">{previewDocument?.title || "Untitled Document"}</h4>
              <p className="text-sm text-muted-foreground">{previewDocument?.template || "No template selected"}</p>
            </div>

            <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
              {previewDocument ? (
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: previewDocument.preview }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a template to see preview</p>
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full mt-4 bg-[#4287f5] hover:bg-[#3a76d8]"
            disabled={!documentName || !selectedTemplate || isLoading || !groqApiKey}
            onClick={handleCreateDocument}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Create Document"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}