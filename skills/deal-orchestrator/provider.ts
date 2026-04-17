/**
 * Deal Orchestrator Provider
 * Model: Claude 3.5 Sonnet
 */

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dealOrchestrator = {
  async analyze(communityData: Record<string, unknown>) {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are a community savings advisor. 
      Analyze community spending patterns and identify group deal opportunities.
      Be specific, use exact numbers, and prioritize deals by potential savings.
      Output structured JSON only.`,
      messages: [{
        role: 'user',
        content: `
          Community: ${communityData.name}
          Members: ${communityData.memberCount}
          Location: ${communityData.city}
          
          Last 30 days spending:
          ${JSON.stringify(communityData.spendingSummary)}
          
          Top merchants:
          ${JSON.stringify(communityData.topMerchants)}
          
          Find 3 group deal opportunities. For each:
          1. Which merchant/category
          2. Estimated monthly community spend with them
          3. Recommended discount to negotiate (%)
          4. Minimum orders needed to qualify
          5. Projected annual savings for community
          
          Return as JSON array.
        `
      }]
    });

    // @ts-expect-error - response.content[0].text exists on Anthropic.Messages.Message
    return JSON.parse(response.content[0].text);
  }
};
