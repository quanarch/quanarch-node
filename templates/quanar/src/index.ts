import { appConfig } from './config';
import { createHttpServer, createLogger } from './core';
import { quanService, systemHandler } from './services';

const log = createLogger('quanar');

async function main() {
  const server = createHttpServer(systemHandler);
  server.listen(appConfig.port, () => log.info(`listening on http://localhost:${appConfig.port}`));

  quanService.start();

  const stop = async () => {
    log.info('stopping');
    await quanService.stop();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

void main();
