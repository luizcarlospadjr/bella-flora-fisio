const supabaseUrl = 'https://rfyuggtvailwsasykwxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXVnZ3R2YWlsd3Nhc3lrd3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDYzNTIsImV4cCI6MjA5NTU4MjM1Mn0.zBOXls3arhnAjuBb5pWAb5UEdCgz3Dvqd1gDhFS2G58';

async function run() {
  console.log("Fetching schema...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey
      }
    });
    const schema = await res.json();
    const profilesDefinition = schema.definitions && schema.definitions.profiles;
    if (profilesDefinition) {
      console.log("Profiles properties:", Object.keys(profilesDefinition.properties));
    } else {
      console.log("No profiles definition found. Entire definitions keys:", Object.keys(schema.definitions || {}));
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
run();
