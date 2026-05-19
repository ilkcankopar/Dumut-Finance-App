# Dumut Ekosistemi API Uç Noktaları Dokümantasyonu

Bu belgede Dumut Core Gateway API (finans-app) altındaki tüm endpoint'ler modüller halinde listelenmiştir. 

Tüm isteklerin kök adresi: `/api/v1`
Kimlik doğrulama gerektiren uç noktalarda isteğin Header alanına `Authorization: Bearer <accessToken>` eklenmelidir.

## Güvenlik, CORS ve Rate Limiting (İstek Sınırlandırma) Önlemleri

Sistemin kararlılığını, güvenliğini sağlamak ve olası kötüye kullanımları/saldırıları engellemek amacıyla Express sunucusunda aşağıdaki güvenlik katmanları aktif durumdadır:

### 1. CORS (Cross-Origin Resource Sharing) Politikası
*   **Geliştirme Ortamı:** Geliştirme kolaylığı açısından lokal isteklerin tamamına izin verilir.
*   **Canlı Ortam (Production):** Sadece belirlenen resmi istemci adresine (`FRONTEND_URL`) erişim izni tanınır.
*   **Kimlik Taşıma:** `credentials: true` ayarı etkinleştirilerek JWT çerezleri ve güvenli oturum bilgileri tarayıcılar üzerinden sorunsuz iletilir.

### 2. Rate Limiting (İstek Hızı Sınırlandırma)
API üzerindeki her IP adresinin yapabileceği maksimum istek sayısı, uç noktasının kritiklik seviyesine göre kademelendirilmiştir:
*   **Genel Limit (Global):** Sunucu genelindeki tüm rotalar için IP başına **15 dakikada maksimum 1000 istek** hakkı sunulur. Bu, genel DDoS ve tarama (scraping) aktivitelerini engeller.
*   **Kimlik Doğrulama Limiti (Auth):** `/auth/kayit`, `/auth/giris` ve `/auth/google` uç noktalarında Brute-Force (kaba kuvvet) saldırılarını engellemek amacıyla **15 dakikada maksimum 100 istek** sınırı uygulanmaktadır.
*   **Sesli Asistan Limiti (Voice Assistant):** `/sesli-asistan` isteklerinde yapay zeka API maliyetlerini ve sunucu yükünü dengede tutmak için **1 dakikada maksimum 20 istek** sınırı bulunur.

### 3. Helmet & Güvenlik Başlıkları
*   `helmet` modülü kullanılarak yaygın web zafiyetleri (XSS, Clickjacking, MIME-sniffing, HTTP Parameter Pollution) HTTP yanıt başlıkları seviyesinde engellenmiştir.

---

## 1. Kimlik Doğrulama Rotaları (/auth)

### POST /auth/kayit
*   **Açıklama:** Sisteme yeni bir kullanıcı kaydeder.
*   **Kimlik Doğrulama:** Yok
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "email": "user@dumut.com",
      "sifre": "Sifre123!",
      "ad": "Ad",
      "soyad": "Soyad",
      "kullaniciTipi": "OGRENCI"
    }
    ```
*   **Başarılı Yanıt (201 Created):**
    ```json
    {
      "success": true,
      "message": "Kayıt başarılı",
      "data": {
        "id": "kullanici-uuid",
        "email": "user@dumut.com",
        "ad": "Ad",
        "soyad": "Soyad"
      }
    }
    ```

### POST /auth/giris
*   **Açıklama:** Kullanıcı girişi yapar, JWT erişim ve yenileme token'ları döner.
*   **Kimlik Doğrulama:** Yok
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "email": "user@dumut.com",
      "sifre": "Sifre123!"
    }
    ```
*   **Başarılı Yanıt (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "ey...",
        "refreshToken": "ey...",
        "user": {
          "id": "kullanici-uuid",
          "email": "user@dumut.com",
          "ad": "Ad",
          "level": 1
        }
      }
    }
    ```

### POST /auth/google
*   **Açıklama:** Google OAuth üzerinden gelen ID Token ile tek tıkla giriş veya kayıt yapar.
*   **Kimlik Doğrulama:** Yok
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "idToken": "google-oauth-token"
    }
    ```

