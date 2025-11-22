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

  return config;
}

export function loadPreferences() {
  const preferencesPath = path.join(__dirname, '..', 'preferences.json');
  const defaultPreferencesPath = path.join(__dirname, '..', 'preferences.default.json');

  if (fs.existsSync(preferencesPath)) {
    return JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
  } else if (fs.existsSync(defaultPreferencesPath)) {
    return JSON.parse(fs.readFileSync(defaultPreferencesPath, 'utf8'));
  }

  return {};
}

export function savePreferences(preferences) {
  const preferencesPath = path.join(__dirname, '..', 'preferences.json');
  fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
}
