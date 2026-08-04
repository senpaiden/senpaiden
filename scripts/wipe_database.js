require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function wipeDatabase() {
  console.log("Connecting to Supabase at", process.env.SUPABASE_URL);
  
  // To delete all mangas, we can just delete where id is not null.
  // Because of cascading deletes, this should also wipe chapters and pages.
  console.log("Deleting all records from the 'manga' table...");
  const { data, error, count } = await supabase
    .from('manga')
    .delete()
    .neq('id', 'this-is-impossible') // Delete all rows
    .select();

  if (error) {
    console.error("Error wiping database:", error);
    process.exit(1);
  }

  console.log(`Successfully deleted ${data.length} manga(s) from the remote database.`);
}

wipeDatabase();
