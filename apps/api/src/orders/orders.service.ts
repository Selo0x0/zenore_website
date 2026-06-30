import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export type CreateOrderDto = {
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  shippingName?: unknown;
  shippingPhone?: unknown;
  shippingCity?: unknown;
  shippingDistrict?: unknown;
  shippingAddress?: unknown;
  items?: unknown;
};

type NormalizedOrderItem = {
  productId: string;
  quantity: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9 ()-]+$/;
const letterPattern = /\p{L}/u;

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  currency: true,
  subtotalKurus: true,
  shippingKurus: true,
  totalKurus: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSlug: true,
      unitPriceKurus: true,
      quantity: true,
      lineTotalKurus: true,
      productImageUrl: true,
      productImageAlt: true,
    },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const customer = this.validateCustomer(createOrderDto);
    const items = this.normalizeItems(createOrderDto.items);
    const productIds = items.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        priceKurus: true,
        currency: true,
        stockQuantity: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1,
          select: {
            url: true,
            alt: true,
          },
        },
      },
    });

    if (products.length !== items.length) {
      throw new BadRequestException('One or more products are unavailable.');
    }

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const currency = products[0]?.currency ?? 'TRY';

    const orderItems = items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new BadRequestException('One or more products are unavailable.');
      }

      if (product.currency !== currency) {
        throw new BadRequestException('Mixed currencies are not supported.');
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `${product.name} does not have enough stock.`,
        );
      }

      const image = product.images[0];
      const lineTotalKurus = product.priceKurus * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPriceKurus: product.priceKurus,
        quantity: item.quantity,
        lineTotalKurus,
        productImageUrl: image?.url,
        productImageAlt: image?.alt,
      };
    });

    const subtotalKurus = orderItems.reduce(
      (total, item) => total + item.lineTotalKurus,
      0,
    );
    const shippingKurus = 0;
    const totalKurus = subtotalKurus + shippingKurus;

    return this.prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `${item.productName} does not have enough stock.`,
          );
        }
      }

      return tx.order.create({
        data: {
          orderNumber: this.createOrderNumber(),
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          shippingName: customer.shippingName,
          shippingPhone: customer.shippingPhone,
          shippingCity: customer.shippingCity,
          shippingDistrict: customer.shippingDistrict,
          shippingAddress: customer.shippingAddress,
          currency,
          subtotalKurus,
          shippingKurus,
          totalKurus,
          items: {
            create: orderItems,
          },
        },
        select: orderSelect,
      });
    });
  }

  private validateCustomer(createOrderDto: CreateOrderDto) {
    return {
      customerName: this.getValidatedText(
        createOrderDto.customerName,
        'customerName',
        2,
        80,
        true,
      ),
      customerEmail: this.getEmail(createOrderDto.customerEmail),
      customerPhone: this.getPhone(
        createOrderDto.customerPhone,
        'customerPhone',
      ),
      shippingName: this.getValidatedText(
        createOrderDto.shippingName,
        'shippingName',
        2,
        80,
        true,
      ),
      shippingPhone: this.getPhone(
        createOrderDto.shippingPhone,
        'shippingPhone',
      ),
      shippingCity: this.getValidatedText(
        createOrderDto.shippingCity,
        'shippingCity',
        2,
        80,
        true,
      ),
      shippingDistrict: this.getValidatedText(
        createOrderDto.shippingDistrict,
        'shippingDistrict',
        2,
        80,
        true,
      ),
      shippingAddress: this.getValidatedText(
        createOrderDto.shippingAddress,
        'shippingAddress',
        10,
        500,
        false,
      ),
    };
  }

  private normalizeItems(items: unknown): NormalizedOrderItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must contain at least one product.');
    }

    const quantitiesByProductId = new Map<string, number>();

    items.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new BadRequestException(`items[${index}] must be an object.`);
      }

      const productId = this.getRequiredString(
        (item as { productId?: unknown }).productId,
        `items[${index}].productId`,
      );
      const quantity = this.getQuantity(
        (item as { quantity?: unknown }).quantity,
        `items[${index}].quantity`,
      );

      quantitiesByProductId.set(
        productId,
        (quantitiesByProductId.get(productId) ?? 0) + quantity,
      );
    });

    return Array.from(quantitiesByProductId.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );
  }

  private getRequiredString(value: unknown, fieldName: string) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return value.trim();
  }

  private getEmail(value: unknown) {
    const email = this.getValidatedText(value, 'customerEmail', 5, 254, false);

    if (!emailPattern.test(email)) {
      throw new BadRequestException(
        'customerEmail must be a valid email address.',
      );
    }

    return email.toLowerCase();
  }

  private getPhone(value: unknown, fieldName: string) {
    const phone = this.getValidatedText(value, fieldName, 10, 20, false);
    const digitCount = phone.replace(/\D/g, '').length;

    if (!phonePattern.test(phone) || digitCount < 10 || digitCount > 15) {
      throw new BadRequestException(
        `${fieldName} must be a valid phone number.`,
      );
    }

    return phone;
  }

  private getValidatedText(
    value: unknown,
    fieldName: string,
    minLength: number,
    maxLength: number,
    requireLetter: boolean,
  ) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    const text = value.trim();

    if (text.length < minLength || text.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must be between ${minLength} and ${maxLength} characters.`,
      );
    }

    if (requireLetter && !letterPattern.test(text)) {
      throw new BadRequestException(`${fieldName} must contain letters.`);
    }

    return text;
  }

  private getQuantity(value: unknown, fieldName: string) {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 99
    ) {
      throw new BadRequestException(`${fieldName} must be between 1 and 99.`);
    }

    return value;
  }

  private createOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const suffix = randomInt(100000, 1000000);

    return `ZN-${date}-${suffix}`;
  }
}
