const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking profiles...");
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error("Profiles error:", pError);
  else console.log("Profiles in DB:", profiles);

  console.log("Checking appointments...");
  const { data: appointments, error: aError } = await supabase.from('appointments').select('*');
  if (aError) console.error("Appointments error:", aError);
  else console.log("Appointments in DB:", appointments);
}

run();
