import { logger } from '../utils/logger.js';

export function startPolling(client, onUpdate) {
  let offset = 0;
  let stopped = false;

  async function loop() {
    while (!stopped) {
      try {
        const result = await client.getUpdates(offset);
        if (result.ok && result.result.length) {
          for (const update of result.result) {
            offset = update.update_id + 1;
            try {
              await onUpdate(update);
            } catch (err) {
              logger.error('error handling update', err);
            }
          }
        }
      } catch (err) {
        logger.error('polling error, retrying in 3s', err);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  loop();
  return {
    stop() {
      stopped = true;
    },
  };
}
