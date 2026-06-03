const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: '00000000-0000-0000-0000-000000000000',
      role: 'therapist',
      full_name: 'Test',
      metadata: { crefito: '12345' }
    });
  
  if (error && error.message.includes('Could not find')) {
    console.log("metadata column: DOES NOT EXIST");
  } else {
    console.log("metadata column: EXISTS OR FAILED WITH RLS/OTHER", error ? error.code : 'success');
  }
}
run();
