select json_build_object(
  'publication_exists', (select exists(select 1 from pg_publication where pubname='supabase_realtime')),
  'tables_in_realtime', (select coalesce(json_agg(tablename order by tablename),'[]'::json) from pg_publication_tables where pubname='supabase_realtime' and schemaname='public')
) as rt;
