// k6 load test: endpoints públicos de Kidsfun
// Usage:
//   k6 run apps/api/test/load/basic_endpoints.js
//
// Verifica que Fase A/B (índices + query rewrites) mejora el throughput
// en los endpoints públicos más usados.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 50 },  // ramp up to 50 users
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de requests < 500ms
    http_req_failed: ['rate<0.01'],    // <1% de errores
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // 1. Catálogo de productos
  let res = http.get(`${BASE}/api/products`);
  check(res, {
    'products: status 200': (r) => r.status === 200,
    'products: items array': (r) => Array.isArray(r.json('items')),
    'products: latency < 300ms': (r) => r.timings.duration < 300,
  });

  // 2. Productos por categoría
  res = http.get(`${BASE}/api/products/category/option1`);
  check(res, {
    'category: status 200': (r) => r.status === 200,
    'category: latency < 300ms': (r) => r.timings.duration < 300,
  });

  // 3. Lista de eventos
  res = http.get(`${BASE}/api/events`);
  check(res, {
    'events: status 200': (r) => r.status === 200,
    'events: latency < 200ms': (r) => r.timings.duration < 200,
  });

  // 4. Verificar waiver por QR (cualquier QR válido)
  res = http.get(`${BASE}/api/v2/waiver/verify/ABC12345`);
  check(res, {
    'verify: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}