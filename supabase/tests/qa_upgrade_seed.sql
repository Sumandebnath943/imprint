-- Disposable database only. Apply directly after 010 and before 011.
INSERT INTO auth.users (id, email) VALUES
  ('01000000-0000-4000-8000-000000000001', 'legacy-upgrade-owner@example.test'),
  ('01000000-0000-4000-8000-000000000002', 'legacy-upgrade-partner@example.test');
UPDATE public.profiles SET profession = 'Writer', profession_cluster = 'language_voice',
  onboarding_completed = true, accepting_mentees = true
WHERE id = '01000000-0000-4000-8000-000000000001';
INSERT INTO public.baseline_imprints (user_id, cluster, module_id, module_name, prompt_given, response_text, response_type)
VALUES ('01000000-0000-4000-8000-000000000001', 'universal', 'U1', 'Legacy baseline', 'Fixture prompt', 'Legacy baseline response', 'text');
INSERT INTO public.time_capsules (id, user_id, title, content, unlock_date)
VALUES ('01000000-0000-4000-8000-000000000003', '01000000-0000-4000-8000-000000000001', 'Legacy capsule', 'Legacy capsule body', '2099-05-01');
INSERT INTO public.mentorships (id, mentor_id, mentee_id, status, check_in_streak)
VALUES ('01000000-0000-4000-8000-000000000004', '01000000-0000-4000-8000-000000000001', '01000000-0000-4000-8000-000000000002', 'active', 4);
INSERT INTO public.human_circles (id, name, description, cluster_focus, created_by, is_private, invite_code)
VALUES ('01000000-0000-4000-8000-000000000005', 'Legacy circle', 'Fixture', 'language_voice', '01000000-0000-4000-8000-000000000001', true, 'QALEGACY');
INSERT INTO public.circle_members (circle_id, user_id, role)
VALUES ('01000000-0000-4000-8000-000000000005', '01000000-0000-4000-8000-000000000001', 'admin');
