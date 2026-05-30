select json_build_object(
  'tables', (select json_agg(table_name order by table_name) from information_schema.tables where table_schema='public'),
  'user_role_values', (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='user_role'),
  'columns', (select json_object_agg(table_name, cols) from (
       select table_name, json_agg(column_name || ':' || data_type order by ordinal_position) as cols
       from information_schema.columns where table_schema='public' group by table_name) c),
  'policies', (select json_agg(tablename || '.' || policyname || ' [' || cmd || ']' order by tablename) from pg_policies where schemaname='public'),
  'auth_users', (select count(*) from auth.users),
  'profiles_count', (select count(*) from public.profiles),
  'buckets', (select coalesce(json_agg(id), '[]'::json) from storage.buckets)
) as info;