### POST /auth/token-yenile
*   **Açıklama:** Süresi biten erişim token'ını yenilemek için kullanılır.
*   **Kimlik Doğrulama:** Yok
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "refreshToken": "yenileme-token-string"
    }
    ```

---

## 2. Oyunlaştırma ve Seviye Rotaları (/level)

### GET /level/durum
*   **Açıklama:** Kullanıcının seviye atlama durumunu, XP bilgisini, güncel ligini ve aktif streak/koruma kalkanı sayılarını getirir.
*   **Kimlik Doğrulama:** Gerekli
*   **Başarılı Yanıt (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "level": 3,
        "xp": 150,
        "toplamXP": 450,
        "unvan": "Çaylak",
        "lig": "Bronz",
        "streak": 4,
        "shields": 1,
        "xpToNextLevel": 200
      }
    }
    ```

### GET /level/siralama
*   **Açıklama:** Küresel bazda tüm kullanıcıların XP seviyelerine göre sıralamasını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /level/siralama/arkadaslar
*   **Açıklama:** Kullanıcının sadece arkadaş listesinde yer alan kişilerin seviye sıralamasını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /level/siralama/lig
*   **Açıklama:** Kullanıcının o anda bulunduğu lige ait (örn. Gümüş Ligi) kullanıcı sıralamasını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /level/istatistikler
*   **Açıklama:** Seviye ve XP dağılımları gibi istatistiksel metrikleri döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /level/profil/:id
*   **Açıklama:** Belirtilen ID'ye sahip kullanıcının genel profil, lig ve rozet bilgilerini döner.
*   **Kimlik Doğrulama:** Gerekli

---

## 3. Kategori Yönetimi Rotaları (/kategori)

### GET /kategori
*   **Açıklama:** Kullanıcının kullanabileceği tüm kategorileri (sistem varsayılanları ve özel tanımlananlar) listeler.
*   **Kimlik Doğrulama:** Gerekli

### POST /kategori
*   **Açıklama:** Kullanıcıya özel yeni bir finansal kategori tanımlar.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "ad": "Kişisel Hobiler",
      "ikon": "gamepad",
      "renk": "#8B5CF6",
      "tur": "GIDER"
    }
    ```

### PATCH /kategori/:id
*   **Açıklama:** Özel tanımlanmış kategoriyi günceller.
*   **Kimlik Doğrulama:** Gerekli

### DELETE /kategori/:id
*   **Açıklama:** Kullanıcıya özel tanımlanmış kategoriyi siler.
*   **Kimlik Doğrulama:** Gerekli

---

## 4. Finansal İşlemler Rotaları (/islem)

### POST /islem
*   **Açıklama:** Yeni bir gelir veya gider kaydı ekler.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "kategoriId": "kategori-uuid",
      "tip": "GIDER",
      "baslik": "Öğle Yemeği",
      "miktar": 280,
      "tarih": "2026-05-19T12:00:00Z",
      "sabitMi": false,
      "enlem": 41.0082,
      "boylam": 28.9784,
      "konumAd": "Beşiktaş Restoran",
      "notlar": "İş arkadaşlarıyla öğle yemeği"
    }
    ```

### GET /islem
*   **Açıklama:** Kullanıcının işlemlerini filtreli ve sayfalı olarak listeler.
*   **Sorgu Parametreleri:** `kategoriId`, `tip`, `baslangicTarihi`, `bitisTarihi`, `limit`, `sayfa`
*   **Kimlik Doğrulama:** Gerekli

### GET /islem/ozet
*   **Açıklama:** Cari ay içindeki toplam gelir, toplam gider ve net tasarruf oranını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /islem/harita-ozeti
*   **Açıklama:** Konum bilgisi (enlem, boylam) içeren işlemleri harita koordinatları halinde listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /islem/yakin-odemeler
*   **Açıklama:** Yaklaşan sabit giderleri (kira, fatura, abonelik) listeler.
*   **Kimlik Doğrulama:** Gerekli

