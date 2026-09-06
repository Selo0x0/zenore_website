import { NotFoundException } from '@nestjs/common';
import type { MailService } from '../mail/mail.service';
import { createGuestOrderAccess } from '../orders/order-access.util';
import type { PrismaService } from '../prisma/prisma.service';
import { PaymentsService, type PaytrCallbackBody } from './payments.service';
import { buildCallbackHash } from './paytr.util';

type PaymentOrder = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingDistrict: string;
  shippingCity: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentReference: string | null;
  guestAccessTokenHash: string | null;
  customer: { firebaseUid: string | null } | null;
  totalKurus: number;
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  discountCode: string | null;
  discountKurus: number;
  items: Array<{
    productName: string;
    unitPriceKurus: number;
    quantity: number;
    lineTotalKurus: number;
  }>;
};

describe('PaymentsService', () => {
  const orderFindUnique = jest.fn<Promise<PaymentOrder | null>, [unknown]>();
  const orderFindFirst = jest.fn<Promise<PaymentOrder | null>, [unknown]>();
  const orderUpdateMany = jest.fn<Promise<{ count: number }>, [unknown]>();
  const paymentAttemptCreate = jest.fn<
    Promise<{ id: string }>,
    [{ data: { orderId: string; merchantOid: string } }]
  >();
  const paymentAttemptFindUnique = jest.fn();
  const paymentAttemptUpdateMany = jest.fn<
    Promise<{ count: number }>,
    [unknown]
  >();
  const transactionClient = {
    order: { updateMany: orderUpdateMany },
    paymentAttempt: {
      create: paymentAttemptCreate,
      updateMany: paymentAttemptUpdateMany,
    },
  };
  const prisma = {
    order: {
      findUnique: orderFindUnique,
      findFirst: orderFindFirst,
      updateMany: orderUpdateMany,
    },
    paymentAttempt: {
      findUnique: paymentAttemptFindUnique,
    },
    discountCode: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (tx: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    ),
  };
  const mail = {
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
  };

  const originalEnv = {
    merchantId: process.env.PAYMENT_MERCHANT_ID,
    merchantKey: process.env.PAYMENT_API_KEY,
    merchantSalt: process.env.PAYMENT_SECRET_KEY,
    corsOrigin: process.env.CORS_ORIGIN,
  };

  let service: PaymentsService;

  beforeAll(() => {
    process.env.PAYMENT_MERCHANT_ID = 'merchant-id';
    process.env.PAYMENT_API_KEY = 'merchant-key';
    process.env.PAYMENT_SECRET_KEY = 'merchant-salt';
    process.env.CORS_ORIGIN = 'https://zenoreatelier.com';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    orderUpdateMany.mockResolvedValue({ count: 1 });
    paymentAttemptUpdateMany.mockResolvedValue({ count: 1 });
    paymentAttemptCreate.mockResolvedValue({ id: 'attempt-id' });
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    restoreEnv('PAYMENT_MERCHANT_ID', originalEnv.merchantId);
    restoreEnv('PAYMENT_API_KEY', originalEnv.merchantKey);
    restoreEnv('PAYMENT_SECRET_KEY', originalEnv.merchantSalt);
    restoreEnv('CORS_ORIGIN', originalEnv.corsOrigin);
  });

  it('rejects a guessed guest order number without its access token', async () => {
    const access = createGuestOrderAccess();
    orderFindUnique.mockResolvedValue(
      paymentOrder({ guestAccessTokenHash: access.hash }),
    );
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      service.initPayment('ZN-20260905-123456', '127.0.0.1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('allows only the Firebase identity that owns a member order', async () => {
    orderFindUnique.mockResolvedValue(
      paymentOrder({
        customerId: 'customer-id',
        customer: { firebaseUid: 'owner-uid' },
      }),
    );
    mockSuccessfulPaytrResponse('member-iframe-token');

    await expect(
      service.initPayment('ZN-20260905-123456', '127.0.0.1', 'other-uid'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.initPayment('ZN-20260905-123456', '127.0.0.1', 'owner-uid'),
    ).resolves.toEqual({ iframeToken: 'member-iframe-token' });
  });

  it('creates a fresh tracked payment attempt on every authorized load', async () => {
    const access = createGuestOrderAccess();
    orderFindUnique.mockResolvedValue(
      paymentOrder({ guestAccessTokenHash: access.hash }),
    );
    mockSuccessfulPaytrResponse('first-token', 'second-token');

    await expect(
      service.initPayment(
        'ZN-20260905-123456',
        '127.0.0.1',
        undefined,
        access.token,
      ),
    ).resolves.toEqual({ iframeToken: 'first-token' });
    await expect(
      service.initPayment(
        'ZN-20260905-123456',
        '127.0.0.1',
        undefined,
        access.token,
      ),
    ).resolves.toEqual({ iframeToken: 'second-token' });

    const attempts = paymentAttemptCreate.mock.calls.map(
      ([call]) => call.data.merchantOid,
    );
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatch(/^[A-Z0-9]+$/);
    expect(attempts[1]).toMatch(/^[A-Z0-9]+$/);
    expect(attempts[0]).not.toBe(attempts[1]);
    expect(orderUpdateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'order-id',
        paymentStatus: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        paymentStatus: 'PENDING',
        paymentReference: attempts[0],
      },
    });
    expect(orderUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: 'order-id',
        paymentStatus: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        paymentStatus: 'PENDING',
        paymentReference: attempts[1],
      },
    });
  });

  it('does not let a stale failed attempt override the current attempt', async () => {
    const order = paymentOrder({ paymentReference: 'NEW-ATTEMPT' });
    paymentAttemptFindUnique.mockResolvedValue({
      id: 'old-attempt-id',
      order,
    });
    const body = callbackBody('OLD-ATTEMPT', 'failed');

    await expect(service.handleCallback(body)).resolves.toBe(true);

    expect(paymentAttemptUpdateMany).toHaveBeenCalledWith({
      where: { id: 'old-attempt-id', status: 'PENDING' },
      data: {
        status: 'FAILED',
        callbackRawResponse: body,
      },
    });
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: order.id,
        paymentReference: 'OLD-ATTEMPT',
        paymentStatus: 'PENDING',
      },
      data: {
        paymentStatus: 'FAILED',
        paymentRawResponse: body,
      },
    });
  });

  it('accepts a successful callback from an older valid attempt', async () => {
    const order = paymentOrder({ paymentReference: 'NEW-ATTEMPT' });
    paymentAttemptFindUnique.mockResolvedValue({
      id: 'old-attempt-id',
      order,
    });
    const body = callbackBody('OLD-ATTEMPT', 'success');

    await expect(service.handleCallback(body)).resolves.toBe(true);

    const successUpdate = orderUpdateMany.mock.calls[0][0] as {
      where: unknown;
      data: {
        paymentStatus: string;
        status: string;
        paidAt: Date;
        paymentReference: string;
        paymentRawResponse: unknown;
      };
    };
    expect(successUpdate.where).toEqual({
      id: order.id,
      paymentStatus: { not: 'PAID' },
    });
    expect(successUpdate.data).toEqual({
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paidAt: expect.any(Date) as Date,
      paymentReference: 'OLD-ATTEMPT',
      paymentRawResponse: body,
    });
    expect(mail.sendOrderConfirmation).toHaveBeenCalledWith(
      order,
      order.customerEmail,
    );
  });

  it('treats a duplicate attempt callback as an idempotent no-op', async () => {
    paymentAttemptFindUnique.mockResolvedValue({
      id: 'attempt-id',
      order: paymentOrder({ paymentReference: 'ATTEMPT' }),
    });
    paymentAttemptUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.handleCallback(callbackBody('ATTEMPT', 'success')),
    ).resolves.toBe(true);

    expect(orderUpdateMany).not.toHaveBeenCalled();
    expect(mail.sendOrderConfirmation).not.toHaveBeenCalled();
  });
});

