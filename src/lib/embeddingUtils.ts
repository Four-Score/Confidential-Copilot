import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import type { DocumentChunk } from "./pdfUtils";

// Maximum batch size for processing embeddings
export const MAX_BATCH_SIZE = 10;

/**
 * Creates and initializes the embedding model
 * @returns Initialized embedding model
 */
export async function createEmbeddingModel() {
  try {
    const model = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2",// 384-dimensional embeddings
    });
    return model;
  } catch (error) {
    console.error("Error creating embedding model:", error);
    throw new Error(`Failed to initialize embedding model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates embedding for a single text
 * @param text Text to generate embedding for
 * @returns Vector embedding as number array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = await createEmbeddingModel();
    const embedding = await model.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Interface for chunks with their embeddings
 */
export interface ChunkWithEmbedding {
  chunk: DocumentChunk;
  embedding: number[];
}

/**
 * Processes document chunks in batches to generate embeddings
 * @param chunks Array of document chunks
 * @param batchSize Maximum batch size
 * @param onProgress Optional progress callback
 * @returns Array of chunks with their embeddings
 */
export async function generateBatchEmbeddings(
  chunks: DocumentChunk[], 
  batchSize = MAX_BATCH_SIZE,
  onProgress?: (progress: number) => void
): Promise<ChunkWithEmbedding[]> {
  try {
    const model = await createEmbeddingModel();
    const totalChunks = chunks.length;
    const results: ChunkWithEmbedding[] = [];
    
    // Process in batches
    for (let i = 0; i < totalChunks; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batchTexts = batchChunks.map(chunk => chunk.content);
      
      // Generate embeddings for this batch
      const embeddings = await model.embedDocuments(batchTexts);
      
      // Combine chunks with their embeddings
      for (let j = 0; j < batchChunks.length; j++) {
        results.push({
          chunk: batchChunks[j],
          embedding: embeddings[j],
        });
      }
      
      // Report progress if callback is provided
      if (onProgress) {
        const progress = Math.min(100, Math.round(((i + batchChunks.length) / totalChunks) * 100));
        onProgress(progress);
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error generating batch embeddings:", error);
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// THE FOLLOWING FUNCTIONS ARE EXTRA AND MAY NOT BE NEEDED

/**
 * Normalizes a vector for cosine similarity calculations
 * @param vector Vector to normalize
 * @returns Normalized vector
 */
export function normalizeVector(vector: number[]): number[] {
  try {
    // Calculate the magnitude (Euclidean norm)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    // Prevent division by zero
    if (magnitude === 0) {
      return new Array(vector.length).fill(0);
    }
    
    // Normalize each component
    return vector.map(val => val / magnitude);
  } catch (error) {
    console.error("Error normalizing vector:", error);
    throw new Error(`Failed to normalize vector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculates cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Cosine similarity score (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  try {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same dimensions");
    }
    
    // For best results, normalize vectors first
    const normVecA = normalizeVector(vecA);
    const normVecB = normalizeVector(vecB);
    
    // Dot product of normalized vectors equals cosine similarity
    return normVecA.reduce((sum, a, i) => sum + a * normVecB[i], 0);
  } catch (error) {
    console.error("Error calculating cosine similarity:", error);
    throw new Error(`Failed to calculate similarity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}