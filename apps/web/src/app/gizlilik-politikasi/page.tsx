import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Zenore",
  description: "Zenore kişisel verilerinizi nasıl topladığını ve işlediğini açıklar.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <LegalPage title="Gizlilik Politikası" updatedAt="15 Ağustos 2026">
      <div>
        <h2>1. Veri Sorumlusu</h2>
        <p>
          Bu Gizlilik Politikası, [ŞİRKET UNVANI] (“Zenore”) tarafından işletilen zenore.com
          internet sitesi kapsamında toplanan kişisel verilerin nasıl işlendiğini açıklar.
          Kişisel verilerinizin işlenmesine ilişkin detaylı bilgi için{" "}
          <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>&apos;ni de incelemenizi
          öneririz.
        </p>
      </div>

      <div>
        <h2>2. Toplanan Veriler</h2>
        <p>Site üzerinden aşağıdaki kişisel veri kategorilerini toplayabiliriz:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Kimlik ve iletişim bilgileri (ad soyad, e-posta, telefon),</li>
          <li>Teslimat adresi bilgileri,</li>
          <li>Sipariş ve işlem geçmişi,</li>
          <li>Site kullanımına ilişkin teknik veriler (IP adresi, tarayıcı bilgisi, çerezler).</li>
        </ul>
      </div>

      <div>
        <h2>3. İşleme Amaçları</h2>
        <p>
          Toplanan veriler; siparişlerinizin oluşturulması ve teslimatı, müşteri hesabınızın
          yönetimi, müşteri desteği sağlanması, yasal yükümlülüklerin yerine getirilmesi ve
          Site&apos;nin güvenliğinin sağlanması amaçlarıyla işlenir. Verileriniz, açık rızanız
          olmadıkça pazarlama amacıyla kullanılmaz.
        </p>
      </div>

      <div>
        <h2>4. Çerezler</h2>
        <p>
          Site&apos;de kullanılan çerezler hakkında detaylı bilgiye{" "}
          <a href="/cerez-politikasi">Çerez Politikası</a> sayfasından ulaşabilirsiniz.
        </p>
      </div>

      <div>
        <h2>5. Üçüncü Taraflarla Paylaşım</h2>
        <p>
          Kişisel verileriniz; siparişinizin tarafınıza ulaştırılması için kargo/lojistik
          firmalarıyla, ödeme işlemlerinin gerçekleştirilmesi için ödeme kuruluşlarıyla ve
          yasal zorunluluk halinde yetkili resmi kurumlarla, yalnızca hizmetin gerektirdiği
          ölçüde paylaşılır. Verileriniz hiçbir şekilde üçüncü taraflara satılmaz.
        </p>
      </div>

      <div>
        <h2>6. Veri Güvenliği</h2>
        <p>
          Kişisel verilerinizin hukuka aykırı olarak işlenmesini ve verilere yetkisiz
          erişilmesini önlemek amacıyla uygun teknik ve idari tedbirler alınmaktadır.
        </p>
      </div>

      <div>
        <h2>7. Haklarınız</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki haklarınız için{" "}
          <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> sayfasındaki “İlgili Kişi
          Hakları” bölümüne bakabilirsiniz.
        </p>
      </div>

      <div>
        <h2>8. İletişim</h2>
        <p>
          Gizlilik Politikası ile ilgili sorularınız için{" "}
          <a href="/iletisim">İletişim</a> sayfamız üzerinden bize ulaşabilirsiniz.
        </p>
      </div>
    </LegalPage>
  );
}
