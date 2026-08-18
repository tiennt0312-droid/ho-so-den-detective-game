import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

await rm('dist', { recursive: true, force: true });
await run('vinext', ['build']);

const hostingConfig = '.openai/hosting.json';
if (existsSync(hostingConfig)) {
  await mkdir('dist/.openai', { recursive: true });
  await cp(hostingConfig, 'dist/.openai/hosting.json');
}
