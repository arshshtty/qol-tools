import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const defaultConfigPath = path.join(__dirname, '..', 'config.default.json');

  let config;

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
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
