const GIT_REF_SAFE_PATTERN = /^(?!-)(?!.*\.\.)(?!.*\/\/)(?!.*@$)(?!.*\.$)[A-Za-z0-9._/-]+$/;

export function isSafeGitRefName(name) {
  return typeof name === 'string' && GIT_REF_SAFE_PATTERN.test(name);
}

export function assertSafeGitRefName(name, label = 'branch') {
  if (!isSafeGitRefName(name)) {
    throw new Error(`Unsafe ${label} name: ${name}`);
  }
}
