/**
 * callbackJournal.js — Durable Outbox Journal for Terminal Callbacks.
 *
 * Guarantees that terminal run state (completed/errored) is never silently lost
 * if a transient network partition or server restart occurs when execution finishes.
 */

const fs = require('fs');
const path = require('path');

const OUTBOX_DIR = process.env.FLOWTRACE_OUTBOX_DIR || path.join(process.cwd(), '.flowtrace-outbox');

function ensureDir() {
  try {
    if (!fs.existsSync(OUTBOX_DIR)) {
      fs.mkdirSync(OUTBOX_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore if directory already created by another thread
  }
}

class CallbackJournal {
  static save(id, suffix, url, payload, token) {
    try {
      ensureDir();
      const filePath = path.join(OUTBOX_DIR, `${id}-${suffix}.json`);
      const data = {
        id,
        suffix,
        url,
        payload,
        token,
        createdAt: Date.now(),
        attempts: 0,
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return filePath;
    } catch (err) {
      console.warn(`[CallbackJournal] Failed to persist outbox entry: ${err.message}`);
      return null;
    }
  }

  static list() {
    try {
      ensureDir();
      const files = fs.readdirSync(OUTBOX_DIR).filter((f) => f.endsWith('.json'));
      return files.map((file) => {
        const filePath = path.join(OUTBOX_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          return { file, filePath, ...JSON.parse(content) };
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  static remove(fileOrPath) {
    try {
      const fullPath = path.isAbsolute(fileOrPath) ? fileOrPath : path.join(OUTBOX_DIR, fileOrPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.warn(`[CallbackJournal] Failed to remove entry: ${err.message}`);
    }
  }

  static async flushAll(log = console.log) {
    const entries = CallbackJournal.list();
    if (!entries.length) return 0;

    let flushed = 0;
    for (const entry of entries) {
      try {
        const res = await fetch(entry.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(entry.token ? { authorization: `Bearer ${entry.token}` } : {}),
          },
          body: JSON.stringify(entry.payload),
        });

        if (res.ok || res.status === 409) {
          // 200 OK or 409 Fencing/Cancelled means server acknowledged verdict
          CallbackJournal.remove(entry.filePath);
          flushed++;
          log(`[CallbackJournal] Flushed pending outbox entry for ${entry.id} (${entry.suffix})`);
        } else {
          entry.attempts = (entry.attempts || 0) + 1;
        }
      } catch (err) {
        log(`[CallbackJournal] Flush attempt failed for ${entry.id}: ${err.message}`);
      }
    }
    return flushed;
  }
}

module.exports = { CallbackJournal, OUTBOX_DIR };
