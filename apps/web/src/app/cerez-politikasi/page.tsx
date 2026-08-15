import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Çerez Politikası | Zenore",
  description: "Zenore internet sitesinde kullanılan çerezler hakkında bilgi.",
};

export default function CerezPolitikasiPage() {
  return (
    <LegalPage title="Çerez Politikası" updatedAt="15 Ağustos 2026">
      <div>
        <h2>1. Çerez Nedir?</h2>
        <p>
          Çerezler (“cookies”), bir internet sitesini ziyaret ettiğinizde tarayıcınız
          aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler, Site&apos;nin
          düzgün çalışmasını sağlamak ve deneyiminizi iyileştirmek amacıyla kullanılır.
        </p>
      </div>

      <div>
        <h2>2. Kullanılan Çerez Türleri</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>
            <strong>Zorunlu çerezler:</strong> Oturum açma, sepet ve temel site işlevlerinin
            çalışması için gereklidir; devre dışı bırakılamaz.
          </li>
          <li>
            <strong>Analitik çerezler:</strong> Site&apos;nin nasıl kullanıldığını anlamamıza
            yardımcı olur (yalnızca kullanılıyorsa geçerlidir).
          </li>
          <li>
            <strong>Pazarlama çerezleri:</strong> İlgi alanlarınıza uygun içerik/reklam
            gösterimi amacıyla kullanılabilir (yalnızca kullanılıyorsa geçerlidir).
          </li>
        </ul>
      </div>

      <div>
        <h2>3. Çerez Yönetimi</h2>
        <p>
          Zorunlu olmayan çerezlerin kullanımına ilişkin tercihinizi Site&apos;yi ilk ziyaret
          ettiğinizde sunulan bilgilendirme aracılığıyla yönetebilirsiniz.
        </p>
      </div>

      <div>
        <h2>4. Tarayıcı Ayarları</h2>
        <p>
          Çoğu tarayıcı, çerezleri kabul etmeyi varsayılan olarak ayarlamıştır; ancak
          tarayıcı ayarlarınızdan çerezleri engelleyebilir veya silebilirsiniz. Zorunlu
          çerezlerin engellenmesi, Site&apos;nin bazı bölümlerinin düzgün çalışmamasına neden
          olabilir.
        </p>
      </div>
    </LegalPage>
  );
}
