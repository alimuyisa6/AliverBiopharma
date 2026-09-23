  return res.status(200).json({
    profile: profile.data || null,
    referral_count: referral.count || 0,
    active_device_count: devices.count || 0,
    subscription: subscription.data || null
  });
}

async function updateBio(body, res, ctx) {
  const userId = ctx.userId;
  const { bio } = body;

  if (typeof bio !== 'string' || bio.length > 500) {
    throw new SecurityError(
      'bio must be a string under 500 characters',
      400
    );
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      bio: bio.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select('bio')
    .single();

  if (error) {
    throwSupabaseError(
      'updateBio:update_profile',
      'user_profiles',
      error,
      userId
    );
  }

  requireData(data, 'updateBio:update_profile', 'user_profiles', userId);

  return res.status(200).json({
    success: true,
    bio: data.bio
  });
}

async function updatePreferences(body, res, ctx) {
  const userId = ctx.userId;
  const updates = {
    updated_at: new Date().toISOString()
  };

  const allowedKeys = [
    'theme_color',
    'language',
    'timezone'
  ];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      updates[key] = String(body[key]).slice(0, 50);
    }
  }

  if (body.accessibility !== undefined) {
    if (
      typeof body.accessibility !== 'object' ||
      Array.isArray(body.accessibility)
    ) {
      throw new SecurityError(
        'accessibility must be an object',
        400
      );
    }

    updates.accessibility = body.accessibility;
  }

  if (body.preferences !== undefined) {
    if (
      typeof body.preferences !== 'object' ||
      Array.isArray(body.preferences)
    ) {
      throw new SecurityError(
        'preferences must be an object',
        400
      );
    }

    const currentProfile = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (currentProfile.error) {
      throwSupabaseError(
        'updatePreferences:load_preferences',
        'user_profiles',
        currentProfile.error,
        userId
      );
    }

    const incoming = body.preferences;
    const current = currentProfile.data?.preferences || {};
    const nextPreferences = { ...current };

    const allowedUI = {
      font_family: new Set(['maven', 'system', 'serif', 'mono']),
      font_size: new Set(['90', '100', '110', '120']),
      density: new Set(['compact', 'comfortable', 'spacious']),
      surface_style: new Set(['card', 'flat']),
      button_size: new Set(['small', 'medium', 'large']),
      button_width: new Set(['auto', 'full']),
      content_width: new Set(['readable', 'wide', 'full']),
      section_spacing: new Set(['compact', 'comfortable', 'spacious'])
    };

    if (incoming.ui !== undefined) {
      if (
        typeof incoming.ui !== 'object' ||
        Array.isArray(incoming.ui)
      ) {
        throw new SecurityError('preferences.ui must be an object', 400);
      }

      const nextUI = { ...(current.ui || {}) };

      for (const [key, value] of Object.entries(incoming.ui)) {
        if (!Object.prototype.hasOwnProperty.call(allowedUI, key)) {
          throw new SecurityError(`Unsupported UI preference: ${key}`, 400);
        }

        const normalized = String(value);
        if (!allowedUI[key].has(normalized)) {
          throw new SecurityError(`Invalid value for UI preference: ${key}`, 400);
        }

        nextUI[key] = normalized;
      }

      nextPreferences.ui = nextUI;
    }

    const nonUIKeys = Object.keys(incoming).filter((key) => key !== 'ui');
    if (nonUIKeys.length > 0) {
      throw new SecurityError(
        `Unsupported preference keys: ${nonUIKeys.join(', ')}`,
        400
      );
    }

    updates.preferences = nextPreferences;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select(
      'theme_color, language, timezone, accessibility, preferences'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'updatePreferences:update_profile',
      'user_profiles',
      error,
      userId
    );
  }

  requireData(
    data,
    'updatePreferences:update_profile',
    'user_profiles',
    userId
  );

  return res.status(200).json({
    success: true,
    profile: data
  });