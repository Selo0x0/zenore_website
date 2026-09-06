import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { createGuestOrderAccess } from './order-access.util';
import { OrdersService } from './orders.service';

const productImageUrl = '/uploads/products/classic-leather-wallet-1.webp';

type ProductFixture = {
  id: string;
  name: string;
  slug: string;
  priceKurus: number;
  currency: string;
  stockQuantity: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
};

type ProductFindManyArgs = {
  where: {
    id: {
      in: string[];
    };
    status: 'ACTIVE';
  };
  select: unknown;
};

type OrderItemCreateData = {
  productId: string;
  productName: string;
  productSlug: string;
  unitPriceKurus: number;
  quantity: number;
  lineTotalKurus: number;
  productImageUrl?: string;
  productImageAlt?: string | null;
};

type OrderCreateArgs = {
  data: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingName: string;
    shippingPhone: string;
    shippingCity: string;
    shippingDistrict: string;
    shippingAddress: string;
    currency: string;
    subtotalKurus: number;
    shippingKurus: number;
    totalKurus: number;
    guestAccessTokenHash?: string;
    items: {
      create: OrderItemCreateData[];
    };
  };
  select: unknown;
};

type CreatedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  totalKurus: number;
  createdAt: Date;
  items: OrderItemCreateData[];
};

type AccessibleOrder = CreatedOrder & {
  discountCode: string | null;
  discountKurus: number;
  guestAccessTokenHash: string | null;
  customer: { firebaseUid: string | null } | null;
};

