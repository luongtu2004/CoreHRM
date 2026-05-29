import app from './app';
import { env } from './config/env';
import { startAbsentCron } from './jobs/absent.cron';
import { createServer } from 'http';
import { initSocket } from './utils/socket';

const startServer = () => {
  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    startAbsentCron(); // Khởi động cron job đánh dấu vắng mặt
  });
};

startServer();


