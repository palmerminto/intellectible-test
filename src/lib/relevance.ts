/**
 * Map a retrieval score to a human-readable relevance label.
 * Raw scores are hidden from users; labels build trust under pressure.
 */
export function scoreToRelevanceLabel(score: number): string {
  // Thresholds are heuristic until reranking/eval exists in production.
  if (score >= 0.75) {
    return 'Strong match';
  }

  return 'Related passage';
}
