ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS level_approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS level_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS level_approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS authorization_version bigint NOT NULL DEFAULT 1;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_level_approval_status_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_level_approval_status_check
  CHECK (level_approval_status IN ('pending', 'approved', 'rejected'));

UPDATE public.user_profiles
SET level_approval_status = 'approved'
WHERE active_level_id IS NOT NULL
  AND active_group_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS level_change_requests_one_pending_per_user
ON public.level_change_requests(user_id)
WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.guard_user_curriculum_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_role text;
BEGIN
  request_role := COALESCE(current_setting('request.jwt.claim.role', true), '');

  IF request_role <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.active_level_id IS NOT NULL
        OR NEW.active_group_id IS NOT NULL
        OR NEW.track IS NOT NULL
        OR NEW.class_name IS NOT NULL THEN
        RAISE EXCEPTION 'Curriculum assignment requires administrator approval'
          USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.active_level_id IS DISTINCT FROM OLD.active_level_id
        OR NEW.active_group_id IS DISTINCT FROM OLD.active_group_id
        OR NEW.track IS DISTINCT FROM OLD.track
        OR NEW.class_name IS DISTINCT FROM OLD.class_name
        OR NEW.level_approval_status IS DISTINCT FROM OLD.level_approval_status
        OR NEW.level_approved_at IS DISTINCT FROM OLD.level_approved_at
        OR NEW.level_approved_by IS DISTINCT FROM OLD.level_approved_by
        OR NEW.authorization_version IS DISTINCT FROM OLD.authorization_version THEN
        RAISE EXCEPTION 'Curriculum assignment requires administrator approval'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_guard_curriculum_assignment ON public.user_profiles;
CREATE TRIGGER user_profiles_guard_curriculum_assignment
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_curriculum_assignment();

CREATE OR REPLACE FUNCTION public.review_level_change_request(
  p_request_id bigint,
  p_action text,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_row public.level_change_requests%ROWTYPE;
  profile_row public.user_profiles%ROWTYPE;
  level_row public.curriculum_levels%ROWTYPE;
  group_row public.curriculum_groups%ROWTYPE;
  resolved_track text;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Backend service authorization required'
      USING ERRCODE = '42501';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid review action' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO request_row
  FROM public.level_change_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Level change request not found' USING ERRCODE = 'P0002';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'This level change request has already been reviewed'
      USING ERRCODE = '55000';
  END IF;

  SELECT * INTO profile_row
  FROM public.user_profiles
  WHERE user_id = request_row.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'approve' THEN
    SELECT * INTO level_row
    FROM public.curriculum_levels
    WHERE id = request_row.requested_level_id;

    SELECT * INTO group_row
    FROM public.curriculum_groups
    WHERE id = request_row.requested_group_id
      AND level_id = request_row.requested_level_id
      AND is_active = true;

    IF level_row.id IS NULL OR group_row.id IS NULL THEN
      RAISE EXCEPTION 'Requested curriculum level or class is invalid or inactive'
        USING ERRCODE = '22023';
    END IF;

    resolved_track := CASE level_row.id
      WHEN 'O Level' THEN 'O-Level'
      WHEN 'A Level' THEN 'A-Level'
      WHEN 'Pharmacy' THEN 'Pharmacy'
      ELSE NULL
    END;

    IF resolved_track IS NULL THEN
      RAISE EXCEPTION 'Unsupported curriculum level' USING ERRCODE = '22023';
    END IF;

    UPDATE public.user_profiles
    SET track = resolved_track,
        class_name = group_row.name,
        active_level_id = level_row.id,
        active_group_id = group_row.id,
        level_approval_status = 'approved',
        level_approved_at = now(),
        level_approved_by = p_admin_id,
        authorization_version = authorization_version + 1,
        onboarding_completed = true,
        updated_at = now()
    WHERE user_id = request_row.user_id;
  ELSIF profile_row.active_level_id IS NULL THEN
    UPDATE public.user_profiles
    SET level_approval_status = 'rejected',
        authorization_version = authorization_version + 1,
        updated_at = now()
    WHERE user_id = request_row.user_id;
  END IF;

  UPDATE public.level_change_requests
  SET status = p_action,
      admin_id = p_admin_id,
      resolved_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'action', p_action,
    'user_id', request_row.user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_level_change_request(bigint, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_level_change_request(bigint, text, uuid) TO service_role;
