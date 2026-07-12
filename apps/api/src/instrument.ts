import { config } from 'dotenv';

// Loaded before Nest's own ConfigModule runs, so must read the .env file directly here
config({ path: '../../.env' });
config();

import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0.1,
});
