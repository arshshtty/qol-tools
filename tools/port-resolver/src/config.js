import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scanRangeSchema = z.object({
  start: z.number().int().min(1, 'start must be >= 1').max(65535, 'start must be <= 65535'),
  end: z.number().int().min(1, 'end must be >= 1').max(65535, 'end must be <= 65535'),
  name: z.string().trim().min(1, 'name must be a non-empty string')
}).superRefine((value, ctx) => {
  if (value.end < value.start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'end must be greater than or equal to start',
      path: ['end']
    });
  }
});

const configSchema = z.object({
  scanRanges: z.array(scanRangeSchema).min(1, 'scanRanges must include at least one range'),
  port: z.number().int().min(1, 'port must be >= 1').max(65535, 'port must be <= 65535'),
  refreshInterval: z.number().int().positive('refreshInterval must be > 0'),
  preferences: z.record(z.unknown()).optional()
});

const preferenceSchema = z.object({
  name: z.string().trim().min(1, 'name must be a non-empty string'),
  description: z.string().trim().min(1, 'description must be a non-empty string').optional(),
  color: z.string().trim().min(1, 'color must be a non-empty string').optional(),
  command: z.string().trim().min(1, 'command must be a non-empty string').optional()
});

const preferencesSchema = z.record(
  z.string().regex(/^([1-9]\d{0,4})$/, 'port key must be numeric'),
  preferenceSchema
).superRefine((prefs, ctx) => {
  Object.keys(prefs).forEach((portKey) => {
    const port = Number(portKey);
    if (port < 1 || port > 65535) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'port key must be between 1 and 65535',
        path: [portKey]
      });
    }
  });
});

function readAndValidateJSON(filePath, schema) {
  let json;

  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Invalid JSON in ${filePath}: ${error.message}`);
    process.exit(1);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    console.error(`❌ Invalid config file: ${filePath}`);
    result.error.issues.forEach((issue) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      console.error(`  • ${filePath} -> ${fieldPath}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const defaultConfigPath = path.join(__dirname, '..', 'config.default.json');

  if (fs.existsSync(configPath)) {
    return readAndValidateJSON(configPath, configSchema);
  }

  const config = readAndValidateJSON(defaultConfigPath, configSchema);
  console.log('⚙️  Using default configuration');
  return config;
}

export function loadPreferences() {
  const preferencesPath = path.join(__dirname, '..', 'preferences.json');
  const defaultPreferencesPath = path.join(__dirname, '..', 'preferences.default.json');

  if (fs.existsSync(preferencesPath)) {
    return readAndValidateJSON(preferencesPath, preferencesSchema);
  }

  if (fs.existsSync(defaultPreferencesPath)) {
    return readAndValidateJSON(defaultPreferencesPath, preferencesSchema);
  }

  return {};
}

export function savePreferences(preferences) {
  const preferencesPath = path.join(__dirname, '..', 'preferences.json');
  fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
}
