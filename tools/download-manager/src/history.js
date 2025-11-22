import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '..', 'history.json');
const MAX_HISTORY_ENTRIES = 1000;

let history = [];

export function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading history:', error.message);
    history = [];
  }
}

export function addHistoryEntry(entry) {
  history.unshift({
    ...entry,
    timestamp: new Date().toISOString()
  });

  // Keep only last N entries
  if (history.length > MAX_HISTORY_ENTRIES) {
    history = history.slice(0, MAX_HISTORY_ENTRIES);
  }

  saveHistory();
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving history:', error.message);
  }
}

export function getHistory(limit = 100) {
  return history.slice(0, limit);
}

export function clearHistory() {
  history = [];
  saveHistory();
}

// Load history on module import
loadHistory();
