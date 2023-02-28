/* eslint-disable @typescript-eslint/unbound-method */

import {
  mockDeep,
  // mockFn,
} from 'vitest-mock-extended';

import { greetHandler } from './greet.controller.js';
import { describe, expect, it } from 'vitest';

type HandlerParams = Parameters<typeof greetHandler>;
type HandlerRequest = HandlerParams[0];
type HandlerReply = HandlerParams[1];

/**
 * from https://www.rfc-editor.org/rfc/rfc7519#section-3.1
 */
const jwtTokenExample =
  'eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

const jwtPayloadExample = {
  iss: 'joe',
  exp: 1300819380,
  'http://example.com/is_root': true,
};

describe('greetHandler', () => {
  it('normal', async () => {
    const mockRequest = mockDeep<HandlerRequest>();
    const mockReply = mockDeep<HandlerReply>();

    const mockReplyWithCode = mockDeep<ReturnType<HandlerReply['code']>>();

    mockRequest.headers.authorization = jwtTokenExample;
    // mockReply.code = mockFn<HandlerReply['code']>();
    mockReply.code.calledWith(200).mockReturnValue(mockReplyWithCode);

    await greetHandler(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledTimes(1);
    expect(mockReply.code).toHaveBeenCalledWith(200);

    expect(mockReplyWithCode.send).toHaveBeenCalledTimes(1);
    expect(mockReplyWithCode.send).toHaveBeenCalledWith({
      message: 'hello',
      jwtPayloads: jwtPayloadExample,
    });
  });

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

  it('jwt parse error', async () => {
    const mockRequest = mockDeep<HandlerRequest>();
    const mockReply = mockDeep<HandlerReply>();

    const wrongAuthorizationHeader = 'xxx';

    mockRequest.headers.authorization = wrongAuthorizationHeader;

    await greetHandler(mockRequest, mockReply);

    expect(mockRequest.log.error).toHaveBeenCalledTimes(2);
    expect(mockRequest.log.error).toHaveBeenCalledWith(wrongAuthorizationHeader);
    expect(mockRequest.log.error).toHaveBeenCalledWith(new Error('jwt format error'));

    expect(mockReply.internalServerError).toHaveBeenCalledTimes(1);
  });
});
