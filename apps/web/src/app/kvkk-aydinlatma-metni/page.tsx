import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Zenore",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
};

export default function KvkkAydinlatmaMetniPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updatedAt="15 Ağustos 2026">
      <div>
        <p>
          İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
          uyarınca, zenore.com internet sitesi kullanıcılarının kişisel verilerinin
          işlenmesine ilişkin olarak veri sorumlusu sıfatıyla [ŞİRKET UNVANI] (“Zenore”)
          tarafından hazırlanmıştır.
        </p>
      </div>

      <div>
        <h2>1. Veri Sorumlusunun Kimliği</h2>
        <p>
          Veri sorumlusu: [ŞİRKET UNVANI], [ADRES]. Sorularınız için{" "}
          <a href="/iletisim">İletişim</a> sayfamızdan bize ulaşabilirsiniz.
        </p>
      </div>

      <div>
        <h2>2. İşlenen Kişisel Veriler</h2>
        <p>
          Ad soyad, e-posta adresi, telefon numarası, teslimat/fatura adresi, sipariş ve
          ödeme işlem bilgileri ile Site kullanımına ilişkin log kayıtları (IP adresi,
          tarayıcı bilgisi) işlenmektedir.
        </p>
      </div>

      <div>
        <h2>3. İşleme Amaçları</h2>
        <p>
          Kişisel verileriniz; sipariş süreçlerinin yürütülmesi, sözleşmesel yükümlülüklerin
          ifası, müşteri ilişkileri yönetimi, yasal yükümlülüklerin yerine getirilmesi ve
          Site güvenliğinin sağlanması amaçlarıyla işlenmektedir.
        </p>
      </div>

      <div>
        <h2>4. Kişisel Verilerin Aktarımı</h2>
        <p>
          Kişisel verileriniz, hizmetin ifası için gerekli ölçüde kargo/lojistik firmaları,
          ödeme kuruluşları ve yasal zorunluluk halinde yetkili kamu kurumlarıyla, KVKK&apos;nın
          8. ve 9. maddelerinde belirtilen şartlara uygun olarak paylaşılabilir.
        </p>
      </div>

      <div>
        <h2>5. Toplama Yöntemi ve Hukuki Sebebi</h2>
        <p>
          Kişisel verileriniz, Site üzerindeki formlar aracılığıyla elektronik ortamda;
          sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi ve meşru
          menfaat hukuki sebeplerine dayanılarak toplanmaktadır.
        </p>
      </div>

      <div>
        <h2>6. İlgili Kişi Hakları</h2>
        <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Kişisel verinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini/yok edilmesini isteme,</li>
          <li>İşlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>Aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.</li>
        </ul>
        <p className="mt-2">
          Bu haklarınızı kullanmak için <a href="/iletisim">İletişim</a> sayfamızda yer alan
          kanallardan bize yazılı olarak başvurabilirsiniz.
        </p>
      </div>
    </LegalPage>
  );
}
