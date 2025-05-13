// src/app/api/document-ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";
import { Document } from "@langchain/core/documents";

export const runtime = "edge";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, metadata, apiKey } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: "Document text is required" },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!
    );
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 50,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
    const documentMetadata = metadata || { 
      source: `document-${Date.now()}`,
      created: new Date().toISOString(),
    };
    
    const docs = await splitter.createDocuments([text], [documentMetadata]);
        const embeddings = new CohereEmbeddings({
      apiKey,
      model: "embed-english-v3.0", 
    });
    const vectorstore = await SupabaseVectorStore.fromDocuments(
      docs,
      embeddings,
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );
    const docIds = docs.map((_, index) => `${documentMetadata.source}-${index}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Document successfully processed and stored",
      documentIds: docIds,
      chunkCount: docs.length
    }, { status: 200 });
  } catch (e: any) {
    console.error("Error processing document:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}