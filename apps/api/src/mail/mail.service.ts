import { Injectable, Logger } from '@nestjs/common';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

type OrderItem = {
  productName: string;
  quantity: number;
  unitPriceKurus: number;
  lineTotalKurus: number;
};

type OrderEmailData = {
  orderNumber: string;
  totalKurus: number;
  subtotalKurus: number;
  shippingKurus: number;
  discountCode?: string | null;
  discountKurus?: number;
  currency: string;
  items: OrderItem[];
};

function formatPrice(kurus: number, currency: string) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(
    kurus / 100,
  );
}

@Injectable()
export class MailService {
  private readonly apiKey: string | undefined;
  private readonly from: string | undefined;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.from = process.env.BREVO_FROM_EMAIL;
  }

  private async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<unknown> {
    if (!this.apiKey || !this.from) {
      throw new Error('BREVO_API_KEY / BREVO_FROM_EMAIL is not configured');
    }
    const res = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: { email: this.from, name: 'Zenore' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Brevo send failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  async sendContactNotification(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    try {
      await this.send(
        adminEmail,
        `Yeni iletişim mesajı — ${data.name}`,
        `<p><strong>Ad:</strong> ${data.name}</p>
<p><strong>E-posta:</strong> ${data.email}</p>
${data.subject ? `<p><strong>Konu:</strong> ${data.subject}</p>` : ''}
<p><strong>Mesaj:</strong><br>${data.message.replace(/\n/g, '<br>')}</p>`,
      );
    } catch (err) {
      this.logger.error('Failed to send contact notification', err);
    }
  }

  async sendOrderConfirmation(
    order: OrderEmailData,
    to: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending order confirmation to ${to} for ${order.orderNumber}`,
      );
      const result = await this.send(
        to,
        `Siparişiniz alındı — ${order.orderNumber}`,
        this.buildHtml(order),
      );
      this.logger.log(`Email sent: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('Failed to send order confirmation email', err);
    }
  }

  private buildHtml(order: OrderEmailData): string {
    const itemRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;">
            ${item.productName}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;text-align:right;font-weight:600;">
            ${formatPrice(item.lineTotalKurus, order.currency)}
          </td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid #e5e5e5;">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#999;">Zenore</p>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;">Siparişiniz alındı 🎉</h1>
            <p style="margin:0;font-size:14px;color:#555;">
              Sipariş numaranız: <strong style="color:#111;">${order.orderNumber}</strong>
            </p>
            <p style="margin:8px 0 0;font-size:14px;color:#555;">
              Siparişiniz en kısa sürede hazırlanarak kargoya verilecektir.
            </p>
          </td>
        </tr>

        <!-- Items -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;text-align:left;border-bottom:2px solid #e5e5e5;">Ürün</th>
                <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;text-align:center;border-bottom:2px solid #e5e5e5;">Adet</th>
                <th style="padding:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;text-align:right;border-bottom:2px solid #e5e5e5;">Tutar</th>
              </tr>
              ${itemRows}
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:0 32px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #111;padding-top:12px;">
              ${
                order.shippingKurus > 0
                  ? `<tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">Ara Toplam</td>
                <td style="padding:4px 0;font-size:14px;color:#555;text-align:right;">${formatPrice(order.subtotalKurus, order.currency)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">Kargo</td>
                <td style="padding:4px 0;font-size:14px;color:#555;text-align:right;">${formatPrice(order.shippingKurus, order.currency)}</td>
              </tr>`
                  : `<tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">Kargo</td>
                <td style="padding:4px 0;font-size:14px;color:#27ae60;text-align:right;font-weight:600;">Ücretsiz</td>
              </tr>`
              }
              ${
                order.discountKurus && order.discountKurus > 0
                  ? `<tr>
                <td style="padding:4px 0;font-size:14px;color:#555;">İndirim${order.discountCode ? ` (${order.discountCode})` : ''}</td>
                <td style="padding:4px 0;font-size:14px;color:#27ae60;text-align:right;">-${formatPrice(order.discountKurus, order.currency)}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111;">Toplam</td>
                <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111;text-align:right;">${formatPrice(order.totalKurus, order.currency)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e5e5e5;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
              Siparişinizle ilgili sorularınız için bize ulaşabilirsiniz.<br>
              Bu e-postayı yanlışlıkla aldıysanız dikkate almayınız.
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#ccc;letter-spacing:0.1em;text-transform:uppercase;">Zenore — Hakiki Deri</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
