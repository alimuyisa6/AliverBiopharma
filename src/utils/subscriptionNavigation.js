export function getSubscriptionPath(location, options = {}) {
  const params = new URLSearchParams({ section: 'billing' });
  if (options.reason) params.set('reason', options.reason);
  if (options.planId) params.set('plan_id', String(options.planId));

  const currentPath = location
    ? `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`
    : '';

  const returnTo = options.returnTo || (options.preserveCurrent && currentPath !== '/profile?section=billing' ? currentPath : '');
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('return_to', returnTo);
  }

  return `/profile?${params.toString()}`;
}

export function redirectToSubscription(navigate, location, options = {}) {
  navigate(getSubscriptionPath(location, options), {
    state: { activeSection: 'billing' }
  });
}

export function isPremiumAccessError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return error?.authorization?.reason === 'premium_required'
    || error?.authorization?.reason === 'premium_locked'
    || error?.code === 'premium_locked'
    || error?.reason === 'premium_locked'
    || /premium required|premium content|premium_locked|subscription required/.test(message);
}

export function getSafeReturnPath(value) {
  const path = String(value || '');
  return path.startsWith('/') && !path.startsWith('//') ? path : '';
}
