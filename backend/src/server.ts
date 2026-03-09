import { createApp } from './app';
import { config } from '@config/env';

const start = async () => {
  try {
    const app = await createApp();

    await app.listen({ port: config.server.port, host: config.server.host });

    console.log(`✓ Server running on http://${config.server.host}:${config.server.port}`);
    console.log(`✓ Environment: ${config.server.nodeEnv}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
