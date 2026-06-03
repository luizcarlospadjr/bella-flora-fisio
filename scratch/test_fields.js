const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn(colName) {
  const payload = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'therapist',
    full_name: 'Test'
  };
  payload[colName] = 'Test Value';

  const { error } = await supabase
    .from('profiles')
    .insert(payload);
  
  if (error && error.message.includes('Could not find')) {
    console.log(`Column '${colName}': DOES NOT EXIST`);
  } else {
    console.log(`Column '${colName}': EXISTS OR FAILED WITH RLS/OTHER (${error ? error.code : 'success'})`);
  }
}

async function run() {
  await testColumn('specialization');
  await testColumn('education');
  await testColumn('bio');
  await testColumn('specialty');
  await testColumn('crefito');
}
run();
