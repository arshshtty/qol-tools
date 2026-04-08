import { execFile } from 'child_process';

export function runCommand(command, args, options = {}) {
  const { timeout = 5000, cwd } = options;

  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, timeout }, (error, stdout, stderr) => {
      if (error) {
        const details = stderr?.trim() || error.message;
        const wrapped = new Error(`Command failed: ${command} ${args.join(' ')} - ${details}`);
        wrapped.cause = error;
        reject(wrapped);
        return;
      }

      resolve({
        stdout: stdout ?? '',
        stderr: stderr ?? ''
      });
    });
  });
}
