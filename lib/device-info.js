/* lib/device-info.js */
const MAX_DEVICE_ID_LENGTH = 64;
const MAX_MODEL_LENGTH = 120;
const MAX_VERSION_LENGTH = 64;
const MAX_BROWSER_LENGTH = 80;

function clean(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function unquote(value) {
  return clean(value, MAX_VERSION_LENGTH)?.replace(/^"(.*)"$/, '$1') || null;
}

function firstBrand(brands) {
  if (!Array.isArray(brands)) return null;
  const preferred = brands.find((brand) => {
    const name = String(brand?.brand || '').toLowerCase();
    return name && !name.includes('not') && !name.includes('chromium');
  });
  return preferred?.brand || brands.find((brand) => brand?.brand)?.brand || null;
}

function parseBrands(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((part) => {
      const match = part.trim().match(/^"([^"]+)"(?:;v="([^"]+)")?$/);
      return match ? { brand: match[1], version: match[2] || null } : null;
    })
    .filter(Boolean);
}

function parseBrowser(userAgent, brandsHeader) {
  const brands = parseBrands(brandsHeader);
  const brand = firstBrand(brands);

  if (brand) {
    const matched = brands.find((item) => item.brand === brand);
    return {
      name: clean(brand, MAX_BROWSER_LENGTH),
      version: clean(matched?.version, MAX_VERSION_LENGTH)
    };
  }

  const ua = String(userAgent || '');
  const match =
    ua.match(/(?:Edg|Edge)\/(\d+(?:\.\d+){0,3})/i) ||
    ua.match(/(?:OPR|Opera)\/(\d+(?:\.\d+){0,3})/i) ||
    ua.match(/(?:Chrome|CriOS)\/(\d+(?:\.\d+){0,3})/i) ||
    ua.match(/Firefox\/(\d+(?:\.\d+){0,3})/i) ||
    ua.match(/Version\/(\d+(?:\.\d+){0,3}).*Safari\//i);

  if (!match) return { name: null, version: null };

  const name = /Edg|Edge/i.test(match[0]) ? 'Microsoft Edge'
    : /OPR|Opera/i.test(match[0]) ? 'Opera'
    : /Firefox/i.test(match[0]) ? 'Firefox'
    : /Safari/i.test(match[0]) ? 'Safari'
    : 'Chrome';

  return { name, version: clean(match[1], MAX_VERSION_LENGTH) };
}

export function getDeviceMetadata(req, clientDevice = null) {
  const headers = req?.headers || {};
  const userAgent = clean(headers['user-agent'], 500) || '';

  const headerPlatform = unquote(headers['sec-ch-ua-platform']);
  const headerPlatformVersion = unquote(headers['sec-ch-ua-platform-version']);
  const headerModel = unquote(headers['sec-ch-ua-model']);

  const supplied = clientDevice && typeof clientDevice === 'object' ? clientDevice : {};

  const platform =
    clean(supplied.platform, 40) ||
    headerPlatform ||
    (/Android/i.test(userAgent) ? 'Android' : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS' : /Windows/i.test(userAgent) ? 'Windows' : /Mac OS/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : null);

  const osVersion =
    clean(supplied.platformVersion, MAX_VERSION_LENGTH) ||
    headerPlatformVersion ||
    null;

  const model =
    clean(supplied.model, MAX_MODEL_LENGTH) ||
    headerModel ||
    null;

  const browser = parseBrowser(userAgent, headers['sec-ch-ua']);

  const browserName =
    clean(supplied.browser, MAX_BROWSER_LENGTH) ||
    browser.name;

  const browserVersion =
    clean(supplied.browserVersion, MAX_VERSION_LENGTH) ||
    browser.version;

  const deviceId = clean(supplied.deviceId, MAX_DEVICE_ID_LENGTH);

  return {
    device_id: deviceId,
    device_model: model,
    device_platform: platform,
    device_os_version: osVersion,
    device_browser: browserName,
    device_browser_version: browserVersion
  };
}

export function normalizeDeviceMetadata(value) {
  if (!value || typeof value !== 'object') return {};
  return {
    device_id: clean(value.device_id, MAX_DEVICE_ID_LENGTH),
    device_model: clean(value.device_model, MAX_MODEL_LENGTH),
    device_platform: clean(value.device_platform, 40),
    device_os_version: clean(value.device_os_version, MAX_VERSION_LENGTH),
    device_browser: clean(value.device_browser, MAX_BROWSER_LENGTH),
    device_browser_version: clean(value.device_browser_version, MAX_VERSION_LENGTH)
  };
}
