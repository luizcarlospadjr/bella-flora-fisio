const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Listing tables from public schema...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log("Single profile keys:", Object.keys(data[0]));
  } else {
    console.log("Profiles is empty. Testing other queries...");
  }
}
run();
