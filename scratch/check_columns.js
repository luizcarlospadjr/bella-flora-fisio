const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing insert into profiles to inspect all columns...");
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: '00000000-0000-0000-0000-000000000000',
      role: 'therapist',
      full_name: 'Inspect Columns'
    })
    .select();
  
  console.log("Error:", error);
  console.log("Returned row columns:", data);

  // Clean up
  if (data && data.length > 0) {
    await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Cleaned up successfully.");
  }
}
run();
