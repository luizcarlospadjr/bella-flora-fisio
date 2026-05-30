const { createClient } = require('@supabase/supabase-js');
const url = 'https://rfyuggtvailwsasykwxh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';
const s = createClient(url, key);
(async () => {
  for (const t of ['profiles','appointments','medical_records','chat_messages','exercises_catalog']) {
    const { data, error } = await s.from(t).select('*').limit(1);
    console.log(t, error ? 'ERROR: '+error.message : 'OK ('+data.length+' rows sampled)');
  }
})();
