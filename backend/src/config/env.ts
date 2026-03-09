import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  database: {
    url: string;
  };
  server: {
    nodeEnv: 'development' | 'production' | 'test';
    port: number;
    host: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

const getConfig = (): Config => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  return {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/moneymess',
    },
    server: {
      nodeEnv,
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    },
  };
};

export const config = getConfig();
