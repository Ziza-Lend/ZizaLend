#!/usr/bin/env node

/**
 * Dumps the Swagger/OpenAPI spec JSON from the backend.
 * Usage: node scripts/dump-swagger.mjs > packages/openapi.json
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Use require to load the backend's swagger config
// We need to configure the environment first
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.ENABLE_SWAGGER = 'true';

// Import the swagger spec directly from the backend
const swaggerModule = await import(join(root, 'backend/dist/src/config/swagger.js'));

if (swaggerModule.swaggerSpec) {
  process.stdout.write(JSON.stringify(swaggerModule.swaggerSpec, null, 2));
} else {
  console.error('Swagger spec not found. Build the backend first: cd backend && npm run build');
  process.exit(1);
}
