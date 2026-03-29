import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// We need a polyfill for fetch since analyzeProspectsWithAI uses it
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

import { analyzeProspectsWithAI } from './src/parser.js';

async function test() {
  const text = fs.readFileSync('output.txt', 'utf8'); // Just pass the raw text we already extracted
  try {
    const res = await analyzeProspectsWithAI(text);
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error("Error running AI:", e.message);
  }
}

test();