function paymentOrder(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id: 'order-id',
    orderNumber: 'ZN-20260905-123456',
    customerId: null,
    customerEmail: 'customer@example.com',
    customerName: 'Test Customer',
    customerPhone: '05551112233',
    shippingAddress: 'Test address number 1',
    shippingDistrict: 'Kadikoy',
    shippingCity: 'Istanbul',
    paymentStatus: 'PENDING',
    paymentReference: null,
    guestAccessTokenHash: null,
    customer: null,
    totalKurus: 149990,
    currency: 'TRY',
    subtotalKurus: 149990,
    shippingKurus: 0,
    discountCode: null,
    discountKurus: 0,
    items: [
      {
        productName: 'Leather Wallet',
        unitPriceKurus: 149990,
        quantity: 1,
        lineTotalKurus: 149990,
      },
    ],
    ...overrides,
  };
}

function callbackBody(
  merchantOid: string,
  status: 'success' | 'failed',
): PaytrCallbackBody {
  const totalAmount = '149990';
  return {
    merchant_oid: merchantOid,
    status,
    total_amount: totalAmount,
    hash: buildCallbackHash(
      merchantOid,
      'merchant-salt',
      status,
      totalAmount,
      'merchant-key',
    ),
  };
}

function mockSuccessfulPaytrResponse(...tokens: string[]) {
  jest.spyOn(global, 'fetch').mockImplementation(() => {
    const token = tokens.shift();
    return Promise.resolve(
      new Response(JSON.stringify({ status: 'success', token }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
