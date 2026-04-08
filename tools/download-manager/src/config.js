import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionSchema = z.string().trim().min(2, 'extension cannot be empty').startsWith('.', 'extension must start with "."');

const configSchema = z.object({
  watchPath: z.string().trim().min(1, 'watchPath must be a non-empty path'),
  sortedPath: z.string().trim().min(1, 'sortedPath must be a non-empty path'),
  categories: z.record(z.string().trim().min(1, 'category names must be non-empty'), z.array(extensionSchema).min(1, 'each category must include at least one extension')),
  ignoredExtensions: z.array(extensionSchema),
  port: z.number().int().min(1, 'port must be >= 1').max(65535, 'port must be <= 65535'),
  duplicateCheckEnabled: z.boolean()
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
  if (!path.isAbsolute(config.watchPath)) {
    config.watchPath = path.join(__dirname, '..', config.watchPath);
  }
  if (!path.isAbsolute(config.sortedPath)) {
    config.sortedPath = path.join(__dirname, '..', config.sortedPath);
  }

  return config;
}
