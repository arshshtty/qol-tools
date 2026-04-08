import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nonEmptyString = z.string().trim().min(1, 'value must be a non-empty string');

const configSchema = z.object({
  scanPath: nonEmptyString,
  baseBranches: z.array(nonEmptyString).min(1, 'baseBranches must include at least one branch'),
  protectedBranches: z.array(nonEmptyString).min(1, 'protectedBranches must include at least one branch'),
  port: z.number().int().min(1, 'port must be >= 1').max(65535, 'port must be <= 65535'),
  autoRefresh: z.boolean(),
  refreshInterval: z.number().int().positive('refreshInterval must be > 0'),
  showUnmerged: z.boolean(),
  groupByRepo: z.boolean()
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

  let config;

  if (fs.existsSync(configPath)) {
    config = readAndValidateConfig(configPath);
  } else {
    config = readAndValidateConfig(defaultConfigPath);
    console.log('⚙️  Using default configuration');
  }

  // Convert relative paths to absolute
  if (!path.isAbsolute(config.scanPath)) {
    config.scanPath = path.resolve(process.cwd(), config.scanPath);
  }

  return config;
}
