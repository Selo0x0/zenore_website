import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function createMerchantOid(orderNumber: string): string {
  const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(5).toString('hex').toUpperCase();

  return `${safeOrderNumber}${timestamp}${random}`.slice(0, 64);
}

export type GetTokenHashParams = {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasket: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: number;
};

export function buildGetTokenHash(
  params: GetTokenHashParams,
  merchantKey: string,
  merchantSalt: string,
): string {
  const hashStr =
    params.merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    params.paymentAmount +
    params.userBasket +
    params.noInstallment +
    params.maxInstallment +
    params.currency +
    params.testMode;

  return createHmac('sha256', merchantKey)
    .update(hashStr + merchantSalt)
    .digest('base64');
}

export function buildCallbackHash(
  merchantOid: string,
  merchantSalt: string,
  status: string,
  totalAmount: string,
  merchantKey: string,
): string {
  return createHmac('sha256', merchantKey)
    .update(merchantOid + merchantSalt + status + totalAmount)
    .digest('base64');
}

export function verifyCallbackHash(
  merchantOid: string,
  merchantSalt: string,
  status: string,
  totalAmount: string,
  merchantKey: string,
  receivedHash: string,
): boolean {
  const expected = buildCallbackHash(
    merchantOid,
    merchantSalt,
    status,
    totalAmount,
    merchantKey,
  );

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(receivedHash, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export type BasketItem = {
  productName: string;
  unitPriceKurus: number;
  quantity: number;
};

export function buildUserBasket(items: BasketItem[]): string {
  const basket = items.map((item) => [
    item.productName,
    (item.unitPriceKurus / 100).toFixed(2),
    item.quantity,
  ]);

  return Buffer.from(JSON.stringify(basket)).toString('base64');
}