### POST /islem/ocr-tara
*   **Açıklama:** Fiş/Fatura fotoğrafını alarak OCR taraması yapar ve harcama detaylarını çıkarır.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Tipi:** `multipart/form-data`
*   **Parametre:** `fisGorseli` (Resim dosyası)

### GET /islem/:id
*   **Açıklama:** Belirli bir işlemin tüm detaylarını görüntüler.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /islem/:id
*   **Açıklama:** Belirtilen finansal işlemi günceller.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /islem/:id/odeme-durumu
*   **Açıklama:** Yaklaşan ödemenin ödendi/ödenmedi durumunu günceller.
*   **Kimlik Doğrulama:** Gerekli

### DELETE /islem/:id
*   **Açıklama:** Finansal işlemi siler.
*   **Kimlik Doğrulama:** Gerekli

---

## 5. Bütçe Profili Rotaları (/butce-profili)

### GET /butce-profili
*   **Açıklama:** Kullanıcının aktif bütçe profili limitlerini ve para birimi tercihlerini döner.
*   **Kimlik Doğrulama:** Gerekli

### POST /butce-profili
*   **Açıklama:** Kullanıcıya ilk bütçe profilini tanımlar.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /butce-profili
*   **Açıklama:** Bütçe profilinde yer alan aylık gelir ve toplam limit hedeflerini günceller.
*   **Kimlik Doğrulama:** Gerekli

---

## 6. Bütçe Yönetim Rotaları (/butce)

### POST /butce/kurulum
*   **Açıklama:** Bütçe onboarding kurulumunu tamamlar.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "aylikHedefHarcama": 12000,
      "aylikToplamGelir": 18000,
      "paraBirimi": "TRY"
    }
    ```

### GET /butce/durum
*   **Açıklama:** Mevcut ayın bütçe harcama durumunu kategori bazında limit kullanımlarıyla döner.
*   **Kimlik Doğrulama:** Gerekli

### POST /butce/kalem
*   **Açıklama:** Belirli bir kategori için harcama limiti belirler.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "kategoriId": "kategori-uuid",
      "limitMiktar": 2500,
      "uyariYuzdesi": 80
    }
    ```

### DELETE /butce/kalem/:id
*   **Açıklama:** Kategori limitini (bütçe kalemini) kaldırır.
*   **Kimlik Doğrulama:** Gerekli

### GET /butce/oneriler
*   **Açıklama:** Kullanıcının harcamalarına göre üretilen otomatik tasarruf önerilerini listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /butce/gunluk-ipucu
*   **Açıklama:** Kullanıcı için üretilmiş günlük finansal tavsiye ve ipuçlarını döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /butce/ai-yatirim-onerisi
*   **Açıklama:** Bütçe tasarruf seviyesine göre yapay zeka tarafından oluşturulan yatırım dağılım tavsiyelerini listeler.
*   **Kimlik Doğrulama:** Gerekli

---

## 7. Dil ve Yerelleştirme Rotaları (/dil)

### GET /dil
*   **Açıklama:** Desteklenen dil kodlarını listeler (Türkçe, İngilizce vb.).
*   **Kimlik Doğrulama:** Yok

### GET /dil/:kod
*   **Açıklama:** Belirtilen dil kodu detaylarını getirir.
*   **Kimlik Doğrulama:** Yok

### GET /dil/:kod/ceviriler
*   **Açıklama:** Mobil uygulamanın dil dosyası çeviri nesnelerini döner.
*   **Kimlik Doğrulama:** Yok

---

## 8. Bireysel Hedef Rotaları (/hedef)

