const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolve the device identifier persisted on a new session.
 * Administrator sessions must use the identifier that passed trusted-device
 * approval; they must never silently fall back to a newly generated ID.
 */
export function resolveSessionDeviceId({ isAdminSession, approvedDeviceId, requestDeviceId }) {
  if (isAdminSession) {
    const approvedId = String(approvedDeviceId || '').trim();
    if (!DEVICE_ID_PATTERN.test(approvedId)) {
      throw new Error('An approved administrator device ID is required');
    }
    return approvedId;
  }

  const requestId = String(requestDeviceId || '').trim();
  if (!DEVICE_ID_PATTERN.test(requestId)) {
    throw new Error('A valid session device ID is required');
  }
  return requestId;
}
