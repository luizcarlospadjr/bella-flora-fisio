const { createClient } = require('@supabase/supabase-js');
const url = 'https://rfyuggtvailwsasykwxh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';
const s = createClient(url, key);
(async () => {
  // Anon (unauthenticated) must NOT be able to read protected rows
  for (const t of ['pain_logs','exercise_completions','chat_messages','medical_records']) {
    const { data, error } = await s.from(t).select('*');
    console.log(t.padEnd(20), error ? ('BLOCKED/err: '+error.message) : ('rows visible to anon: '+data.length+(data.length===0?' (OK - RLS enforced)':' (LEAK!)')));
  }
})();
