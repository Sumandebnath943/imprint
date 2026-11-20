DO $$ BEGIN
  ASSERT (SELECT profession = 'Writer' AND profession_cluster = 'language_voice' AND onboarding_completed
    FROM public.profiles WHERE id = '01000000-0000-4000-8000-000000000001');
  ASSERT (SELECT response_text = 'Legacy baseline response' FROM public.baseline_imprints
    WHERE user_id = '01000000-0000-4000-8000-000000000001' AND module_id = 'U1');
  ASSERT (SELECT content = 'Legacy capsule body' AND unlock_date = '2099-05-01' FROM public.time_capsules
    WHERE id = '01000000-0000-4000-8000-000000000003');
  ASSERT (SELECT status = 'active' AND check_in_streak = 4 FROM public.mentorships
    WHERE id = '01000000-0000-4000-8000-000000000004');
  ASSERT (SELECT is_private AND invite_code = 'QALEGACY' FROM public.human_circles
    WHERE id = '01000000-0000-4000-8000-000000000005');
  ASSERT to_regclass('public.role_assessments') IS NOT NULL;
  ASSERT to_regclass('public.imprint_tasks') IS NOT NULL;
END; $$;
