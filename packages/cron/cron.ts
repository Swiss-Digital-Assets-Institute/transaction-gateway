import { CronJob } from 'cron';
import { main } from './main';

new CronJob(
  '0,15,30,45 * * * *', // cronTime
  main,
  null, // onComplete
  true, // start
  null, // timeZone
  null, // context
  true, // runOnInit
);
