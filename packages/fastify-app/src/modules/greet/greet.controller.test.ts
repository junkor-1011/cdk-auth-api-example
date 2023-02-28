import { mockDeep } from 'vitest-mock-extended';

import { greetHandler } from './greet.controller.js';
import { describe, expect, it } from 'vitest';

type HandlerParams = Parameters<typeof greetHandler>;
type HandlerRequest = HandlerParams[0];
type HandlerReply = HandlerParams[1];

describe('greetHandler', () => {
  it('authorization header error', async () => {
    const mockRequest = mockDeep<HandlerRequest>();
    const mockReply = mockDeep<HandlerReply>();

    mockRequest.headers.authorization = undefined;

    await greetHandler(mockRequest, mockReply);

    expect(mockRequest.log.error).toHaveBeenCalledTimes(2);
    expect(mockRequest.log.error).toHaveBeenCalledWith('There is no headers');
    expect(mockRequest.log.error).toHaveBeenCalledWith(mockRequest);

    expect(mockReply.internalServerError).toHaveBeenCalledTimes(1);
  });
});
