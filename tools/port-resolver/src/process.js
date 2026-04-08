import { runCommand } from './command.js';

const SAFE_PID_PATTERN = /^\d+$/;

export function sanitizePid(pid) {
  const normalized = String(pid).trim();

  if (!SAFE_PID_PATTERN.test(normalized)) {
    throw new Error(`Invalid process id: ${pid}`);
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid process id: ${pid}`);
  }

  return parsed;
}

export function buildTaskkillArgs(pid, force = true) {
  const safePid = sanitizePid(pid);
  const args = ['/PID', String(safePid)];

  if (force) {
    args.push('/F');
  }

  return args;
}

export async function terminateProcess(pid, platform = process.platform) {
  const safePid = sanitizePid(pid);

  if (platform === 'win32') {
    await runCommand('taskkill', buildTaskkillArgs(safePid), { timeout: 5000 });
    return;
  }

  process.kill(safePid, 'SIGKILL');
}
