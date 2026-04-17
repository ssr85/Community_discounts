import { openai } from '../../src/lib/openai';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import * as fs from 'fs';
import * as path from 'path';

export async function generateDeals(communityId: string) {
  console.log(`🤖 Starting deal generation for community: ${communityId}`);

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
  // Using a relative path that works from the src/app/api/... runtime context
  const skillPath = path.join(process.cwd(), 'skills', 'deal-orchestrator', 'SKILL.md');
  const skillMd = fs.readFileSync(skillPath, 'utf8');
  
  const userContent = `
Current Community Spending Data (Aggregated):
${JSON.stringify(stats, null, 2)}

Please analyze this data and provide 3-5 group deal recommendations as per the instructions in the skill definition.
Respond with a JSON object containing a "deals" key.
  `;

  // 4. Invoke OpenAI (GPT-4o)
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: skillMd },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  });

  const rawJson = response.choices[0].message.content || '{"deals": []}';
  const result = JSON.parse(rawJson);
  
  console.log(`✅ AI generated ${result.deals?.length || 0} deals.`);
  return result.deals || [];
}
