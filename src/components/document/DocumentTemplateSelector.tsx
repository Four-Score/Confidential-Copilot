// src/components/DocumentTemplateSelector.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button_d"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card_d"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

import type { DocumentTemplate } from "@/lib/types"

// Provide user with common templates
const TEMPLATE_CATEGORIES = [
  "All Templates",
  "Business",
  "Legal",
  "Technical",
  "Marketing",
  "Academic",
]

interface DocumentTemplateSelectorProps {
  onSelectTemplate: (template: DocumentTemplate) => void
}

export function DocumentTemplateSelector({ onSelectTemplate }: DocumentTemplateSelectorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All Templates")
  const router = useRouter()

  useEffect(() => {
    const fetchTemplatesFromVectorStore = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500)) 
        const mockTemplates: DocumentTemplate[] = [
          {
            id: "template-1",
            title: "Business Proposal",
            description: "A comprehensive business proposal template for pitching ideas to clients and stakeholders.",
            category: "Business",
            pages: 4,
            vectorId: "vector-template-1",
          },
          {
            id: "template-2",
            title: "Privacy Policy",
            description: "A legally compliant privacy policy template for websites and applications.",
            category: "Legal",
            pages: 3,
            vectorId: "vector-template-2",
          },
          {
            id: "template-3",
            title: "Technical Specification",
            description: "Detailed technical specification document for software and hardware projects.",
            category: "Technical",
            pages: 5,
            vectorId: "vector-template-3",
          },
          {
            id: "template-4",
            title: "Marketing Plan",
            description: "Strategic marketing plan template for campaign planning and execution.",
            category: "Marketing",
            pages: 6,
            vectorId: "vector-template-4",
          },
          {
            id: "template-5",
            title: "Research Report",
            description: "Academic research report template with proper citations and structure.",
            category: "Academic",
            pages: 8,
            vectorId: "vector-template-5",
          },
          {
            id: "template-6",
            title: "Service Agreement",
            description: "Legal service agreement template for client-provider relationships.",
            category: "Legal",
            pages: 4,
            vectorId: "vector-template-6",
          },
        ]
        
        setTemplates(mockTemplates)
      } catch (error) {
        console.error("Error fetching templates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplatesFromVectorStore()
  }, [])

  const filteredTemplates = templates.filter(
    (template) => selectedCategory === "All Templates" || template.category === selectedCategory
  )

  const handleCreateCustomTemplate = () => {
    router.push("/documents/create-custom")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Document Templates</h2>
          <p className="text-muted-foreground">Select a template to start your document</p>
        </div>
        <Button onClick={handleCreateCustomTemplate} className="bg-[#4287f5] hover:bg-[#3a76d8]">
          <Plus className="mr-2 h-4 w-4" /> Create Custom Template
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Zap className="mr-1 h-4 w-4 text-amber-500" />
          Templates use semantic search via vector database
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="h-[200px] animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-[#4287f5] transition-colors h-full"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-[#4287f5]" />
                  {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{template.category}</div>
                <div>{template.pages} pages</div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}