// One-time seed script — clears Convex and loads the 69 validated prospects
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";

const CONVEX_URL = "https://kindred-duck-693.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  // Skip header (line 0), use positional mapping
  // Columns: company, industry, decisionMaker, role, email, score, priority, status, linkedin
  return lines.slice(1).map((line, idx) => {
    // Handle quoted fields
    const fields = [];
    let field = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; continue; }
      if (line[i] === ',' && !inQ) { fields.push(field.trim()); field = ''; continue; }
      field += line[i];
    }
    fields.push(field.trim());

    const company       = fields[0] || '';
    const industry      = fields[1] || '';
    const decisionMaker = fields[2] || '';
    const role          = fields[3] || '';
    const email         = fields[4] || '';
    const score         = parseInt(fields[5]) || 0;
    const priority      = fields[6] || 'Media';
    const status        = fields[7] || 'Prospecto';
    const linkedin      = fields[8] || '';

    return {
      id: `p_csv_${idx + 1}`,
      company,
      industry,
      decisionMaker,
      role,
      email,
      score,
      priority,
      status,
      linkedin: linkedin || null,
      outreachStatus: 'enriched', // has email, needs draft
      emailSent: false,
    };
  }).filter(p => p.company && p.email);
}

async function main() {
  const text = readFileSync("Data Enrichment 300326.csv", "utf-8");
  const prospects = parseCSV(text);

  console.log(`Paso 1: Limpiando TODOS los prospectos existentes...`);
  const deleted = await client.mutation("prospects:clearAll", {});
  console.log(`  Eliminados: ${deleted}`);

  console.log(`\nPaso 2: Cargando ${prospects.length} prospectos...`);
  await client.mutation("prospects:batchUpsert", { prospects });

  // Verify
  const verify = await client.query("prospects:list");
  console.log(`✅ Verificación: ${verify.length} prospectos en Convex.`);
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
