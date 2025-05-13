// src/app/api/document-generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantDocuments } from "@/lib/document-embeddings";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      templateName, 
      templatePurpose, 
      details, 
      referencedDocuments,
      apiKey
    } = body;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }
    const model = new ChatGroq({
      apiKey,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 4000,
    });
    
    const searchQuery = `${templateName} ${templatePurpose} ${details.substring(0, 100)}`;
        console.log("Retrieving context for document generation...");
    const contextDocs = await retrieveRelevantDocuments(
      searchQuery,
      apiKey,
      referencedDocuments ? { source: { $contains: referencedDocuments } } : undefined
    );
    
    console.log(`Found ${contextDocs.length} relevant context documents`);
    
    const formatDocumentsForContext = (docs: Document[]): string => {
      return docs.map(doc => 
        `REFERENCE CONTENT: ${doc.pageContent}\nSOURCE: ${doc.metadata.source || "Unknown"}`
      ).join("\n\n");
    };
    
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are an AI document generator that creates professional content based on templates.
Your task is to generate a well-structured document following the template specifications.
Always format your output in clean HTML that can be directly rendered in a web application.
Use the retrieved documents as reference material and context for your generation.`],
      ["human", `Please create a document using the following specifications:

TEMPLATE: {templateName}

PURPOSE: {templatePurpose}

ADDITIONAL DETAILS: {details}

RETRIEVED REFERENCE DOCUMENTS:
{formattedReferences}

Generate a complete, professional document that follows the template purpose above.
Use the retrieved reference documents to inform and enhance the content.
Format the result in clean, semantic HTML with appropriate headings, paragraphs, and sections.`]
    ]);

    // Create a runnable sequence for document generation
    const documentGenerationChain = RunnableSequence.from([
      {
        templateName: () => templateName,
        templatePurpose: () => templatePurpose,
        details: () => details,
        formattedReferences: () => formatDocumentsForContext(contextDocs),
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);
    console.log("Generating document with context...");
    const documentContent = await documentGenerationChain.invoke({});
    
    return NextResponse.json({
      content: documentContent,
      contextUsed: contextDocs.length,
      templateName,
      generatedAt: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error generating document:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate document" 
    }, { status: 500 });
  }
}