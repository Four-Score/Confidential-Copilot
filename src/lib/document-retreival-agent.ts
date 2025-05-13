// src/lib/agents/document-retrieval-agent.ts
import { ChatGroq } from "@langchain/groq";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";

export class DocumentRetrievalAgent {
  private model: ChatGroq;
  private embeddings: CohereEmbeddings;
  private supabaseClient: any;
  private vectorStore: SupabaseVectorStore | null = null;

  constructor(apiKey: string) {
    this.model = new ChatGroq({
      apiKey,
      model: "llama-3.3-70b-versatile", 
      temperature: 0.5,
      maxTokens: 4000,
    });
    this.embeddings = new CohereEmbeddings({
      apiKey,
      model: "embed-english-v3.0",
    });
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!
    );
  }

  private async getVectorStore(): Promise<SupabaseVectorStore> {
    if (!this.vectorStore) {
      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.supabaseClient,
        tableName: "documents",
        queryName: "match_documents",
      });
    }
    return this.vectorStore;
  }

  async retrieveContext(query: string, filter?: Record<string, any>): Promise<Document[]> {
    const store = await this.getVectorStore();
    return await store.similaritySearch(query, 5, filter);
  }

  async generateDocumentWithReferences({
    templateName,
    templatePurpose,
    details,
    query,
    filter,
  }: {
    templateName: string;
    templatePurpose: string;
    details: string;
    query: string;
    filter?: Record<string, any>;
  }): Promise<string> {
    // Define system prompt for document generation
    const systemPrompt = `You are an AI document generator that creates professional content based on templates.
Your task is to generate a well-structured document following the template specifications.
Always format your output in clean HTML that can be directly rendered in a web application.
Use the retrieved documents as reference material and context for your generation.`;
    const contextDocuments = await this.retrieveContext(query, filter);
    
    // Helper function
    const formatDocumentsForContext = (docs: Document[]): string => {
      return docs.map(doc => 
        `REFERENCE CONTENT: ${doc.pageContent}\nSOURCE: ${doc.metadata.source || "Unknown"}`
      ).join("\n\n");
    };
    
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
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
        formattedReferences: () => formatDocumentsForContext(contextDocuments),
      },
      promptTemplate,
      this.model,
      new StringOutputParser(),
    ]);

    // Execute the document generation
    return await documentGenerationChain.invoke({});
  }
  async generateDocumentContent({
    templateName,
    templatePurpose,
    details,
    referencedDocuments,
  }: {
    templateName: string;
    templatePurpose: string;
    details: string;
    referencedDocuments: string;
  }): Promise<string> {
    try {
      // Generate a search query from the document requirements
      const query = `${templateName} ${templatePurpose} ${details.substring(0, 100)}`;
      
      // Generate document with references
      return await this.generateDocumentWithReferences({
        templateName,
        templatePurpose,
        details,
        query,
        // Add filter if specific document references are provided
        filter: referencedDocuments ? { source: { $contains: referencedDocuments } } : undefined,
      });
    } catch (error) {
      console.error("Error in document agent:", error);
      
      // Fallback to direct generation without retrieval if there's an error
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", `You are an AI document generator that creates professional content based on templates.
Your task is to generate a well-structured document following the template specifications.
Always format your output in clean HTML that can be directly rendered in a web application.`],
        ["human", `Please create a document using the following specifications:

TEMPLATE: {templateName}

PURPOSE: {templatePurpose}

ADDITIONAL DETAILS: {details}

REFERENCED DOCUMENTS:
{referencedDocuments}

Generate a complete, professional document that follows the template purpose above.
Format the result in clean, semantic HTML with appropriate headings, paragraphs, and sections.`]
      ]);

      const outputParser = new StringOutputParser();
      const chain = promptTemplate.pipe(this.model).pipe(outputParser);

      return await chain.invoke({
        templateName,
        templatePurpose,
        details,
        referencedDocuments,
      });
    }
  }
}

// Export utility function to initialize the agent
export function initDocumentAgent(apiKey: string): DocumentRetrievalAgent {
  return new DocumentRetrievalAgent(apiKey);
}