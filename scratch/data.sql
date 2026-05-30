select json_build_object(
  'profiles', (select json_agg(json_build_object('role',p.role,'name',p.full_name,'email',u.email) order by p.role) from public.profiles p join auth.users u on u.id=p.id),
  'roles_count', (select json_object_agg(role, c) from (select role, count(*) c from public.profiles group by role) x),
  'appointments', (select count(*) from public.appointments),
  'appt_status', (select json_object_agg(status, c) from (select status, count(*) c from public.appointments group by status) y),
  'medical_records', (select count(*) from public.medical_records),
  'chat_messages', (select count(*) from public.chat_messages),
  'exercises_catalog', (select count(*) from public.exercises_catalog),
  'exercises_by_therapist', (select json_object_agg(therapist_id::text, c) from (select therapist_id, count(*) c from public.exercises_catalog group by therapist_id) z)
) as data;
