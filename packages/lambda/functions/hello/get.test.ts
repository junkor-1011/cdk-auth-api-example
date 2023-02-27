import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { APIGatewayProxyEvent } from 'aws-lambda';
// import axios from 'axios';
import { lambdaHandler } from './get.js';

// vi.mock('axios');

afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
});

describe('lambdaHandler', () => {
  it('get(normal)', async () => {
    const event = mock<APIGatewayProxyEvent>();

    const response = await lambdaHandler(event);

    expect(response.statusCode).toBe(200);
    const responsePayload = JSON.parse(response.body) as Record<string, unknown>;
    expect(responsePayload?.message).toBe('hello world');
  });
});
