require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in environment!');
  process.exit(1);
}

async function supabaseRest(endpoint, method = 'GET', body = null) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return res.status === 204 ? [] : await res.json();
}

async function extractSchema() {
  console.log(`====================================================`);
  console.log(`1. EXTRACTING SUPABASE SCHEMA & TABLES`);
  console.log(`====================================================`);
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (!res.ok) {
      console.error(`Failed to fetch REST OpenAPI schema: HTTP ${res.status}`);
      return;
    }

    const openapi = await res.json();
    const definitions = openapi.definitions || {};

    console.log(`Extracted ${Object.keys(definitions).length} Table Definitions:\n`);
    for (const [tableName, schema] of Object.entries(definitions)) {
      console.log(`📋 Table: [${tableName}]`);
      const properties = schema.properties || {};
      const fields = Object.entries(properties).map(([field, prop]) => {
        return `   - ${field}: ${prop.type || 'unknown'} ${prop.format ? `(${prop.format})` : ''} ${schema.required?.includes(field) ? '[REQUIRED]' : ''}`;
      });
      console.log(fields.join('\n'));
      console.log('');
    }
  } catch (err) {
    console.error('Error extracting schema:', err.message);
  }
}

async function wipeDatabase() {
  console.log(`====================================================`);
  console.log(`2. WIPING ALL EXISTING DATA FROM SUPABASE`);
  console.log(`====================================================\n`);

  // Delete in reverse FK order to avoid constraint violations
  const tablesToWipe = ['pages', 'dead_letter_queue', 'error_log', 'chapters', 'manga'];

  for (const table of tablesToWipe) {
    console.log(`Deleting data from table '${table}'...`);
    try {
      const deleted = await supabaseRest(`${table}?id=not.is.null`, 'DELETE');
      console.log(`  ✓ Table '${table}' wiped successfully. Deleted ${deleted.length} rows.`);
    } catch (err) {
      console.warn(`  ! Could not wipe ${table}:`, err.message);
    }
  }

  console.log(`\n====================================================`);
  console.log(`Verification: Checking table row counts...`);
  console.log(`====================================================`);

  for (const table of tablesToWipe) {
    try {
      const remaining = await supabaseRest(`${table}?select=id`, 'GET');
      console.log(`  - ${table}: ${remaining.length} rows remaining`);
    } catch (err) {
      console.log(`  - ${table}: Table check warning (${err.message})`);
    }
  }
}

async function run() {
  await extractSchema();
  await wipeDatabase();
}

run();
