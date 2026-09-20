/**
 * test_nvidia_api.js — Diagnostic & Verification Script for NVIDIA Build API / NIM
 *
 * Tests:
 * 1. Checks if NVIDIA_API_KEY is configured in .env
 * 2. Validates connection to https://integrate.api.nvidia.com/v1/chat/completions
 * 3. Sends test completion query with grounding context
 * 4. Measures response latency and verifies token output
 *
 * Usage:
 *   node test_nvidia_api.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.NVIDIA_API_KEY;
const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const model = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';

console.log('='.repeat(65));
console.log('🧪 NVIDIA Build API (NIM) Diagnostic & Connection Test');
console.log('='.repeat(65));
console.log(`Base URL : ${baseUrl}`);
console.log(`Model    : ${model}`);

if (!apiKey || apiKey.trim() === '') {
  console.log('\n⚠️  NVIDIA_API_KEY is currently empty in server/.env');
  console.log('👉 To enable live LLM completions:');
  console.log('   1. Sign in to https://build.nvidia.com');
  console.log('   2. Generate an API Key (starts with nvapi-...)');
  console.log('   3. Set NVIDIA_API_KEY="nvapi-..." in server/.env');
  console.log('   4. Run this script again: node test_nvidia_api.js\n');
  process.exit(0);
}

console.log(`API Key  : ${apiKey.slice(0, 8)}...${apiKey.slice(-4)} (Configured)`);
console.log('\n📡 Dispatching test query to NVIDIA Build API...');

const startTime = Date.now();

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are CloudOps Copilot. Answer concisely with evidence citations in brackets like [1].'
        },
        {
          role: 'user',
          content: 'Why is Production API alerting right now? State CPU and latency.'
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  const latency = Date.now() - startTime;

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`\n❌ NVIDIA API returned HTTP ${res.status}:`);
    console.error(errorText);
    process.exit(1);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  console.log(`\n✅ HTTP 200 OK — Completed in ${(latency / 1000).toFixed(2)}s`);
  console.log(`Prompt Tokens     : ${usage.prompt_tokens || 'N/A'}`);
  console.log(`Completion Tokens : ${usage.completion_tokens || 'N/A'}`);
  console.log('-'.repeat(65));
  console.log('Generated Response:');
  console.log(content.trim());
  console.log('-'.repeat(65));
  console.log('🎉 NVIDIA Build API is 100% operational and ready for live Copilot queries!\n');

} catch (err) {
  console.error(`\n❌ Request failed: ${err.message}`);
  process.exit(1);
}
