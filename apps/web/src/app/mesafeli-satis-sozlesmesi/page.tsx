import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | Zenore",
  description: "Zenore üzerinden yapılan alışverişlere ilişkin mesafeli satış sözleşmesi.",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi" updatedAt="15 Ağustos 2026">
      <div>
        <h2>1. Taraflar</h2>
        <p>
          İşbu sözleşme, bir tarafta [ŞİRKET UNVANI] (Mersis No: [MERSİS NO], Vergi Dairesi:
          [VERGİ DAİRESİ], Adres: [ADRES]) (“Satıcı”) ile diğer tarafta zenore.com üzerinden
          sipariş veren müşteri (“Alıcı”) arasında, Alıcı&apos;nın Site üzerinden verdiği
          siparişin şartlarını belirlemek amacıyla akdedilmiştir.
        </p>
      </div>

      <div>
        <h2>2. Sözleşme Konusu</h2>
        <p>
          İşbu sözleşmenin konusu, Alıcı&apos;nın Satıcı&apos;ya ait zenore.com internet
          sitesinden elektronik ortamda sipariş verdiği, sözleşmede belirtilen niteliklere
          sahip ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması
          Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların
          hak ve yükümlülüklerinin belirlenmesidir.
        </p>
      </div>

      <div>
        <h2>3. Ürün ve Ödeme Bilgileri</h2>
        <p>
          Sipariş edilen ürünün türü, adedi, satış bedeli ve ödeme şekli, sipariş
          onayı sırasında Alıcı&apos;ya elektronik ortamda sunulan sipariş özetinde
          belirtilmektedir. Fiyatlar Türk Lirası (TRY) cinsinden olup Site üzerinde ilan
          edildiği andaki güncel fiyatlardır.
        </p>
      </div>

      <div>
        <h2>4. Teslimat</h2>
        <p>
          Ürünler, Alıcı&apos;nın sipariş sırasında belirttiği teslimat adresine, anlaşmalı
          kargo firması aracılığıyla teslim edilir. Teslimat süresi, ürün ve bölgeye göre
          değişiklik gösterebilir; tahmini teslimat süresi sipariş onayında belirtilir.
        </p>
      </div>

      <div>
        <h2>5. Cayma Hakkı</h2>
        <p>
          Alıcı, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin, ürünü teslim
          aldığı tarihten itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını
          kullanabilir. Cayma hakkının kullanılması için bu süre içinde Satıcı&apos;ya{" "}
          <a href="/iletisim">İletişim</a> sayfasında yer alan kanallardan bildirimde
          bulunulması yeterlidir. Cayma hakkının kullanılmasına ilişkin detaylar{" "}
          <a href="/iade-ve-degisim-politikasi">İade ve Değişim Politikası</a>&apos;nda yer
          almaktadır.
        </p>
      </div>

      <div>
        <h2>6. İstisnalar</h2>
        <p>
          Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi uyarınca, Alıcı&apos;nın
          istekleri doğrultusunda kişiselleştirilmiş (örn. özel kesim/isim baskılı) ürünler
          ile niteliği itibarıyla iade edilemeyecek ürünlerde cayma hakkı kullanılamaz.
        </p>
      </div>

      <div>
        <h2>7. Temerrüt</h2>
        <p>
          Alıcı&apos;nın kredi kartı ile yaptığı ödemelerde temerrüde düşmesi halinde, kart
          sahibi banka ile arasındaki kredi kartı sözleşmesi hükümleri geçerli olacaktır.
        </p>
      </div>

      <div>
        <h2>8. Yetkili Mahkeme</h2>
        <p>
          İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca ilan edilen
          değere kadar Tüketici Hakem Heyetleri, bu değerin üzerindeki uyuşmazlıklarda ise
          Tüketici Mahkemeleri yetkilidir.
        </p>
      </div>
    </LegalPage>
  );
}
