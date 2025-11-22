import path from 'path';

export function categorizeFile(filename, categories) {
  const ext = path.extname(filename).toLowerCase();

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'other';
}

export function shouldIgnoreFile(filename, ignoredExtensions) {
  const ext = path.extname(filename).toLowerCase();
  return ignoredExtensions.includes(ext);
}