### POST /hedef
*   **Açıklama:** Kullanıcıya yeni bir birikim hedefi ekler.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "baslik": "Laptop Alımı",
      "aciklama": "Yeni yazılım bilgisayarı için",
      "hedefMiktar": 45000,
      "renk": "#EF4444",
      "hedefTarihi": "2026-10-01T00:00:00Z",
      "varlikSembol": "TRY",
      "ikon": "laptop"
    }
    ```

### GET /hedef
*   **Açıklama:** Kullanıcının tüm bireysel birikim hedeflerini listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /hedef/istatistikler
*   **Açıklama:** Toplam biriktirilen miktar ve hedeflerin tamamlanma oranlarını döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /hedef/:id
*   **Açıklama:** Belirtilen hedefin detaylarını görüntüler.
*   **Kimlik Doğrulama:** Gerekli

### GET /hedef/:id/gecmis
*   **Açıklama:** Hedefe yapılan birikim katkılarının geçmiş zaman çizelgesini listeler.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /hedef/:id
*   **Açıklama:** Hedef parametrelerini günceller.
*   **Kimlik Doğrulama:** Gerekli

### DELETE /hedef/:id
*   **Açıklama:** Birikim hedefini siler.
*   **Kimlik Doğrulama:** Gerekli

### POST /hedef/:id/katki
*   **Açıklama:** Hedefe birikim katkısı ekler (hedef havuzuna para ekleme).
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "miktar": 1500,
      "notlar": "Mayıs ayı katkısı"
    }
    ```

### GET /hedef/arkadas/:arkadasId
*   **Açıklama:** Arkadaşın dışarıya açık olan birikim hedeflerini listeler.
*   **Kimlik Doğrulama:** Gerekli

---

## 9. Ortak Grup Hedef Rotaları (/grup-hedef)

### POST /grup-hedef
*   **Açıklama:** Yeni bir ortak birikim grubu oluşturur.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "ad": "Kaş Tatili 2026",
      "aciklama": "Ortak tatil bütçesi",
      "hedefMiktar": 35000,
      "bitisTarihi": "2026-08-01T00:00:00Z",
      "renk": "#3B82F6"
    }
    ```

### GET /grup-hedef
*   **Açıklama:** Kullanıcının üye olduğu tüm ortak grup hedeflerini listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /grup-hedef/:id
*   **Açıklama:** Grup detaylarını ve katılım sağlayan üyelerin katkı listesini (liderlik tablosu) döner.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /grup-hedef/:id
*   **Açıklama:** Grup hedefini düzenler.
*   **Kimlik Doğrulama:** Gerekli

### DELETE /grup-hedef/:id
*   **Açıklama:** Grup hedefini kapatır/siler.
*   **Kimlik Doğrulama:** Gerekli

### POST /grup-hedef/:id/katki
*   **Açıklama:** Grup hedefine bütçe katkısı ekler.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "miktar": 2000
    }
    ```

### POST /grup-hedef/:id/uye
*   **Açıklama:** Arkadaş listesinden birini gruba davet eder/ekler.
*   **Kimlik Doğrulama:** Gerekli

### DELETE /grup-hedef/:id/uye/:uyeId
*   **Açıklama:** Üyeyi gruptan çıkarır (sadece grup yöneticisi yapabilir).
*   **Kimlik Doğrulama:** Gerekli

### POST /grup-hedef/:id/ayril
*   **Açıklama:** Kullanıcının gruptan kendi isteğiyle ayrılmasını sağlar.
*   **Kimlik Doğrulama:** Gerekli

---

## 10. Arkadaşlık Yönetimi Rotaları (/arkadaslik)

### GET /arkadaslik
*   **Açıklama:** Aktif arkadaş listesini döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /arkadaslik/istekler
*   **Açıklama:** Bekleyen gelen ve giden arkadaşlık isteklerini listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /arkadaslik/siralama
*   **Açıklama:** Arkadaşlar arasındaki seviye sıralamasını döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /arkadaslik/ara
*   **Açıklama:** Diğer kullanıcıları e-posta adreslerine göre arar.
*   **Sorgu Parametresi:** `q` (Arama metni)
*   **Kimlik Doğrulama:** Gerekli

