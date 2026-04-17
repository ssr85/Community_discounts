/**
 * Semantic Matcher Provider
 * Model: sentence-transformers/all-MiniLM-L6-v2
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';

export const semanticMatcher = {
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.statusText}`);
    }

    return await response.json(); // Returns float array (384 dimensions)
  },

  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (magA * magB);
  }
};
