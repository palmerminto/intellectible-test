import { env } from '@/env';
import type { EmbeddedChunk, TextChunk } from '@/lib/rag/types';

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 32;

interface OpenRouterEmbeddingResponse {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
  error?: {
    message?: string;
  };
}

/**
 * Ensure OpenRouter credentials are available before making API calls.
 *
 * @throws When `OPENROUTER_API_KEY` is missing.
 */
function assertOpenRouterConfigured() {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
}

/**
 * Validate that an embedding matches the pgvector column size.
 *
 * @param embedding - Vector returned by OpenRouter.
 * @param index - Position of the embedding in the current batch.
 * @throws When the embedding length is not 1536.
 */
function validateEmbedding(embedding: number[], index: number) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding at index ${index} has ${embedding.length} dimensions; expected ${EMBEDDING_DIMENSIONS}`,
    );
  }
}

/**
 * Extract a safe error message from a failed OpenRouter response.
 *
 * @param response - Non-success HTTP response from OpenRouter.
 * @returns Parsed API error message or a generic fallback.
 */
async function readOpenRouterError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as OpenRouterEmbeddingResponse;
    return payload.error?.message ?? 'Unknown OpenRouter error';
  } catch {
    return 'Unable to parse OpenRouter error response';
  }
}

/**
 * Request embeddings for a single OpenRouter batch.
 *
 * @param texts - Input strings to embed in one API call.
 * @returns Embedding vectors in the same order as the input texts.
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  assertOpenRouterConfigured();

  const response = await fetch(`${env.OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const detail = await readOpenRouterError(response);
    throw new Error(`OpenRouter embeddings request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as OpenRouterEmbeddingResponse;

  if (payload.error?.message) {
    throw new Error(`OpenRouter embeddings error: ${payload.error.message}`);
  }

  const rows = payload.data ?? [];
  if (rows.length !== texts.length) {
    throw new Error(
      `OpenRouter returned ${rows.length} embeddings for ${texts.length} input texts`,
    );
  }

  const sorted = [...rows].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
  const embeddings = sorted.map((row, index) => {
    const embedding = row.embedding;
    if (!embedding) {
      throw new Error(`OpenRouter response missing embedding at index ${index}`);
    }
    validateEmbedding(embedding, index);
    return embedding;
  });

  return embeddings;
}

/**
 * Embed an arbitrary list of strings via OpenRouter.
 *
 * Large inputs are sent in fixed-size batches to stay within API limits.
 *
 * @param texts - Plain-text strings to embed.
 * @returns One 1536-dimension vector per input string.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  for (let index = 0; index < texts.length; index += BATCH_SIZE) {
    const batch = texts.slice(index, index + BATCH_SIZE);
    const batchEmbeddings = await embedBatch(batch);
    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

/**
 * Attach embeddings to parsed document chunks.
 *
 * @param chunks - Text chunks produced by the chunking step.
 * @returns The same chunks with embedding vectors added.
 */
export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

  return chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));
}
