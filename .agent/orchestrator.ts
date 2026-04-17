/**
 * Orchestrator: Claude 3.5 Routing Logic
 * Handles high-level reasoning and skill delegation.
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { intentClassifier } from '../skills/intent-classifier/provider';
import { dealOrchestrator } from '../skills/deal-orchestrator/provider';
import { sentimentAnalyzer } from '../skills/sentiment-analyzer/provider';
import { semanticMatcher } from '../skills/semantic-matcher/provider';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function routeRequest(userQuery: string, communityData: any) {
  // 1. Classify Intent
  const intent = await intentClassifier.classify(userQuery);

  console.log(`[Orchestrator] Intent classified: ${intent}`);

  // 2. Delegate based on intent
  switch (intent) {
    case 'book_group_deal':
    case 'view_community_spending':
      // Analyzes community spend to find or join deals
      return await dealOrchestrator.analyze(communityData);
    
    case 'find_restaurant':
    case 'find_home_service':
      // Semantic search for restaurants/services
      const queryEmbedding = await semanticMatcher.generateEmbedding(userQuery);
      return { 
        action: 'search', 
        params: { query: userQuery, embedding: queryEmbedding } 
      };

    case 'report_quality_issue':
      // Analyze sentiment of the issue report
      const sentiment = await sentimentAnalyzer.analyze(userQuery);
      return { 
        action: 'log_issue', 
        params: { review: userQuery, sentiment } 
      };

    case 'check_menu_price':
      return { 
        action: 'scrape_price', 
        params: { query: userQuery } 
      };

    default:
      return { 
        action: 'clarify', 
        message: 'I need more details to help you save. Try asking about local restaurants or group deals.' 
      };
  }
}
