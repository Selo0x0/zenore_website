import { Injectable } from '@nestjs/common';
import type { Prisma } from '@zenore/db';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const DEFAULT_ABOUT = {
  hero: 'Deriyle Başlayan Bir Hikaye',
  heroSub: 'Hakiki deri ile el işçiliğini buluşturuyoruz.',
  story:
    'Her ürün, yılların tecrübesiyle seçilen ham derilerden, ustalıkla işlenerek hayata geçirilmektedir. Biz sadece çanta ya da cüzdan yapmıyoruz; nesiller boyu taşınacak eserler yaratıyoruz.',
  values: [
    {
      title: 'El İşçiliği',
      description:
        'Her dikiş, her kesim elle yapılır. Makinenin yapamayacağı özen, her ürünümüzde hissedilir.',
    },
    {
      title: 'Hakiki Deri',
      description:
        'Yalnızca birinci sınıf, sertifikalı ham deri kullanıyoruz. Sentetik malzeme asla.',
    },
    {
      title: 'Ömür Boyu Kalite',
      description:
        'Ürünlerimiz, doğru bakımla onlarca yıl size eşlik edecek şekilde tasarlanmıştır.',
    },
  ],
};

const DEFAULT_CONTACT = {
  email: 'info@zenore.com',
  phone: '+90 532 123 45 67',
  address: 'Kapalıçarşı, Beyazıt, İstanbul',
  hours: 'Hafta içi 09:00 – 18:00',
  instagram: 'zenore_leather',
  whatsapp: '',
};

const DEFAULT_FAQ = {
  hero: 'Sıkça Sorulan Sorular',
  heroSub:
    'Sipariş, kargo, ödeme ve ürün bakımı hakkında en çok merak edilen konular.',
  items: [
    {
      question: 'Siparişim ne zaman kargoya verilir?',
      answer:
        'Stokta bulunan ürünler genellikle 1-3 iş günü içinde hazırlanıp kargoya teslim edilir.',
    },
    {
      question: 'Kargo ücreti nasıl hesaplanır?',
      answer:
        'Kargo ücreti sepet toplamına göre hesaplanır. Belirlenen ücretsiz kargo limitinin üzerindeki siparişlerde kargo ücretsizdir.',
    },
    {
      question: 'Ürünler hakiki deri mi?',
      answer:
        'Evet, Zenore ürünlerinde hakiki deri ve özenli el işçiliği kullanılır.',
    },
    {
      question: 'İade veya değişim yapabilir miyim?',
      answer:
        'Kullanılmamış ürünlerde iade ve değişim talepleriniz için bizimle iletişime geçebilirsiniz.',
    },
  ],
};

const DEFAULTS: Record<string, unknown> = {
  about: DEFAULT_ABOUT,
  contact: DEFAULT_CONTACT,
  faq: DEFAULT_FAQ,
};

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async getContent(key: string) {
    const row = await this.prisma.siteContent.findUnique({ where: { key } });
    if (row) return row.value;
    return DEFAULTS[key] ?? null;
  }

  async upsertContent(key: string, value: Prisma.InputJsonValue) {
    return this.prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async submitContact(dto: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) {
    const submission = await this.prisma.contactSubmission.create({
      data: dto,
    });
    await this.mail.sendContactNotification(dto).catch(() => null);
    return submission;
  }

  async getContactSubmissions() {
    return this.prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.contactSubmission.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
