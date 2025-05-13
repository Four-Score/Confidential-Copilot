"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button_d"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card_d"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Upload } from "lucide-react"
import { Input } from "@/components/ui/input_d"

import type { DocumentType, Project } from "@/lib/types"

interface DocumentDashboardProps {
  documents: DocumentType[]
  onCreateNew: () => void
  onEditDocument: (document: DocumentType) => void
}

export function DocumentDashboard({ documents, onCreateNew, onEditDocument }: DocumentDashboardProps) {
  const [selectedProject, setSelectedProject] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const projects: Project[] = [
    { id: "all", name: "All Projects" },
    { id: "project1", name: "Marketing Campaign" },
    { id: "project2", name: "Product Launch" },
    { id: "project3", name: "Research Initiative" },
  ]

  const filteredDocuments = documents.filter((doc) => {
    const matchesProject = selectedProject === "all" || doc.projectId === selectedProject
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesProject && matchesSearch
  })

  const handleImportDocuments = () => {
    const fileInput = window.document.createElement("input")
    fileInput.type = "file"
    fileInput.multiple = true
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      // setup template structure
      if (target && target.files) {
        const files = Array.from(target.files)
        const newDocs: DocumentType[] = files.map((file, index) => ({
          id: `upload-${Date.now()}-${index}`,
          title: file.name,
          template: "Imported Document",
          content: "<p>Imported document content here.</p>",
          createdAt: new Date().toISOString(),
          pages: 1,
          projectId: "project1",
          type: "uploaded",
          size: `${Math.round(file.size / 1024)} KB`,
        }))
        if (newDocs.length > 0) {
          onEditDocument(newDocs[0])
        }
      }
    }
    fileInput.click()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Document Dashboard</h2>
          <p className="text-muted-foreground">Manage and create your documents</p>
        </div>
        <Button onClick={onCreateNew} className="bg-[#4287f5] hover:bg-[#3a76d8]">
          <Plus className="mr-2 h-4 w-4" /> Create New Document
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full md:w-auto" onClick={handleImportDocuments}>
          <Upload className="mr-2 h-4 w-4" /> Import Documents
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Recently Generated Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:border-[#4287f5] transition-colors"
              onClick={() => onEditDocument(doc)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium truncate">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="mr-1 h-4 w-4" />
                  {doc.template}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{doc.pages} pages</div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
