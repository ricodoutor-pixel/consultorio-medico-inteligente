import fs from 'node:fs';

/** Atomic startup lock: a second worker must not poll and send concurrently. */
export function acquireBrisaWorkerLock(file, pid = process.pid, isAlive = (owner) => {
  try { process.kill(owner, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(file, String(pid), { flag: 'wx', mode: 0o600 });
      return () => {
        if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === String(pid)) fs.unlinkSync(file);
      };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const owner = Number(fs.readFileSync(file, 'utf8'));
      if (!Number.isInteger(owner) || owner <= 0 || isAlive(owner)) return null;
      fs.unlinkSync(file);
    }
  }
  return null;
}