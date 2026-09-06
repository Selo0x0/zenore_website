const STORAGE_PREFIX = "zenore:order-access:";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function storeGuestOrderAccessToken(
  orderNumber: string,
  token: string,
) {
  if (!TOKEN_PATTERN.test(token)) return;
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${orderNumber}`, token);
}

export function getGuestOrderAccessToken(orderNumber: string) {
  const token = window.sessionStorage.getItem(
    `${STORAGE_PREFIX}${orderNumber}`,
  );
  return token && TOKEN_PATTERN.test(token) ? token : undefined;
}

export function getGuestOrderAccessHeaders(orderNumber: string) {
  const token = getGuestOrderAccessToken(orderNumber);
  return token ? { "X-Order-Access-Token": token } : undefined;
}
