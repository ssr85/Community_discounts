/**
 * Intent Classifier Provider
 * Model: bitext/Mistral-7B-Restaurants
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models/bitext/Mistral-7B-Restaurants';

export const intentClassifier = {
  async classify(userQuery: string): Promise<string> {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: userQuery,
        parameters: { 
          candidate_labels: [
            'find_restaurant',
            'check_menu_price',
            'book_group_deal',
            'view_community_spending',
            'report_quality_issue',
            'find_home_service'
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.labels[0]; // Highest confidence label
  }
};
