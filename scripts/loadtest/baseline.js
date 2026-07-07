import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
  const WALLET_SEED = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

  const endpoints = [
    `${BASE_URL}/api/v1/pool/stats`,
    `${BASE_URL}/api/v1/loans`,
    `${BASE_URL}/api/v1/score/${WALLET_SEED}`
  ];

  for (const endpoint of endpoints) {
    const res = http.get(endpoint);
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
