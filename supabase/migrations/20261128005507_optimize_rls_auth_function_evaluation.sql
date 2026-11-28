DO $migration$
DECLARE
  policy_record record;
  rewritten_using text;
  rewritten_check text;
  role_list text;
  create_statement text;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE (
      coalesce(qual, '') ~* 'auth\.(uid|role)\s*\('
      AND coalesce(qual, '') !~* '\(\s*select\s+auth\.(uid|role)'
    ) OR (
      coalesce(with_check, '') ~* 'auth\.(uid|role)\s*\('
      AND coalesce(with_check, '') !~* '\(\s*select\s+auth\.(uid|role)'
    )
  LOOP
    rewritten_using := CASE
      WHEN policy_record.qual IS NULL THEN NULL
      ELSE regexp_replace(policy_record.qual, 'auth\.(uid|role)\(\)', '(SELECT auth.\1())', 'gi')
    END;
    rewritten_check := CASE
      WHEN policy_record.with_check IS NULL THEN NULL
      ELSE regexp_replace(policy_record.with_check, 'auth\.(uid|role)\(\)', '(SELECT auth.\1())', 'gi')
    END;
    SELECT string_agg(quote_ident(role_name), ', ')
    INTO role_list
    FROM unnest(policy_record.roles) AS role_name;

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );

    create_statement := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename,
      policy_record.permissive,
      policy_record.cmd,
      role_list
    );

    IF rewritten_using IS NOT NULL THEN
      create_statement := create_statement || format(' USING (%s)', rewritten_using);
    END IF;

    IF rewritten_check IS NOT NULL THEN
      create_statement := create_statement || format(' WITH CHECK (%s)', rewritten_check);
    END IF;

    EXECUTE create_statement;
  END LOOP;
END;
$migration$;