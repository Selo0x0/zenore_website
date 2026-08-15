import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "İade ve Değişim Politikası | Zenore",
  description: "Zenore ürünlerinin iade ve değişim koşulları.",
};

export default function IadeVeDegisimPolitikasiPage() {
  return (
    <LegalPage title="İade ve Değişim Politikası" updatedAt="15 Ağustos 2026">
      <div>
        <h2>1. İade Koşulları</h2>
        <p>
          Satın aldığınız ürünü, kullanılmamış, orijinal ambalajı ve etiketleri bozulmamış
          olması koşuluyla iade edebilirsiniz. İade işlemleri için lütfen önce{" "}
          <a href="/iletisim">İletişim</a> sayfamızdan bizimle iletişime geçin.
        </p>
      </div>

      <div>
        <h2>2. İade Süresi</h2>
        <p>
          Ürünü teslim aldığınız tarihten itibaren <strong>14 gün</strong> içinde cayma
          hakkınızı kullanarak iade talebinde bulunabilirsiniz. Bu süre,{" "}
          <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>&apos;nde
          belirtilen cayma hakkı süresiyle uyumludur.
        </p>
      </div>

      <div>
        <h2>3. İade Edilemeyecek Ürünler</h2>
        <p>
          Kişiye özel üretilen (isim baskılı, özel kesim vb.) ürünler ile kullanım izi taşıyan
          veya orijinal ambalajı hasar görmüş ürünler iade kapsamı dışındadır.
        </p>
      </div>

      <div>
        <h2>4. Değişim Süreci</h2>
        <p>
          Ürününüzü farklı bir beden, renk veya modelle değiştirmek isterseniz, iade
          koşullarını sağlayan ürünler için değişim talebinizi{" "}
          <a href="/iletisim">İletişim</a> sayfamız üzerinden iletebilirsiniz. Stok durumuna
          göre değişim süresi değişebilir.
        </p>
      </div>

      <div>
        <h2>5. Kargo ve Ücret Sorumluluğu</h2>
        <p>
          Ürünün ayıplı/hatalı teslim edilmesi halinde iade kargo bedeli tarafımızca
          karşılanır. Cayma hakkı kapsamındaki iadelerde, aksi açıkça belirtilmedikçe kargo
          bedeli Alıcı&apos;ya aittir.
        </p>
      </div>

      <div>
        <h2>6. İade Onay Süreci</h2>
        <p>
          İade edilen ürün tarafımıza ulaştıktan sonra incelenir; iade koşullarını
          karşıladığı teyit edildiğinde, ödeme tutarı yasal süreler içinde kullanılan ödeme
          yöntemine iade edilir.
        </p>
      </div>
    </LegalPage>
  );
}
