
// src/app/api/vector-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";

export const runtime = "edge";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filter, apiKey, limit = 5 } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
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

    const vectorStore = new SupabaseVectorStore(
      new CohereEmbeddings({
        apiKey,
        model: "embed-english-v3.0", 
      }),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );
    const results = await vectorStore.similaritySearchWithScore(
      query,
      limit,
      filter
    );
    const formattedResults = results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: score,
    }));

    return NextResponse.json({
      results: formattedResults,
      count: formattedResults.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Vector search error:", error);
    return NextResponse.json({
      error: error.message || "Error performing vector search"
    }, { status: 500 });
  }
}