"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface DocumentLoadingScreenProps {
  isOpen: boolean
  documentName: string
  templateName: string
}

export function DocumentLoadingScreen({ isOpen, documentName, templateName }: DocumentLoadingScreenProps) {
  const loadingMessages = [
    "Analyzing document requirements...",
    "Creating markdown document structure...",
    "Generating detailed headings and subheadings...",
    "Crafting nuanced and detailed content...",
    "Adding professional formatting...",
    "Implementing markdown syntax...",
    "Integrating references and citations...",
    "Expanding content with in-depth analysis...",
    "Adding specific details and examples...",
    "Refining language and tone...",
    "Polishing document structure...",
    "Ensuring consistency across sections...",
    "Finalizing markdown document..."
  ]

  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0])
  const [progress, setProgress] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!isOpen) return

    // Reset state when loading starts
    setCurrentMessage(loadingMessages[0])
    setProgress(0)
    setCycle(0)

    // Check update
    const totalDuration = 22000 
    const messageInterval = totalDuration / loadingMessages.length
    const progressInterval = 100 

    const messageTimer = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev)
        const nextIndex = (currentIndex + 1) % loadingMessages.length
        return loadingMessages[nextIndex]
      })
      
      setCycle((prev) => prev + 1)
    }, messageInterval)

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const maxProgress = 98 // Maximum progress before completion
        const increment = (maxProgress / (totalDuration / progressInterval))
        return Math.min(prev + increment, maxProgress)
      })
    }, progressInterval)

    // Cleanup timers
    return () => {
      clearInterval(messageTimer)
      clearInterval(progressTimer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Creating Your Document</h2>
            <p className="text-muted-foreground">
              Generating a detailed markdown document based on {templateName} template
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-[#4287f5]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium">{documentName}</p>
              <p className="text-sm text-muted-foreground mt-1">{currentMessage}</p>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4287f5] transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Creating a detailed, long-form markdown document with deep analysis and specific content.
              This may take a few moments...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}