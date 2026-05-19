# Dumut: Oyunlastirilmis Sosyal Finans ve Yapay Zeka Destekli Butce Yonetimi Ekosistemi

BTK Hackathon 2026 Proje Basvurusu

---

## Icindekiler
- [Proje Ozeti ve Deger Onerisi](#proje-ozeti-ve-deger-onerisi)
- [Uygulamanin Genel Isleyis Mantigi](#uygulamanin-genel-isleyis-mantigi)
- [Mimari ve Veritabani Yapisi](#mimari-ve-veritabani-yapisi)
- [Entegrasyonlar ve Onbellekleme (Cache) Stratejileri](#entegrasyonlar-ve-onbellekleme-cache-stratejileri)
  - [1. CollectAPI ve Canli Piyasa Entegrasyonu](#1-collectapi-ve-canli-piyasa-entegrasyonu)
  - [2. ElevenLabs ve Google TTS Entegrasyonu](#2-elevenlabs-ve-google-tts-entegrasyonu)
  - [3. Sesli Asistan Entegrasyonu ve Performans Optimizasyonu (sesli-asistan.service.ts)](#3-sesli-asistan-entegrasyonu-ve-performans-optimizasyonu-sesli-asistanservicets)
- [Ortak Yardimci Moduller (Utils)](#ortak-yardimci-moduller-utils)
- [Temel Urun Ozellikleri](#temel-urun-ozellikleri)
- [Proje Klasor Yapisi](#proje-klasor-yapisi)
- [Kurulum ve Yerel Calistirma Talimatlari](#kurulum-ve-yerel-calistirma-talimatlari)
  - [1. Veritabani ve Express Core Backend (finans-app)](#1-veritabani-ve-express-core-backend-finans-app)
  - [2. Python Yapay Zeka Mikroservisi (enes-sesli-asistan)](#2-python-yapay-zeka-mikroservisi-enes-sesli-asistan)
  - [3. Expo Mobil Uylugama Client (finans-mobil)](#3-expo-mobil-uylugama-client-finans-mobil)
- [API Yonlendirme Linkleri](#api-yonlendirme-linkleri)
- [Hackathon Degerlendirme Uyum Tablosu](#hackathon-degerlendirme-uyum-tablosu)

---

## Proje Ozeti ve Deger Onerisi

Geleneksel finans uygulamalari kullaniciyi surekli olarak manuel veri girisi yapmaya zorlamakta ve finansal durumlari karmasik grafiklerle sunarak motivasyonu dusurmektedir. Dumut, finansal yonetimi oyunlastirma mekanikleri ve sesli yapay zeka entegrasyonu ile bir eglence unsuruna donusturur.

Uygulamanin odaginda kullanicinin finansal aliskanliklarina gore gelisen, beslenen ve tepkiler veren sanal evcil hayvan Dumut bulunur. Kullanicilar harcamalarini girdikce, aylik bütce limitlerine sadik kaldikca veya birikim hedeflerine katkida bulundukca deneyim puani (XP) kazanirlar. Bu puanlar sayesinde seviye atlayan kullanicilar Bronz Ligden baslayarak Sampiyon Ligine kadar yukselebilirler.

Yapay zeka katmaninda ise, kullanicilarin sesli komutlarini (ornegin "Bugun yemek kategorisinde 350 lira gider ekle" veya "Araba hedefime 2000 lira aktar") milisaniyeler icinde yaziya doken ve Gemini Flash uzerinden analiz ederek otomatik olarak bütceye isleyen gelismis bir dogal dil isleme (NLP) asistani calisir.

---

## Uygulamanin Genel Isleyis Mantigi

Dumut uygulamasi, kullanicinin onboarding surecinden baslayarak gunluk harcama girisleri, oyunlastirma donguleri ve sosyal etkilesimleri asagidaki is adimlari ile yonetir:

### 1. Onboarding ve Rol Secimi
Kullanici sisteme kayit olurken mesleki ve finansal profilini yansitan bir kullanici tipi secer (Ogrenci, Girisimci, Is Insani vb.). Secilen profile gore yapay zeka arka planda hazir harcama kategorileri ve bütce limitleri onerir. Kullanici aylik toplam gelir ve harcama hedeflerini belirleyerek ilk kurulumu tamamlar.

### 2. Islem Girisi ve Sesli Asistan Dongusu
Kullanicilar iki sekilde harcama veya gelir ekleyebilir:
*   **Manuel Giris:** Arayuz uzerinden kategori secilerek tutar ve baslik girilir. Haritanin kullanilabilmesi icin konum bilgisi de isleme ilistirebilir.
*   **Sesli Komut Girisi:** Mobil cihaz uzerinden ses kaydi baslatilir. Kaydedilen ses verisi ham base64 formatinda backend uzerinden Python mikroservisine iletilir.
    *   **Whisper STT** ile ses yaziya dokulur.
    *   **Gemini Flash** modeli kullanilarak metinden niyet (intent), miktar, baslik ve uygun kategori cikarilir.
    *   Sistem, kullaniciya "120 TL Yemek harcamasi giriyorum, onayliyor musunuz?" seklinde sesli (ElevenLabs veya Google TTS) ve yazili geri bildirim doner.
    *   Kullanici onayladigi anda islem veritabanina yazilir.

### 3. Oyunlastirma ve Seviye Kontrolu
Her basarili harcama girisi, bütce hedefine sadik kalinmasi veya arkadas davet edilmesi kullaniciya XP kazandirir.
*   **Seviye Atlama:** XP biriktikce kullanicinin seviyesi (level) artar ve yeni finansal unvanlar kazanir.
*   **Lig Sistemi:** Haftalik olarak kullanicilar seviye siralamasina gore Bronz, Gumus, Altin, Platin, Elmas ve Sampiyon ligleri arasinda yukselir veya duser.
*   **Seri (Streak):** Kullanicilarin uygulamayi her gun aktif olarak kullanmasi durumunda streak sayaci artar. Gunluk harcama girmeyi unutma durumuna karsi sanal marketten coin ile Seri Kalkanlari satin alinabilir.

### 4. Sosyal Etkilesim ve Ortak Hedefler
Kullanicilar uygulama icinde birbirlerini arkadas olarak ekleyebilir. Sohbet arayuzu uzerinden canli mesajlasirken, kendi birikim hedeflerini veya kazandiklari basari rozetlerini kart seklinde karsi tarafa gonderebilirler. Ortak grup hedefleri sayesinde birden fazla kullanici tek bir birikim havuzuna para ekleyebilir ve kimin ne kadar katki sagladigi canli olarak izlenebilir.

---

## Mimari ve Veritabani Yapisi

Sistem, yuksek esneklik ve olceklenebilirlik icin asagidaki gibi katmanli bir mikroservis mimarisine sahiptir:

```mermaid
graph TD
    Client[Expo React Native Client] -->|HTTP / JSON| Gateway[Express Backend Gateway]
    Client -->|Base64 Audio / Text| AIService[Python FastAPI AI Microservice]
    Gateway -->|Axios REST| AIService
    Gateway -->|Prisma ORM| Database[(PostgreSQL / SQLite Database)]
    
    %% Entegrasyonlar
    AIService -->|Gemini Flash API| GeminiLLM[Gemini 3.1 Flash / Lite]
    AIService -->|Groq API| GroqWhisper[Groq Whisper STT]
    Gateway -->|ElevenLabs SDK| ElevenLabs[ElevenLabs Premium TTS]
    Gateway -->|Google Translate API| GoogleTTS[Google TTS Fallback]
    Gateway -->|CollectAPI| CollectAPI[CollectAPI Live Market Data]
```

---

## Entegrasyonlar ve Onbellekleme (Cache) Stratejileri

BTK Hackathon 2026 projesinde dis servislere giden isteklerin maliyetini dusurmek, kotayi korumak ve uygulama hizini maksimize etmek amaciyla gelismis onbellekleme mekanizmalari uygulanmistir.

### 1. CollectAPI ve Canli Piyasa Entegrasyonu

Uygulamada hisse senetleri (BIST100), kripto paralar, altin/gumus fiyatlari ve doviz kurlari gibi canli veriler **CollectAPI** uzerinden saglanmaktadir. Ancak API kota limitlerini verimli kullanmak adina canli piyasa verileri icin **PiyasaCache** adinda in-memory (bellek ici) onbellek yapisi kurgulanmistir.

*   **Calisma Mantigi:** `piyasa.cache.ts` dosyasi icerisinde in-memory JavaScript `Map` tabanli bir store barindirilir.
*   **Gecerlilik Sureleri (TTL):**
    *   BIST 100 Endeks ve Tum Hisseler: 5 dakika
    *   Kripto Para Fiyat Listesi: 3 dakika
    *   Altin ve Gumus Fiyatlari: 5 dakika
    *   Doviz Kurlari: 10 dakika
*   **Akis:** API katmanina gelen sorgularda oncelikle bellek kontrol edilir. Eger veri bulunuyorsa ve son guncellenme zamanindan itibaren belirtilen TTL suresi asilmadiysa veri doğrudan cache'den donulur. Sure asildiysa API'ye istek atilarak yeni veri çekilir, onbellek guncellenir ve veri kullaniciya iletilir. Bu sayede canli veri saglayici kotalarinda %90'a varan tasarruf elde edilmektedir.

### 2. ElevenLabs ve Google TTS Entegrasyonu

Sesli asistanin kullaniciya sesli yanit donmesi amaciyla **ElevenLabs Text-to-Speech API** kullanilmaktadir. Ancak ses uretimi maliyetli ve kota bagimli oldugu icin sistemde dinamik bir hata tolerans ve fallback mekanizmasi kurulmustur.

*   **TTS Fallback Mantigi:** Kullanicinin islemi sesli olarak girildiginde asistan cevabi ElevenLabs API uzerinden seslendirilir. 
*   Eger kota asimi, sunucu hatasi veya ag problemi nedeniyle ElevenLabs servisi yanit vermezse, sistem otomatik olarak **Google Translate TTS API**'sine istek atar. Bu sayede ses sentezleme islemi kesintiye ugramadan devam eder ve kullanici deneyimi korunur.

### 3. Sesli Asistan Entegrasyonu ve Performans Optimizasyonu (sesli-asistan.service.ts)

Sistemdeki en kritik performans iyilestirmelerinden biri, Python tabanli **enes-sesli-asistan** yapay zeka servisi ile Express Core Gateway arasinda yapilan entegrasyondur.

*   **Entegrasyon Yapisi:** Sesli komutlarin alinmasi, transkript edilmesi, niyet analizlerinin yapilmasi ve bütce kontekstine uygun cevaplarin uretilmesi asamalari, ana backend icerisindeki `sesli-asistan.service.ts` modulu ile Python yapay zeka mikroservisi arasinda sıkı bir sekilde baglanmistir.
*   **Performans Optimizasyonu:** Istemciden (mobil uygulamadan) gelen ses verileri, backend gateway uzerinde gecikmeye yol acmadan dogrudan asenkron veri akislari (stream) seklinde Python NLP katmanina iletilir. intent (niyet) ve context (bütce/kullanici) bilgileri, servis katmanindaki cache'lenmis veritabanı sorgulariyla birlestirilir. Bu mimari sayesinde ses kaydinin gonderilmesiyle islemin parse edilip onay ekranina dusmesi arasindaki gecikme suresi milisaniyeler seviyesine indirilerek sistem performansi maksimuma ulastirilmistir.

---

## Ortak Yardimci Moduller (Utils)

Uygulamanin Express backend (finans-app) projesi icerisinde kod tekrarlarini onlemek, standartlari korumak ve güvenli veri donusumleri saglamak amaciyla gelistirilen yardimci moduller su sekildedir:

*   **ApiError (ApiError.ts):** Sistem genelinde standart hata modellemesi saglar. Hata kodlari, operasyonel durumlar ve dogrulama hatalarinin tek bir formatta (`{ success: false, error: ... }`) donmesini garantiler.
*   **ApiResponse (ApiResponse.ts):** Tum basarili HTTP yanitlarini standartlastiran yardimci siniftir. Tum istemcilere tutarli bir veri yapisi sunar.
*   **asyncHandler (asyncHandler.ts):** Express rotalarindaki asenkron fonksiyonlari sarmalayarak olasi hatalari yakalar ve merkezi hata yonetim middleware'ine (next) aktarir. Bu sayede kod icinde `try-catch` kalabaligi engellenir.
*   **finansalUtil (finansal.util.ts):** Finansal hesaplama motorudur.
    *   `ayligaCevir`: Haftalik ve yillik bütceleri aylik standarta donusturur.
    *   `butceKullanimHesapla`: Kalan limit ve yuzdesel bütce kullanimini hesaplar.
    *   `hedefYuzdesiHesapla`: Birikim hedeflerinin tamamlanma oranini bulur.
    *   `kategoriDagilimiHesapla`: Harcamalar icindeki kategori agirliklarini yuzdesel olarak cikarir.
    *   `formatla`: Tutar bilgilerini yerel Turk Lirasi standartlarina (`Intl.NumberFormat`) gore bicimlendirir.
*   **hashUtil (hash.util.ts):** Kullanici sifrelerinin veritabani uzerinde guvenli bir sekilde saklanmasi icin `bcrypt` tabanli sifreleme ve karsilastirma islemlerini yurutur.
*   **tokenUtil (token.util.ts):** JWT tabanli yetkilendirme islemlerini yonetir. Access ve Refresh token uretme, doğrulama ve rotasyon sureclerini guvenli sekilde koordine eder.

---

## Temel Urun Ozellikleri

1.  **Dumut Sanal Pet Altyapisi:** Kullanicinin finansal durustlugu ve surekliligine gore buyuyen evcil hayvan.
2.  **Yapay Zeka Ses Asistani:** Whisper STT ve Gemini Flash ile ses kayitlarindan finansal parametre cikarma.
3.  **Ortak Grup Hedefleri:** Arkadas gruplariyla ortak birikim havuzlari ve katki siralamalari.
4.  **Konum Bazli Harita Raporlari:** Harcamalarin konumlarinin kaydedilmesi ve haritada gosterimi.
5.  **AI Destekli Fis Okuma (OCR):** Harcama fislerinin fotograflarindan veri cikarma.
6.  **Sosyal Ag ve Paylasimli Mesajlasma:** Sohbet ekranlarinda bütce ve hedef kartlarinin dinamik olarak paylasilmasi.

---

## Proje Klasor Yapisi

```text
Dumut-Finance-App/
├── finans-mobil/           # React Native Expo Mobil Istemci kodlari
│   └── src/
│       ├── api/            # Istek Yoneticileri ve Axios Yapilandirmasi
│       ├── components/     # Arayuz Elemanlari
│       ├── context/        # Oturum ve Global State Katmanlari
│       └── screens/        # Dashboard, Asistan, Sosyal, Piyasa vb. Ekranlar
│
├── finans-app/             # Node.js Express & Prisma Ana Backend API Gateway
│   ├── prisma/             # Veritabani Semasi ve Seed Betikleri
│   └── src/
│       ├── config/         # Logger ve API Anahtari Yapilandirmalari
│       ├── middleware/     # Auth, Zod Validation, Rate Limiter, Error Handler
│       ├── utils/          # ApiError, ApiResponse, finansalUtil, tokenUtil yardimcilar
│       └── modules/        # Bütce, Islem, Sosyal, AI Modulleri
│
└── enes-sesli-asistan/     # Python FastAPI AI & Speech Processing Mikroservisi
    └── ai/
        ├── main.py         # FastAPI Sunucu ve Yonlendiriciler
        └── services/       # Yapay Zeka, STT (Whisper) ve TTS Servisleri
```

---

## Kurulum ve Yerel Calistirma Talimatlari

### 1. Veritabani ve Express Core Backend (finans-app)

1.  Dizine gecin:
    ```bash
    cd finans-app
    ```
2.  Bagimliliklari kurun:
    ```bash
    npm install
    ```
3.  `.env` dosyasini olusturun ve doldurun:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://username:password@localhost:5432/finans_db?schema=public"
    NODE_ENV=development
    JWT_ACCESS_SECRET=kendi-access-keyiniz
    JWT_REFRESH_SECRET=kendi-refresh-keyiniz
    JWT_ACCESS_EXPIRES_IN=15m
    JWT_REFRESH_EXPIRES_IN=7d
    FRONTEND_URL=http://localhost:3001
    GEMINI_API_KEY=gemini-key
    COLLECT_API_KEY=collectapi-key
    AI_MICROSERVICE_URL=http://localhost:8000
    ```
4.  Veritabani tablolarini senkronize edin:
    ```bash
    npx prisma generate
    npm run db:push
    ```
5.  Baslangic verilerini yukleyin (Seeding):
    ```bash
    npm run db:seed
    ```
6.  Backend sunucusunu baslatin:
    ```bash
    npm run dev
    ```

### 2. Python Yapay Zeka Mikroservisi (enes-sesli-asistan)

1.  Dizine gecin:
    ```bash
    cd enes-sesli-asistan
    ```
2.  Sanal ortam olusturun ve aktif edin:
    ```bash
    python -m venv venv
    source venv/bin/activate  # macOS/Linux
    # venv\Scripts\activate   # Windows
    ```
3.  Kutuphaneleri yukleyin:
    ```bash
    pip install -r requirements.txt
    ```
4.  `.env` dosyasini yapılandırın:
    ```env
    GOOGLE_API_KEY=gemini-key
    GROQ_API_KEY=groq-key
    PORT=8000
    ```
5.  Uygulamayi baslatin:
    ```bash
    uvicorn ai.main:app --host 0.0.0.0 --port 8000 --reload
    ```

### 3. Expo Mobil Uylugama Client (finans-mobil)

1.  Dizine gecin:
    ```bash
    cd finans-mobil
    ```
2.  Bagimliliklari yukleyin:
    ```bash
    npm install
    ```
3.  `src/config.ts` dosyasindan `apiUrl` degerini Express API adresinize yonlendirin.
4.  Expo sunucusunu baslatin:
    ```bash
    npx expo start
    ```

---

## API Yonlendirme Linkleri

Projedeki tum API rotalari ve parametreleri detayli sekilde dokumante edilerek ayri bir dosyada toplanmistir.
*   **Detayli API Dokumantasyonu:** [API_DOKUMANTASYONU.md](file:///Users/macbookairm1/Desktop/finans/API_DOKUMANTASYONU.md) konumundan ulasabilirsiniz.

---

## Hackathon Degerlendirme Uyum Tablosu

*   **Teknolojik Yetkinlik:** Node.js, Express, Python FastAPI, PostgreSQL, Prisma ORM, Zod, JWT gibi modern ve guvenli teknolojilerin kullanimi.
*   **Kullanici Deneyimi:** Yapay zeka ses tanima ile manuel bütce tutma zorlugunun asilmasi ve 3D sanal evcil hayvan oyunlastirma ogeleriyle yuksek baglilik saglanmasi.
*   **Uretken Yapay Zeka Kullanimi:** Gemini Flash ve Whisper modellerinin entegrasyonu, kullanici harcama aliskanliklarinin AI ile analiz edilerek kisisel tasarruf tavsiyelerine donusturulmesi.