### POST /arkadaslik/istek
*   **Açıklama:** Başka bir kullanıcıya arkadaşlık isteği gönderir.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "aliciEmail": "friend@dumut.com"
    }
    ```

### POST /arkadaslik/kabul/:id
*   **Açıklama:** Gelen arkadaşlık isteğini kabul eder.
*   **Kimlik Doğrulama:** Gerekli

### POST /arkadaslik/reddet/:id
*   **Açıklama:** Gelen arkadaşlık isteğini reddeder.
*   **Kimlik Doğrulama:** Gerekli

### PATCH /arkadaslik/:id
*   **Açıklama:** Arkadaş bazlı gizlilik ayarlarını günceller (örn. bütçeyi arkadaşa gösterme ayarı).
*   **Kimlik Doğrulama:** Gerekli

### DELETE /arkadaslik/:id
*   **Açıklama:** Kullanıcıyı arkadaş listesinden çıkarır.
*   **Kimlik Doğrulama:** Gerekli

---

## 11. Başarı Rozetleri Rotaları (/rozet)

### GET /rozet
*   **Açıklama:** Sistemde tanımlı tüm başarı rozetlerini ve kazanım kurallarını listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /rozet/benim
*   **Açıklama:** Kullanıcının kazandığı başarı rozetlerini listeler.
*   **Kimlik Doğrulama:** Gerekli

### POST /rozet/kontrol
*   **Açıklama:** Rozet kazanım tetikleyicilerini çalıştırır ve koşulları sağlayan yeni rozetleri açar.
*   **Kimlik Doğrulama:** Gerekli

---

## 12. Anlık Mesajlaşma Rotaları (/mesaj)

### GET /mesaj/konusmalar
*   **Açıklama:** Kullanıcının arkadaşlarıyla olan sohbet listesini ve son mesajlarını döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /mesaj/okunmamis-sayisi
*   **Açıklama:** Okunmamış toplam mesaj sayısını döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /mesaj/:kullaniciId
*   **Açıklama:** Belirtilen arkadaş ile olan geçmiş mesaj geçmişini getirir.
*   **Kimlik Doğrulama:** Gerekli

### POST /mesaj/gonder
*   **Açıklama:** Normal metin mesajı gönderir.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "aliciId": "alici-uuid",
      "icerik": "Selam, hedefe ne kadar kaldığını gördün mü?"
    }
    ```

### POST /mesaj/hedef-paylas
*   **Açıklama:** Sohbet ekranında bir birikim hedefini kart olarak paylaşır.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "aliciId": "alici-uuid",
      "hedefId": "hedef-uuid"
    }
    ```

### POST /mesaj/butce-paylas
*   **Açıklama:** Sohbet içerisinde bütçe durumu veya kategorisini kart halinde paylaşır.
*   **Kimlik Doğrulama:** Gerekli

### POST /mesaj/rozet-paylas
*   **Açıklama:** Kazanılan bir başarı rozetini sohbet içerisinde kart olarak paylaşır.
*   **Kimlik Doğrulama:** Gerekli

---

## 13. Canlı Piyasa Rotaları (/piyasa)

*(Tüm piyasa rotalarında in-memory onbellekleme uygulanarak API çağrıları cache'ten karşılanmaktadır.)*

### GET /piyasa/bist100
*   **Açıklama:** BIST100 endeksindeki tüm hisse senetlerinin anlık fiyatlarını ve değişim oranlarını listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/hisse/:sembol
*   **Açıklama:** Belirtilen hisse kodunun (örn. THYAO) anlık alım, satım, değişim yüzdesi ve hacim bilgilerini döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/kripto
*   **Açıklama:** En popüler kripto para birimlerinin (BTC, ETH vb.) dolar fiyatlarını listeler.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/doviz
*   **Açıklama:** Dolar, Euro, Sterlin gibi temel kurların TRY karşılığındaki alış ve satış değerlerini döner.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/altin
*   **Açıklama:** Gram Altın, Çeyrek Altın, Yarım Altın ve Cumhuriyet Altını canlı fiyatlarını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/gumus
*   **Açıklama:** Canlı Gümüş gram fiyatını getirir.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/ozet
*   **Açıklama:** Asistan ve dashboard için derlenmiş genel piyasa özet kartını döner (Dolar, Euro, Altın ve BIST100 tek nesnede).
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/takip
*   **Açıklama:** Kullanıcının takip listesindeki (watchlist) hisse senedi ve kripto varlıklarını listeler.
*   **Kimlik Doğrulama:** Gerekli

### POST /piyasa/takip
*   **Açıklama:** Takip listesine yeni hisse senedi veya kripto ekler.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "tip": "HISSE", // veya KRIPTO
      "sembol": "ASELS"
    }
    ```

