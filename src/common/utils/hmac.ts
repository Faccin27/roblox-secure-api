import * as crypto from 'crypto';

export function validateSignature(
  body: any,
  secret: string,
  signature: string,
  timestamp: string,
) {
  const payload = JSON.stringify(body);
  const data = `${timestamp}.${payload}`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  return expected === signature;
}
