import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Zenore",
  description: "Zenore internet sitesini kullanım koşulları ve şartları.",
};

export default function KullanimKosullariPage() {
  return (
    <LegalPage title="Kullanım Koşulları" updatedAt="15 Ağustos 2026">
      <div>
        <h2>1. Kabul</h2>
        <p>
          zenore.com internet sitesini (“Site”) ziyaret ederek veya kullanarak bu Kullanım
          Koşulları&apos;nı kabul etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız, lütfen
          Site&apos;yi kullanmayınız. [ŞİRKET UNVANI] (“Zenore”), bu koşulları önceden bildirim
          yapmaksızın değiştirme hakkını saklı tutar.
        </p>
      </div>

      <div>
        <h2>2. Hesap Kullanımı</h2>
        <p>
          Site üzerinde hesap oluşturan kullanıcılar, kayıt sırasında verdikleri bilgilerin
          doğru, güncel ve eksiksiz olduğunu taahhüt eder. Hesap bilgilerinizin (kullanıcı adı,
          şifre vb.) gizliliğinden ve hesabınız üzerinden gerçekleştirilen tüm işlemlerden
          siz sorumlusunuz. Hesabınızla ilgili yetkisiz bir kullanım fark etmeniz halinde
          derhal bizimle iletişime geçmelisiniz.
        </p>
      </div>

      <div>
        <h2>3. Fikri Mülkiyet</h2>
        <p>
          Site üzerindeki tüm içerik — metinler, görseller, ürün fotoğrafları, logo, marka ve
          tasarım unsurları dahil ancak bunlarla sınırlı olmamak üzere — Zenore&apos;a aittir
          veya Zenore tarafından lisanslı olarak kullanılmaktadır ve fikri mülkiyet
          mevzuatınca korunmaktadır. Bu içerikler, önceden yazılı izin alınmaksızın
          çoğaltılamaz, dağıtılamaz veya ticari amaçla kullanılamaz.
        </p>
      </div>

      <div>
        <h2>4. Yasak Kullanımlar</h2>
        <p>Site&apos;yi kullanırken aşağıdaki davranışlardan kaçınmanız gerekmektedir:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Site&apos;nin işleyişini bozacak veya aşırı yük bindirecek eylemlerde bulunmak,</li>
          <li>Başkalarına ait hesap bilgilerini izinsiz kullanmak,</li>
          <li>Site üzerinden yasa dışı, yanıltıcı veya zarar verici içerik paylaşmak,</li>
          <li>Site&apos;nin kaynak koduna veya altyapısına yetkisiz erişim girişiminde bulunmak.</li>
        </ul>
      </div>

      <div>
        <h2>5. Sorumluluk Sınırlaması</h2>
        <p>
          Zenore, Site&apos;nin kesintisiz veya hatasız çalışacağını garanti etmez. Zenore,
          Site&apos;nin kullanımından doğabilecek dolaylı zararlardan, mücbir sebeplerden veya
          üçüncü taraf hizmet sağlayıcılardan (kargo, ödeme altyapısı vb.) kaynaklanan
          aksaklıklardan sorumlu tutulamaz. Ürünlere ilişkin sorumluluklarımız{" "}
          <a href="/iade-ve-degisim-politikasi">İade ve Değişim Politikası</a>&apos;nda ayrıca
          düzenlenmiştir.
        </p>
      </div>

      <div>
        <h2>6. Değişiklikler</h2>
        <p>
          Zenore, bu Kullanım Koşulları&apos;nı dilediği zaman güncelleyebilir. Güncellenmiş
          koşullar bu sayfada yayımlandığı andan itibaren geçerli olur. Site&apos;yi kullanmaya
          devam etmeniz, güncel koşulları kabul ettiğiniz anlamına gelir.
        </p>
      </div>

      <div>
        <h2>7. Uygulanacak Hukuk</h2>
        <p>
          Bu Kullanım Koşulları Türkiye Cumhuriyeti kanunlarına tabidir. Bu koşullardan doğan
          her türlü uyuşmazlıkta [YETKİLİ MAHKEME/İL] Mahkemeleri ve İcra Daireleri yetkilidir.
        </p>
      </div>
    </LegalPage>
  );
}