### DELETE /piyasa/takip/:tip/:id
*   **Açıklama:** Belirtilen varlığı takip listesinden çıkarır.
*   **Kimlik Doğrulama:** Gerekli

### GET /piyasa/yatirim-onerisi
*   **Açıklama:** Kullanıcının aylık tasarruf miktarına (Gelir - Gider Hedefi) göre yapay zeka tabanlı hisse, döviz ve kripto dağılım önerilerini döner.
*   **Kimlik Doğrulama:** Gerekli

---

## 14. Sesli Asistan Kontrol Rotaları (/sesli-asistan)

### POST /sesli-asistan/ses
*   **Açıklama:** Base64 kodlu ses verisini alır, transkript eder, Gemini NLP ile niyetini çıkarır ve onay bekleyen bir işlem objesi döndürür.
*   **Kimlik Doğrulama:** Gerekli
*   **İstek Gövdesi (JSON):**
    ```json
    {
      "ses_dosyasi_base64": "UklGR...",
      "uzanti": "webm"
    }
    ```
*   **Başarılı Yanıt (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "anlasilanMetin": "yüz elli lira kahve gideri ekle",
        "niyet": "ISLEM_EKLE",
        "cevapMetni": "150 TL Bakkal gideri eklensin mi?",
        "data": {
          "tip": "ONAY_BEKLIYOR",
          "islem": {
            "tip": "GIDER",
            "miktar": 150,
            "baslik": "Kahve",
            "kategori_adi": "Gıda & Yemek"
          }
        }
      }
    }
    ```

### POST /sesli-asistan/metin
*   **Açıklama:** Yazılı metin komutunu sesli asistan motoruyla işleyerek niyet analizi yapar.
*   **Kimlik Doğrulama:** Gerekli

### POST /sesli-asistan/seslendir
*   **Açıklama:** Gönderilen metni ElevenLabs (hata durumunda Google TTS fallback) kullanarak ses dosyasına (audio/mpeg) çevirir ve ses akışı olarak döndürür.
*   **Kimlik Doğrulama:** Gerekli

### GET /sesli-asistan/karsilama
*   **Açıklama:** Giriş yapan kullanıcıya özel sesli ve yazılı karşılama mesajı üretir (Örn: "Hoş geldin Enes, bugün bütçeni aşmadın...").
*   **Kimlik Doğrulama:** Gerekli

### POST /sesli-asistan/onayla
*   **Açıklama:** Asistanın hazırladığı onay bekleyen işlemi veritabanına kaydeder.
*   **Kimlik Doğrulama:** Gerekli

---

## 15. Finansal Raporlama Rotaları (/rapor)

### GET /rapor/detayli
*   **Açıklama:** Belirtilen tarih aralığındaki harcama dağılımlarını, günlük harcama ortalamalarını ve kategori yüzdelerini içeren detaylı raporu döner.
*   **Kimlik Doğrulama:** Gerekli

### POST /rapor/ai-analiz
*   **Açıklama:** Kullanıcının cari ay veya geçmiş dönemdeki harcama alışkanlıklarını analiz ederek Gemini AI tarafından hazırlanmış raporu döner.
*   **Kimlik Doğrulama:** Gerekli

---

## 16. Onboarding Rotaları (/onboarding)

### GET /onboarding/kurulum-verileri
*   **Açıklama:** Onboarding esnasında kullanıcının meslek grubuna ve tipine göre önerilen hazır bütçe şablonlarını getirir.
*   **Kimlik Doğrulama:** Gerekli

### POST /onboarding/kurulum-tamamla
*   **Açıklama:** Kullanıcının bütçe hedefleri ve rollerini (Öğrenci, Girişimci, Business) kaydederek onboarding sürecini tamamlar.
*   **Kimlik Doğrulama:** Gerekli
