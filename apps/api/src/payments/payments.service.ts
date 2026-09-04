import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@zenore/db';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  buildGetTokenHash,
  buildUserBasket,
  createMerchantOid,
  verifyCallbackHash,
} from './paytr.util';

const PAYTR_GET_TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token';

export type PaytrCallbackBody = {
  merchant_oid?: unknown;
  status?: unknown;
  total_amount?: unknown;
  hash?: unknown;
  failed_reason_code?: unknown;
  failed_reason_msg?: unknown;
  test_mode?: unknown;
  payment_type?: unknown;
  currency?: unknown;
  payment_amount?: unknown;
};

const orderWithItemsSelect = {
  id: true,
  orderNumber: true,
  customerId: true,
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  shippingAddress: true,
  shippingDistrict: true,
  shippingCity: true,
  paymentStatus: true,
  paymentReference: true,
  totalKurus: true,
  currency: true,
  subtotalKurus: true,
  shippingKurus: true,
  discountCode: true,
  discountKurus: true,
  items: {
    select: {
      productName: true,
      unitPriceKurus: true,
      quantity: true,
      lineTotalKurus: true,
    },
  },
} as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private get merchantId() {
    return this.requireEnv('PAYMENT_MERCHANT_ID');
  }

  private get merchantKey() {
    return this.requireEnv('PAYMENT_API_KEY');
  }

  private get merchantSalt() {
    return this.requireEnv('PAYMENT_SECRET_KEY');
  }

  private get testMode(): number {
    return process.env.PAYTR_TEST_MODE === '0' ? 0 : 1;
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      this.logger.error(`Missing required env var: ${name}`);
      throw new BadRequestException('Ödeme sistemi yapılandırılmamış.');
    }
    return value;
  }

  async initPayment(orderNumber: string, clientIp: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      select: orderWithItemsSelect,
    });

    if (!order) throw new NotFoundException('Sipariş bulunamadı.');

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Bu sipariş için ödeme zaten alınmış.');
    }

    if (order.discountCode) {
      const discount = await this.prisma.discountCode.findUnique({
        where: { code: order.discountCode },
        select: { firstOrderOnly: true },
      });

      if (discount?.firstOrderOnly) {
        if (!order.customerId) {
          throw new BadRequestException(
            'Bu indirim kodunu kullanmak için giriş yapmalısınız.',
          );
        }

        const paidOrderCount = await this.prisma.order.count({
          where: {
            customerId: order.customerId,
            paymentStatus: 'PAID',
            id: { not: order.id },
          },
        });

        if (paidOrderCount > 0) {
          throw new BadRequestException(
            'Bu indirim kodu yalnızca ilk sipariş için geçerlidir.',
          );
        }
      }
    }

    const merchantOid = createMerchantOid(order.orderNumber);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: merchantOid },
    });

    const userBasket = buildUserBasket(order.items);
    const currency = order.currency === 'TRY' ? 'TL' : order.currency;
    const noInstallment = 0;
    const maxInstallment = 0;

    const paytrToken = buildGetTokenHash(
      {
        merchantId: this.merchantId,
        userIp: clientIp,
        merchantOid,
        email: order.customerEmail,
        paymentAmount: order.totalKurus,
        userBasket,
        noInstallment,
        maxInstallment,
        currency,
        testMode: this.testMode,
      },
      this.merchantKey,
      this.merchantSalt,
    );

    const userAddress =
      `${order.shippingAddress}, ${order.shippingDistrict}, ${order.shippingCity}`.slice(
        0,
        400,
      );

    const siteUrl = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    const returnUrl = `${siteUrl}/siparis/${order.orderNumber}`;

    const body = new URLSearchParams({
      merchant_id: this.merchantId,
      user_ip: clientIp,
      merchant_oid: merchantOid,
      email: order.customerEmail,
      payment_amount: String(order.totalKurus),
      paytr_token: paytrToken,
      user_basket: userBasket,
      no_installment: String(noInstallment),
      max_installment: String(maxInstallment),
      currency,
      test_mode: String(this.testMode),
      user_name: order.customerName.slice(0, 60),
      user_address: userAddress,
      user_phone: order.customerPhone.slice(0, 20),
      merchant_ok_url: returnUrl,
      merchant_fail_url: returnUrl,
    });

    const response = await fetch(PAYTR_GET_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = (await response.json()) as {
      status: string;
      token?: string;
      reason?: string;
    };

    if (result.status !== 'success' || !result.token) {
      this.logger.error(
        `PayTR get-token failed for ${merchantOid}: ${result.reason ?? 'unknown'}`,
      );
      throw new BadRequestException('Ödeme başlatılamadı.');
    }

    return { iframeToken: result.token };
  }

  async handleCallback(body: PaytrCallbackBody): Promise<boolean> {
    const merchantOid = this.asString(body.merchant_oid);
    const status = this.asString(body.status);
    const totalAmount = this.asString(body.total_amount);
    const hash = this.asString(body.hash);

    if (!merchantOid || !status || !totalAmount || !hash) {
      this.logger.warn('PayTR callback missing required fields');
      return false;
    }

    const validHash = verifyCallbackHash(
      merchantOid,
      this.merchantSalt,
      status,
      totalAmount,
      this.merchantKey,
      hash,
    );

    if (!validHash) {
      this.logger.warn(`PayTR callback hash mismatch for ${merchantOid}`);
      return false;
    }

    const order = await this.prisma.order.findFirst({
      where: { paymentReference: merchantOid },
      select: orderWithItemsSelect,
    });

    if (!order) {
      this.logger.warn(
        `PayTR callback for unknown merchant_oid ${merchantOid}`,
      );
      return true;
    }

    const rawResponse = body as unknown as Prisma.InputJsonValue;
    const result = await this.prisma.order.updateMany({
      where: { paymentReference: merchantOid, paymentStatus: 'PENDING' },
      data:
        status === 'success'
          ? {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              paidAt: new Date(),
              paymentRawResponse: rawResponse,
            }
          : {
              paymentStatus: 'FAILED',
              paymentRawResponse: rawResponse,
            },
    });

    if (result.count === 0) {
      // Already processed (duplicate notification) — idempotent no-op.
      return true;
    }

    if (status === 'success') {
      void this.mail.sendOrderConfirmation(order, order.customerEmail);
    }

    return true;
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
