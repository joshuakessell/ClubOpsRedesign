import 'reflect-metadata';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../../.env.test');
const result = dotenv.config({ path: envPath });
if (result.error) {
  throw result.error;
}

if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
  throw new Error(`Refusing to run tests without a test database. DB_NAME=${process.env.DB_NAME ?? 'undefined'}`);
}

process.env.NODE_ENV = 'test';
