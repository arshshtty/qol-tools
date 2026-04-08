import cors from 'cors';
import path from 'path';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export function sendError(res, status, code, message) {
  return res.status(status).json({
    error: { code, message }
  });
}

export function createCorsMiddleware(toolPort, extraOrigins = []) {
  const allowlist = new Set([
    `http://localhost:${toolPort}`,
    `http://127.0.0.1:${toolPort}`,
    ...extraOrigins.filter(Boolean)
  ]);

  return cors({
    origin(origin, callback) {
      if (!origin || allowlist.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    }
  });
}

export function createApiTokenMiddleware(envVar = 'QOL_TOOLS_API_TOKEN') {
  return (req, res, next) => {
    const expectedToken = process.env[envVar];

    if (!expectedToken) {
      next();
      return;
    }

    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : null;
    const providedToken = req.headers['x-api-token'] || bearer;

    if (providedToken !== expectedToken) {
      sendError(res, 401, 'unauthorized', 'Missing or invalid API token');
      return;
    }

    next();
  };
}

export function createRateLimitMiddleware(options = {}) {
  const windowMs = Number(options.windowMs) || WINDOW_MS;
  const maxRequests = Number(options.maxRequests) || MAX_REQUESTS;
  const now = () => Date.now();
  const buckets = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.route?.path || req.path}`;
    const bucket = buckets.get(key) || [];
    const cutoff = now() - windowMs;
    const recent = bucket.filter(ts => ts > cutoff);

    if (recent.length >= maxRequests) {
      sendError(res, 429, 'rate_limited', 'Too many destructive requests, try again later');
      return;
    }

    recent.push(now());
    buckets.set(key, recent);
    next();
  };
}

export function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseBoundedPort(value) {
  const port = parsePositiveInt(value);
  if (!port || port > 65535) {
    return null;
  }

  return port;
}

export function sanitizePathSegment(value) {
  const decoded = decodeURIComponent(String(value || '')).trim();
  if (!decoded) {
    return null;
  }

  const normalized = path.posix.normalize(`/${decoded}`).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.includes('..') || normalized.includes('/')) {
    return null;
  }

  return normalized;
}
