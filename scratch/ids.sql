select json_build_object(
  'profiles', (select json_agg(json_build_object('id',p.id,'role',p.role,'name',p.full_name,'email',u.email) order by p.role, u.email) from public.profiles p join auth.users u on u.id=p.id),
  'exercise_owner', (select distinct therapist_id::text from public.exercises_catalog),
  'exercises', (select json_agg(json_build_object('id',id,'name',name) order by name) from public.exercises_catalog),
  'medical_record', (select json_build_object('patient',patient_id::text,'therapist',therapist_id::text,'session',session_number) from public.medical_records limit 1),
  'chat_message', (select json_build_object('sender',sender_id::text,'receiver',receiver_id::text,'text',message_text) from public.chat_messages limit 1)
) as ids;
