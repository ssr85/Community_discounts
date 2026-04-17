import { HfInference } from '@huggingface/inference';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import * as fs from 'fs';
import * as path from 'path';

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateDeals(communityId: string) {
  console.log(`🤖 Starting deal generation for community: ${communityId} using HuggingFace (Qwen 2.5)`);

  // 1. Fetch spending records for the community
  const { data: records, error } = await supabaseAdmin
    .from('spending_records')
    .select('merchant_name, amount, category')
    .eq('community_id', communityId);

  if (error) {
    console.error('Error fetching spending records:', error);
    throw error;
  }

  if (!records || records.length === 0) {
    console.warn('No spending records found for this community.');
    return [];
  }

  // 2. Aggregate data by merchant
  const stats = records.reduce((acc: any, rec: any) => {
    if (!acc[rec.merchant_name]) {
      acc[rec.merchant_name] = { total: 0, count: 0, category: rec.category };
    }
    acc[rec.merchant_name].total += rec.amount;
    acc[rec.merchant_name].count += 1;
    return acc;
  }, {});

  // 3. Prepare the Prompt from SKILL.md
  const skillPath = path.join(process.cwd(), 'skills', 'deal-orchestrator', 'SKILL.md');
  const skillMd = fs.readFileSync(skillPath, 'utf8');
  
  const userContent = `
Current Community Spending Data (Aggregated):
${JSON.stringify(stats, null, 2)}

Please analyze this data and provide 3-5 group deal recommendations as per the instructions in the skill definition.
Your response MUST be a JSON object with a single "deals" key containing the array of deal objects.
Do not include any other text in your response, only the JSON.
  `;

  // 4. Invoke HuggingFace (Qwen 2.5-7B-Instruct)
  const response = await hf.chatCompletion({
    model: "Qwen/Qwen2.5-7B-Instruct",
    messages: [
      { role: 'system', content: skillMd },
      { role: 'user', content: userContent }
    ],
    max_tokens: 2048,
    temperature: 0.1, // Low temperature for consistent JSON
  });

  const rawJson = response.choices[0].message.content || '{"deals": []}';
  
  // Clean potential markdown code blocks from response
  const cleanedJson = rawJson.replace(/```json|```/g, '').trim();
  
  try {
    const result = JSON.parse(cleanedJson);
    console.log(`✅ HuggingFace generated ${result.deals?.length || 0} deals.`);
    return result.deals || [];
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', cleanedJson);
    throw new Error('AI response was not valid JSON');
  }
}
