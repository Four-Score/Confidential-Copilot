"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card_d"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentDashboard } from "@/components/document/document-dashboard"
import { DocumentCreator } from "@/components/document/document-creator"
import { DocumentEditor } from "@/components/document/document-editor"
import { sampleDocuments } from "@/lib/sample-data"
import type { DocumentType } from "@/lib/types"

export default function DocumentModePage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentDocument, setCurrentDocument] = useState<DocumentType | null>(null)
  const [documents, setDocuments] = useState<DocumentType[]>(sampleDocuments)

  const handleCreateNew = () => {
    setActiveTab("create")
  }

  const handleEditDocument = (document: DocumentType) => {
    setCurrentDocument(document)
    setActiveTab("edit")
  }

  const handleDocumentCreated = (document: DocumentType) => {
    // Add the new document to the documents list
    setDocuments((prevDocs) => [document, ...prevDocs])
    setCurrentDocument(document)
    setActiveTab("edit")
  }

  const handleDocumentSaved = (updatedDocument: DocumentType) => {
    // Update the document in the documents list
    setDocuments((prevDocs) => prevDocs.map((doc) => (doc.id === updatedDocument.id ? updatedDocument : doc)))
    setActiveTab("dashboard")
  }

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-[#4287f5]">Document Mode</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Document</TabsTrigger>
          <TabsTrigger value="edit" disabled={!currentDocument}>
            Edit Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <DocumentDashboard
                documents={documents}
                onCreateNew={handleCreateNew}
                onEditDocument={handleEditDocument}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <DocumentCreator onDocumentCreated={handleDocumentCreated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-0">
          <Card>
            <CardContent className="p-6">
              {currentDocument && <DocumentEditor document={currentDocument} onSave={handleDocumentSaved} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