describe('OrdersService', () => {
  const createOrderDto = {
    customerName: 'Moath',
    customerEmail: 'moath@example.com',
    customerPhone: '+905551112233',
    shippingName: 'Moath',
    shippingPhone: '+905551112233',
    shippingCity: 'Istanbul',
    shippingDistrict: 'Kadikoy',
    shippingAddress: 'Test address',
    items: [
      {
        productId: 'product-id',
        quantity: 2,
      },
    ],
  };

  const product: ProductFixture = {
    id: 'product-id',
    name: 'Classic Leather Wallet',
    slug: 'classic-leather-wallet',
    priceKurus: 149990,
    currency: 'TRY',
    stockQuantity: 12,
    images: [
      {
        url: productImageUrl,
        alt: 'Classic leather wallet front view',
      },
    ],
  };

  const orderCreate = jest.fn<Promise<CreatedOrder>, [OrderCreateArgs]>();
  const orderFindUnique = jest.fn<Promise<AccessibleOrder | null>, [unknown]>();

  const tx = {
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    discountCode: {
      update: jest.fn(),
    },
    order: {
      create: orderCreate,
    },
  };

  const prisma = {
    product: {
      findMany: jest.fn<Promise<ProductFixture[]>, [ProductFindManyArgs]>(),
    },
    order: {
      create: orderCreate,
      findUnique: orderFindUnique,
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
  };

  const discounts = { validateCode: jest.fn() };
  const shipping = { calculateShippingKurus: jest.fn().mockResolvedValue(0) };

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(
      prisma as unknown as PrismaService,
      discounts as any,
      shipping as any,
    );
  });

  it('creates an order using database product prices', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.order.create.mockResolvedValue({
      id: 'order-id',
      orderNumber: 'ZN-20260628-123456',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      currency: 'TRY',
      subtotalKurus: 299980,
      shippingKurus: 0,
      totalKurus: 299980,
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      items: [],
    });

    const order = await service.createOrder(createOrderDto);
    const productFindManyArgs = prisma.product.findMany.mock.calls[0]?.[0];
    const orderCreateArgs = prisma.order.create.mock.calls[0]?.[0];

    expect(productFindManyArgs?.where).toEqual({
      id: {
        in: ['product-id'],
      },
      status: 'ACTIVE',
    });

    expect(orderCreateArgs?.data.customerName).toBe('Moath');
    expect(orderCreateArgs?.data.currency).toBe('TRY');
    expect(orderCreateArgs?.data.subtotalKurus).toBe(299980);
    expect(orderCreateArgs?.data.shippingKurus).toBe(0);
    expect(orderCreateArgs?.data.totalKurus).toBe(299980);
    expect(orderCreateArgs?.data.guestAccessTokenHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(orderCreateArgs?.data.items.create).toEqual([
      {
        productId: 'product-id',
        productName: 'Classic Leather Wallet',
        productSlug: 'classic-leather-wallet',
        unitPriceKurus: 149990,
        quantity: 2,
        lineTotalKurus: 299980,
        productImageUrl,
        productImageAlt: 'Classic leather wallet front view',
      },
    ]);

    expect(order).toEqual(
      expect.objectContaining({
        id: 'order-id',
        subtotalKurus: 299980,
        totalKurus: 299980,
      }),
    );
    expect(order.guestAccessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('requires the exact guest token to read a guest order', async () => {
    const access = createGuestOrderAccess();
    orderFindUnique.mockResolvedValue({
      id: 'order-id',
      orderNumber: 'ZN-20260628-123456',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      currency: 'TRY',
      subtotalKurus: 149990,
      shippingKurus: 0,
      discountCode: null,
      discountKurus: 0,
      totalKurus: 149990,
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      items: [],
      guestAccessTokenHash: access.hash,
      customer: null,
    });

    await expect(
      service.findAccessibleByOrderNumber('ZN-20260628-123456'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findAccessibleByOrderNumber(
        'ZN-20260628-123456',
        undefined,
        'wrong-token',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    const order = await service.findAccessibleByOrderNumber(
      'ZN-20260628-123456',
      undefined,
      access.token,
    );
    expect(order.orderNumber).toBe('ZN-20260628-123456');
    expect(order).not.toHaveProperty('guestAccessTokenHash');
    expect(order).not.toHaveProperty('customer');
  });

  it('allows only the owning Firebase identity to read a member order', async () => {
    orderFindUnique.mockResolvedValue({
      id: 'order-id',
      orderNumber: 'ZN-20260628-654321',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      currency: 'TRY',
      subtotalKurus: 149990,
      shippingKurus: 0,
      discountCode: null,
      discountKurus: 0,
      totalKurus: 149990,
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      items: [],
      guestAccessTokenHash: null,
      customer: { firebaseUid: 'owner-uid' },
    });

    await expect(
      service.findAccessibleByOrderNumber(
        'ZN-20260628-654321',
        'different-uid',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findAccessibleByOrderNumber('ZN-20260628-654321', 'owner-uid'),
    ).resolves.toEqual(
      expect.objectContaining({ orderNumber: 'ZN-20260628-654321' }),
    );
  });

  it('combines duplicate cart lines for the same product', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.order.create.mockResolvedValue({
      id: 'order-id',
      orderNumber: 'ZN-20260628-123456',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      currency: 'TRY',
      subtotalKurus: 449970,
      shippingKurus: 0,
      totalKurus: 449970,
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      items: [],
    });

    await service.createOrder({
      ...createOrderDto,
      items: [
        {
          productId: 'product-id',
          quantity: 1,
        },
        {
          productId: 'product-id',
          quantity: 2,
        },
      ],
    });

    const productFindManyArgs = prisma.product.findMany.mock.calls[0]?.[0];
    const orderCreateArgs = prisma.order.create.mock.calls[0]?.[0];

    expect(productFindManyArgs?.where.id.in).toEqual(['product-id']);
    expect(orderCreateArgs?.data.subtotalKurus).toBe(449970);
    expect(orderCreateArgs?.data.items.create).toEqual([
      expect.objectContaining({
        quantity: 3,
        lineTotalKurus: 449970,
      }),
    ]);
  });

  it('rejects an empty cart', async () => {
    await expect(
      service.createOrder({
        ...createOrderDto,
        items: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unavailable products', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.createOrder(createOrderDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects quantities above available stock', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        ...product,
        stockQuantity: 1,
      },
    ]);

    await expect(service.createOrder(createOrderDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects invalid email addresses', async () => {
    await expect(
      service.createOrder({
        ...createOrderDto,
        customerEmail: 'not-an-email',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid phone numbers', async () => {
    await expect(
      service.createOrder({
        ...createOrderDto,
        customerPhone: 'abcdefg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects short shipping addresses', async () => {
    await expect(
      service.createOrder({
        ...createOrderDto,
        shippingAddress: 'short',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
