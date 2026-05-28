import app from './app';
import { env } from './config/env';
import { startAbsentCron } from './jobs/absent.cron';

const startServer = () => {
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    startAbsentCron(); // Khởi động cron job đánh dấu vắng mặt
  });
};

startServer();


