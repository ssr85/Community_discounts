/**
 * Sentiment Analyzer Provider
 * Model: cardiffnlp/twitter-xlm-roberta-base-sentiment
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-xlm-roberta-base-sentiment';

export const sentimentAnalyzer = {
  async analyze(text: string): Promise<{ label: string; score: number }> {
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

    const data = await response.json();
    // HF returns an array of arrays for this model: [[{label: 'LABEL_0', score: 0.9}, ...]]
    const bestMatch = data[0].sort((a: any, b: any) => b.score - a.score)[0];
    
    // Mapping model-specific labels to human-readable ones
    const labelMap: Record<string, string> = {
      'LABEL_0': 'negative',
      'LABEL_1': 'neutral',
      'LABEL_2': 'positive'
    };

    return {
      label: labelMap[bestMatch.label] || bestMatch.label,
      score: bestMatch.score
    };
  }
};
