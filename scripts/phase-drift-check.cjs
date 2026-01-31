#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiSrc = path.join(root, 'services', 'api', 'src');
const openapiPath = path.join(root, 'openapi.yaml');

const forbiddenSegments = new Set([
  'payments',
  'pricing',
  'orders',
  'cash_drawers',
  'cashdrawer',
  'timeclock',
  'shifts',
  'telemetry',
  'websocket',
  'websockets',
  'gateway',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function findForbiddenPaths() {
  const files = walk(apiSrc);
  const violations = [];
  for (const file of files) {
    const rel = path.relative(apiSrc, file);
    const segments = rel.split(path.sep).map((part) => part.toLowerCase());
    for (const segment of segments) {
      const clean = segment.replace(/\.[^.]+$/, '');
      if (forbiddenSegments.has(clean)) {
        violations.push(rel);
        break;
      }
    }
  }
  return violations;
}

function readOpenapiPaths() {
  const content = fs.readFileSync(openapiPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const paths = new Set();
  let inPaths = false;
  for (const line of lines) {
    if (line.startsWith('paths:')) {
      inPaths = true;
      continue;
    }
    if (inPaths && line.startsWith('components:')) {
      break;
    }
    if (!inPaths) continue;
    const match = line.match(/^\s{2}(\/[^:]+):\s*$/);
    if (match) {
      paths.add(match[1]);
    }
  }
  return paths;
}

function normalizePath(rawPrefix, rawRoute) {
  const prefix = rawPrefix.trim();
  const route = (rawRoute ?? '').trim();

  let full = prefix;
  if (route.length > 0) {
    const joiner = full.endsWith('/') || route.startsWith('/') ? '' : '/';
    full = `${full}${joiner}${route}`;
  }

  full = full.replace(/^\/?v1\/?/, '');
  full = full.replace(/\/+/g, '/');
  if (!full.startsWith('/')) {
    full = `/${full}`;
  }
  full = full.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  if (full.length > 1 && full.endsWith('/')) {
    full = full.slice(0, -1);
  }
  return full;
}

function findControllerRoutes() {
  const files = walk(apiSrc).filter((file) => file.endsWith('.ts'));
  const routes = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const controllers = [];
    const controllerRegex = /@Controller\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = controllerRegex.exec(content))) {
      controllers.push({ prefix: match[1], index: match.index });
    }
    if (controllers.length === 0) continue;

    for (let i = 0; i < controllers.length; i++) {
      const start = controllers[i].index;
      const end = i + 1 < controllers.length ? controllers[i + 1].index : content.length;
      const segment = content.slice(start, end);
      const routeRegex = /@(Get|Post|Patch|Put|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;
      let routeMatch;
      while ((routeMatch = routeRegex.exec(segment))) {
        const route = routeMatch[2] ?? '';
        routes.push({ prefix: controllers[i].prefix, route, file });
      }
    }
  }

  return routes;
}

function checkOpenapiCoverage() {
  const openapiPaths = readOpenapiPaths();
  const routes = findControllerRoutes();
  const missing = [];
  const routePaths = new Set();

  for (const route of routes) {
    const normalized = normalizePath(route.prefix, route.route);
    routePaths.add(normalized);
    if (!openapiPaths.has(normalized)) {
      missing.push({ path: normalized, file: path.relative(root, route.file) });
    }
  }

  const extras = [];
  for (const pathEntry of openapiPaths) {
    if (!routePaths.has(pathEntry)) {
      extras.push(pathEntry);
    }
  }

  return { missing, extras };
}

function main() {
  const forbidden = findForbiddenPaths();
  const { missing, extras } = checkOpenapiCoverage();

  if (forbidden.length === 0 && missing.length === 0 && extras.length === 0) {
    console.log('Phase drift check passed.');
    return;
  }

  if (forbidden.length > 0) {
    console.error('Forbidden domains detected in services/api/src:');
    for (const item of forbidden) {
      console.error(`- ${item}`);
    }
  }

  if (missing.length > 0) {
    console.error('Controller routes missing from openapi.yaml:');
    for (const item of missing) {
      console.error(`- ${item.path} (${item.file})`);
    }
  }

  if (extras.length > 0) {
    console.error('OpenAPI paths missing controller routes:');
    for (const item of extras) {
      console.error(`- ${item}`);
    }
  }

  process.exit(1);
}

main();
