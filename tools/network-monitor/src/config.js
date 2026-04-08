import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configSchema = z.object({
  scanInterval: z.number().int().positive('scanInterval must be > 0'),
  scanTimeout: z.number().int().positive('scanTimeout must be > 0'),
  port: z.number().int().min(1, 'port must be >= 1').max(65535, 'port must be <= 65535'),
  enableAlerts: z.boolean(),
  alertSound: z.boolean(),
  knownDevices: z.record(z.unknown()),
  autoScan: z.boolean(),
  pingCount: z.number().int().positive('pingCount must be > 0')
});

function readAndValidateConfig(filePath) {
  let json;

  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Invalid JSON in ${filePath}: ${error.message}`);
    process.exit(1);
  }

  const result = configSchema.safeParse(json);
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
    return readAndValidateConfig(configPath);
  }

  const config = readAndValidateConfig(defaultConfigPath);
  console.log('⚙️  Using default configuration');
  return config;
}

export function saveConfig(config) {
  const configPath = path.join(__dirname, '..', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
