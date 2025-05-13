// src/lib/vector-store/document-embeddings.ts
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const initVectorStore = async (apiKey: string) => {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PRIVATE_KEY!
  );

  const embeddings = new CohereEmbeddings({
    apiKey,
    model: "embed-english-v3.0", 
  });

  return new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });
};

export const processDocumentForVectorStore = async (
  documentContent: string,
  metadata: Record<string, any>,
  apiKey: string
): Promise<string[]> => {
  if (!apiKey) {
    throw new Error("Cohere API key is required for embeddings");
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
    separators: ["\n\n", "\n", " ", ""],
  });

  // Split document into manageable chunks
  const docs = await splitter.createDocuments(
    [documentContent],
    [metadata]
  );

  // Initialize the vector store
  const vectorStore = await initVectorStore(apiKey);

  // Generate unique IDs for document chunks
  const docIds = docs.map((_, i) => `${metadata.documentId}-chunk-${i}`);
  
  await vectorStore.addDocuments(docs, { ids: docIds });
  
  return docIds;
};

export const retrieveRelevantDocuments = async (
  query: string,
  apiKey: string,
  filter?: Record<string, any>,
  k: number = 5
): Promise<Document[]> => {
  const vectorStore = await initVectorStore(apiKey);
  const retriever = vectorStore.asRetriever({
    filter,
    k,
    searchType: "similarity",
  });
    return await retriever.invoke(query);
};