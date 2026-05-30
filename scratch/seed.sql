-- ============================================================================
-- BELLA FLORA FISIO — Demo seed (idempotent). Marked with [seed] for removal.
-- Therapist ccea9496 (Therapist E2E Test, owns the 7-exercise catalog)
-- Patient   4348e13c (luiz.carlos.test.patient)
-- ============================================================================

-- Appointments: 2 completed (past) + 2 scheduled (future), with price ---------
INSERT INTO public.appointments (id, therapist_id, patient_id, date, status, service, price, duration_minutes, notes) VALUES
 ('a0000001-0000-0000-0000-000000000001','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', now() - interval '14 days', 'completed', 'Sessão de Fisioterapia Pélvica', 180.00, 50, '[seed] Avaliação inicial AFA 2/5'),
 ('a0000001-0000-0000-0000-000000000002','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', now() - interval '7 days',  'completed', 'Sessão de Fisioterapia Pélvica', 180.00, 50, '[seed] Evolução AFA 3/5'),
 ('a0000001-0000-0000-0000-000000000003','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', now() + interval '2 days',  'scheduled', 'Sessão de Fisioterapia Pélvica', 180.00, 50, '[seed] Próxima sessão'),
 ('a0000001-0000-0000-0000-000000000004','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', now() + interval '9 days',  'scheduled', 'Sessão de Fisioterapia Pélvica', 180.00, 50, '[seed] Sessão de acompanhamento')
ON CONFLICT (id) DO NOTHING;

-- Medical record with prescribed exercises (references real catalog ids) ------
INSERT INTO public.medical_records (id, patient_id, therapist_id, session_number, afa_score, evolution_notes, prescribed_exercises) VALUES
 ('b0000001-0000-0000-0000-000000000001','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','ccea9496-1436-4759-8320-22403dd04f29', 2, 'AFA 3/5',
  '[seed] Paciente apresenta boa evolução do tônus do assoalho pélvico. Manter rotina domiciliar de Kegel progressivo e respiração diafragmática. Reduziu queixa de dor.',
  '[{"id":"kegel_basico","name":"Kegel Progressivo","series":3,"repetitions":"10","frequency":"2 vezes/dia"},{"id":"respiracao_diafragmatica","name":"Respiração Diafragmática","series":3,"repetitions":"8","frequency":"1 vez/dia"},{"id":"ponte_pelvica_adutores","name":"Ponte Pélvica com Adução","series":3,"repetitions":"12","frequency":"1 vez/dia"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Exercise completions over the last week -------------------------------------
INSERT INTO public.exercise_completions (id, patient_id, exercise_id, exercise_name, series_done, completed_at) VALUES
 ('c0000001-0000-0000-0000-000000000001','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','kegel_basico','Kegel Progressivo',3, now() - interval '5 days'),
 ('c0000001-0000-0000-0000-000000000002','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','respiracao_diafragmatica','Respiração Diafragmática',3, now() - interval '4 days'),
 ('c0000001-0000-0000-0000-000000000003','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','kegel_basico','Kegel Progressivo',3, now() - interval '2 days'),
 ('c0000001-0000-0000-0000-000000000004','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','ponte_pelvica_adutores','Ponte Pélvica com Adução',2, now() - interval '1 days')
ON CONFLICT (id) DO NOTHING;

-- Pain logs trending down ------------------------------------------------------
INSERT INTO public.pain_logs (id, patient_id, level, note, created_at) VALUES
 ('d0000001-0000-0000-0000-000000000001','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', 7, '[seed] Início do tratamento', now() - interval '14 days'),
 ('d0000001-0000-0000-0000-000000000002','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', 5, '[seed] Após primeira semana', now() - interval '7 days'),
 ('d0000001-0000-0000-0000-000000000003','4348e13c-2ba4-4df8-9d90-3aa86b0b1152', 3, '[seed] Melhora consistente', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Chat thread between the demo therapist and patient --------------------------
INSERT INTO public.chat_messages (id, sender_id, receiver_id, message_text, created_at, read_at) VALUES
 ('e0000001-0000-0000-0000-000000000001','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','Olá! Como você está se sentindo após as sessões desta semana?', now() - interval '3 days', now() - interval '3 days'),
 ('e0000001-0000-0000-0000-000000000002','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','ccea9496-1436-4759-8320-22403dd04f29','Oi, Dra.! Senti bastante melhora na dor, consegui fazer todos os exercícios.', now() - interval '3 days' + interval '2 hours', now() - interval '3 days' + interval '3 hours'),
 ('e0000001-0000-0000-0000-000000000003','ccea9496-1436-4759-8320-22403dd04f29','4348e13c-2ba4-4df8-9d90-3aa86b0b1152','Que ótimo! Continue com o Kegel progressivo 2x ao dia. Nos vemos na próxima consulta.', now() - interval '2 days', NULL)
ON CONFLICT (id) DO NOTHING;

SELECT json_build_object(
  'appointments', (SELECT count(*) FROM public.appointments),
  'medical_records', (SELECT count(*) FROM public.medical_records),
  'completions', (SELECT count(*) FROM public.exercise_completions),
  'pain_logs', (SELECT count(*) FROM public.pain_logs),
  'chat_messages', (SELECT count(*) FROM public.chat_messages)
) AS seed_result;
