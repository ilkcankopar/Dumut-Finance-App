import { prisma } from '../../prisma/client';
import { KullaniciTipi } from '@prisma/client';

export const onboardingService = {
  async getKurulumVerileri(kullaniciTipi: KullaniciTipi) {
    let popularGiderler: any[] = [];
    let popularGelirler: any[] = [];
    let sorular: any[] = [];

    switch (kullaniciTipi) {
      case 'OGRENCI':
        popularGiderler = [
          { baslik: 'Yurt / Kira', ikon: 'home' },
          { baslik: 'Üniversite Ulaşım', ikon: 'bus' },
          { baslik: 'Ders Kitapları / Kırtasiye', ikon: 'book' },
          { baslik: 'Yemekhane / Kantin', ikon: 'coffee' },
          { baslik: 'Dışarıda Yemek / Kahve', ikon: 'utensils' },
          { baslik: 'Eğlence / Sinema', ikon: 'gamepad' },
          { baslik: 'Abonelikler (Spotify/Netflix)', ikon: 'play' },
          { baslik: 'Kıyafet / Alışveriş', ikon: 'shoppingBag' },
          { baslik: 'Telefon Faturası', ikon: 'mobile' }
        ];
        popularGelirler = [
          { baslik: 'KYK Kredisi / Bursu', ikon: 'moneyBill' },
          { baslik: 'Aileden Gelen Harçlık', ikon: 'gift' },
          { baslik: 'Yarı Zamanlı İş Maaşı', ikon: 'briefcase' },
          { baslik: 'Staj Ücreti', ikon: 'idBadge' },
          { baslik: 'Özel Ders Geliri', ikon: 'chalkboardTeacher' }
        ];
        sorular = [
          { id: 'aylik_gelir', soru: 'Aylık toplam harçlığınız veya burs geliriniz ne kadar?', tip: 'number' },
          { id: 'aylik_kira', soru: 'Aylık yurt, kira veya barınma gideriniz ne kadar?', tip: 'number' },
          { id: 'birikim_hedefi', soru: 'Gelecek için her ay kenara ne kadar atmak istersiniz?', tip: 'number' }
        ];
        break;

      case 'GIRISIMCI':
        popularGiderler = [
          { baslik: 'Sunucu / Bulut Hizmetleri', ikon: 'server' },
          { baslik: 'Yazılım Lisansları', ikon: 'code' },
          { baslik: 'Dijital Reklam (Google/Meta)', ikon: 'bullhorn' },
          { baslik: 'Muhasebe / Vergi Danışmanlığı', ikon: 'calculator' },
          { baslik: 'Sanal Ofis / Coworking Kira', ikon: 'building' },
          { baslik: 'Ekipman / Donanım Taksidi', ikon: 'laptop' },
          { baslik: 'Serbest Çalışan (Freelancer) Ödemeleri', ikon: 'users' },
          { baslik: 'Alan Adı ve Hosting', ikon: 'globe' },
          { baslik: 'İş Seyahati / Ulaşım', ikon: 'plane' }
        ];
        popularGelirler = [
          { baslik: 'Ürün / Hizmet Satışı', ikon: 'shoppingCart' },
          { baslik: 'Proje Bazlı Müşteri Geliri', ikon: 'briefcase' },
          { baslik: 'Melek Yatırım / Fon Desteği', ikon: 'chartLine' },
          { baslik: 'SaaS Abonelik Gelirleri', ikon: 'sync' },
          { baslik: 'Danışmanlık Hizmeti', ikon: 'users' }
        ];
        sorular = [
          { id: 'aylik_gelir', soru: 'Girişiminizin aylık tahmini ciro veya fon geliri ne kadar?', tip: 'number' },
          { id: 'sabit_gider', soru: 'İşletmenizin (sunucu, ofis, muhasebe vs) aylık sabit giderleri ne kadar?', tip: 'number' },
          { id: 'vergi_butce', soru: 'Kurulum veya kurumlar vergisi için aylık bütçeniz var mı?', tip: 'number' }
        ];
        break;

      case 'BUSINESS':
      default:
        popularGiderler = [
          { baslik: 'Ev Kirası / Konut Kredisi', ikon: 'home' },
          { baslik: 'Market ve Ev Alışverişi', ikon: 'shoppingCart' },
          { baslik: 'Faturalar (Elektrik, Su, İnternet)', ikon: 'lightbulb' },
          { baslik: 'Akaryakıt / Araç Masrafları', ikon: 'car' },
          { baslik: 'Giyim ve Kişisel Bakım', ikon: 'tshirt' },
          { baslik: 'Dışarıda Yeme İçme', ikon: 'utensils' },
          { baslik: 'Çocuk Eğitim / Okul Taksidi', ikon: 'graduationCap' },
          { baslik: 'Sağlık / Sigorta Primleri', ikon: 'heartbeat' },
          { baslik: 'Kredi Kartı Asgari / Kredi Taksitleri', ikon: 'creditCard' }
        ];
        popularGelirler = [
          { baslik: 'Sabit Şirket Maaşı', ikon: 'briefcase' },
          { baslik: 'Prim, Mesai ve İkramiyeler', ikon: 'star' },
          { baslik: 'Kira Geliri', ikon: 'home' },
          { baslik: 'Yatırım / Temettü Gelirleri', ikon: 'chartPie' },
          { baslik: 'Yan Haklar (Yol/Yemek Nakit)', ikon: 'wallet' }
        ];
        sorular = [
          { id: 'aylik_gelir', soru: 'Elinize geçen net aylık maaşınız (veya düzenli geliriniz) ne kadar?', tip: 'number' },
          { id: 'sabit_gider', soru: 'Her ay ödemek zorunda olduğunuz sabit giderler (Kira, Fatura, Kredi) ne kadar?', tip: 'number' },
          { id: 'ek_gelir', soru: 'Düzenli prim, kira veya yatırım gibi bir ek geliriniz var mı?', tip: 'number' }
        ];
        break;
    }

    return { popularGiderler, popularGelirler, sorular };
  },

  async kurulumTamamla(kullaniciId: string, kullaniciTipi: KullaniciTipi, data: any) {
    const { sabitIslemler, butceProfili } = data;

    await prisma.$transaction(async (tx) => {
      if (sabitIslemler && sabitIslemler.length > 0) {
        // Prepare categories first if needed, or directly create islem with default category
        // In this logic, we assume we might need to seed categories based on kullaniciTipi
        let kategoriler = [];
        if (kullaniciTipi === 'OGRENCI') {
          kategoriler = [
            { ad: 'Eğitim', tip: 'GIDER', renk: '#3B82F6', ikon: 'book' },
            { ad: 'Ulaşım', tip: 'GIDER', renk: '#F59E0B', ikon: 'bus' },
            { ad: 'Yurt/Kira', tip: 'GIDER', renk: '#8B5CF6', ikon: 'home' },
            { ad: 'Yemek', tip: 'GIDER', renk: '#EF4444', ikon: 'coffee' },
            { ad: 'Burs/Harçlık', tip: 'GELIR', renk: '#10B981', ikon: 'wallet' }
          ];
        } else if (kullaniciTipi === 'GIRISIMCI') {
          kategoriler = [
            { ad: 'Yazılım', tip: 'GIDER', renk: '#3B82F6', ikon: 'laptop' },
            { ad: 'Pazarlama', tip: 'GIDER', renk: '#F59E0B', ikon: 'bullhorn' },
            { ad: 'Ofis', tip: 'GIDER', renk: '#8B5CF6', ikon: 'home' },
            { ad: 'Vergi', tip: 'GIDER', renk: '#EF4444', ikon: 'calculator' },
            { ad: 'Satış/Gelir', tip: 'GELIR', renk: '#10B981', ikon: 'chartPie' }
          ];
        } else {
          kategoriler = [
            { ad: 'Maaş', tip: 'GELIR', renk: '#10B981', ikon: 'briefcase' },
            { ad: 'Market', tip: 'GIDER', renk: '#F59E0B', ikon: 'shoppingCart' },
            { ad: 'Kira/Fatura', tip: 'GIDER', renk: '#EF4444', ikon: 'home' },
            { ad: 'Ulaşım', tip: 'GIDER', renk: '#3B82F6', ikon: 'car' }
          ];
        }

        // Add user-specific categories
        for (const kat of kategoriler) {
          const mevcut = await tx.kategori.findFirst({
            where: { ad: kat.ad, kullaniciId }
          });
          if (!mevcut) {
            await tx.kategori.create({
              data: {
                ad: kat.ad,
                tip: kat.tip as any,
                renk: kat.renk,
                ikon: kat.ikon,
                sistemKategorisi: false,
                kullaniciId
              }
            });
          }
        }

        // Fetch user default category or existing
        let varsayilanGiderKat = await tx.kategori.findFirst({ where: { kullaniciId, tip: 'GIDER' } });
        let varsayilanGelirKat = await tx.kategori.findFirst({ where: { kullaniciId, tip: 'GELIR' } });

        // Fallback creations just in case
        if (!varsayilanGiderKat) {
          varsayilanGiderKat = await tx.kategori.create({ data: { ad: 'Genel Gider', tip: 'GIDER', renk: '#EF4444', ikon: 'wallet', sistemKategorisi: false, kullaniciId } });
        }
        if (!varsayilanGelirKat) {
          varsayilanGelirKat = await tx.kategori.create({ data: { ad: 'Genel Gelir', tip: 'GELIR', renk: '#10B981', ikon: 'briefcase', sistemKategorisi: false, kullaniciId } });
        }

        for (const islem of sabitIslemler) {
          // If the islem has a title that matches a category, try to link it
          let matchedKat = await tx.kategori.findFirst({
            where: { kullaniciId, ad: { contains: islem.baslik.split(' ')[0] }, tip: islem.tip }
          });
          
          await tx.islem.create({
            data: {
              kullaniciId,
              baslik: islem.baslik,
              miktar: Number(islem.miktar),
              tip: islem.tip,
              periyot: islem.periyot || 'AYLIK',
              sabitMi: true,
              odemeGunu: Number(islem.odemeGunu) || 1,
              kategoriId: matchedKat?.id || (islem.tip === 'GIDER' ? varsayilanGiderKat.id : varsayilanGelirKat.id)
            }
          });
        }
      }

      if (butceProfili) {
        const bp = await tx.butceProfili.update({
          where: { kullaniciId },
          data: {
            aylikToplamGelir: Number(butceProfili.aylikToplamGelir) || 0,
            aylikHedefHarcama: Number(butceProfili.aylikHedefHarcama) || 0,
            kurulumTamamlandi: true,
          }
        });

        if (butceProfili.kategoriLimitleri && Array.isArray(butceProfili.kategoriLimitleri)) {
          for (const limitData of butceProfili.kategoriLimitleri) {
            const kat = await tx.kategori.findFirst({
              where: { kullaniciId, ad: limitData.ad }
            });

            if (kat) {
              await tx.butceKalemi.create({
                data: {
                  kullaniciId,
                  butceProfilId: bp.id,
                  kategoriId: kat.id,
                  limitMiktar: limitData.limit,
                  uyariYuzdesi: 80
                }
              });
            }
          }
        }
      }
    });

    return { success: true };
  }
};
