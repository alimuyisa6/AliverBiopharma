CREATE OR REPLACE FUNCTION public.guard_user_curriculum_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_role text;
  target_group_level text;
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
        OR NEW.track IS DISTINCT FROM OLD.track
        OR NEW.level_approval_status IS DISTINCT FROM OLD.level_approval_status
        OR NEW.level_approved_at IS DISTINCT FROM OLD.level_approved_at
        OR NEW.level_approved_by IS DISTINCT FROM OLD.level_approved_by
        OR NEW.authorization_version IS DISTINCT FROM OLD.authorization_version THEN
        RAISE EXCEPTION 'Curriculum level changes require administrator approval'
          USING ERRCODE = '42501';
      END IF;

      IF NEW.active_group_id IS DISTINCT FROM OLD.active_group_id
        OR NEW.class_name IS DISTINCT FROM OLD.class_name THEN
        IF NEW.active_level_id IS NULL OR NEW.active_group_id IS NULL THEN
          RAISE EXCEPTION 'An approved curriculum level is required before choosing a class'
            USING ERRCODE = '42501';
        END IF;

        SELECT level_id INTO target_group_level
        FROM public.curriculum_groups
        WHERE id = NEW.active_group_id
          AND is_active = true;

        IF target_group_level IS DISTINCT FROM NEW.active_level_id THEN
          RAISE EXCEPTION 'Class must belong to the approved curriculum level'
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
