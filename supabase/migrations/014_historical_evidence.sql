CREATE TABLE public.historical_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL,
  rubric_version text NOT NULL,
  criterion_id text NOT NULL,
  work_date date NOT NULL,
  prior_period_end date NOT NULL,
  source_url text NOT NULL,
  content text,
  file_path text,
  contribution text NOT NULL,
  tool_context text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','inconclusive')),
  evidence_hash text NOT NULL,
  consent_version text NOT NULL,
  score integer CHECK (score BETWEEN 0 AND 100),
  model text,
  evaluator text,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CHECK (content IS NOT NULL OR file_path IS NOT NULL),
  UNIQUE (user_id, role_id, rubric_version, criterion_id, evidence_hash),
  UNIQUE (user_id, role_id, rubric_version, criterion_id, source_url)
);
CREATE INDEX historical_evidence_user ON public.historical_evidence (user_id, role_id, rubric_version);
ALTER TABLE public.historical_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY historical_evidence_read_own ON public.historical_evidence
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.historical_evidence FROM authenticated, anon;

CREATE TABLE public.assessment_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.role_assessments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolution text,
  resolved_at timestamptz,
  UNIQUE (user_id, assessment_id)
);
ALTER TABLE public.assessment_review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_review_read_own ON public.assessment_review_requests
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.assessment_review_requests FROM authenticated, anon;
