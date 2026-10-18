import { appConfig } from './config';
import { createApp, createLogger, database } from './core';
import { quanService, systemRouter } from './services';

const log = createLogger('quanar');

const server = createApp(systemRouter()).listen(appConfig.port, () => log.info(`listening on http://localhost:${appConfig.port}`));
quanService.start();

const stop = async () => {
  log.info('stopping');
  await quanService.stop();
  server.close(() => {
    database.close();
    process.exit(0);
  });
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
