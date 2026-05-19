import { PrismaClient, KategoriTipi, IslemTipi, Periyot, HedefDurumu, KullaniciTipi } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test kullanıcı bilgileri
const TEST_USER = {
  email: 'test@finans.com',
  sifre: 'Test123!',
  ad: 'Ahmet',
  soyad: 'Yılmaz',
  kullaniciTipi: KullaniciTipi.CALISAN,
};

// Rastgele tarih oluştur (son 3 ay içinde)
function randomDate(daysAgo: number = 90): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Rastgele miktar (min-max arası)
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function main() {
  console.log('🚀 Test verileri oluşturuluyor...\n');

  // 1. Test kullanıcısı oluştur
  console.log('👤 Test kullanıcısı oluşturuluyor...');
  
  let user = await prisma.kullanici.findUnique({
    where: { email: TEST_USER.email },
  });

  if (user) {
    console.log('  - Mevcut test kullanıcısı siliniyor...');
    // Önce bağlı verileri sil
    await prisma.hedefGecmisi.deleteMany({
      where: { hedef: { kullaniciId: user.id } },
    });
    await prisma.hedef.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.islem.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.butceKalemi.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.butceProfili.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.aiOneri.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.bildirim.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.seri.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.widget.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.rapor.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.kategori.deleteMany({ where: { kullaniciId: user.id } });
    await prisma.kullanici.delete({ where: { id: user.id } });
  }

  const sifreHash = await bcrypt.hash(TEST_USER.sifre, 10);
  
  user = await prisma.kullanici.create({
    data: {
      email: TEST_USER.email,
      sifreHash,
      ad: TEST_USER.ad,
      soyad: TEST_USER.soyad,
      kullaniciTipi: TEST_USER.kullaniciTipi,
    },
  });
  console.log(`  ✅ Kullanıcı: ${TEST_USER.email} / ${TEST_USER.sifre}\n`);

  // 2. Sistem kategorilerini al
  const sistemKategorileri = await prisma.kategori.findMany({
    where: { sistemKategorisi: true },
  });
  
  const giderKategorileri = sistemKategorileri.filter(k => k.tip === KategoriTipi.GIDER);
  const gelirKategorileri = sistemKategorileri.filter(k => k.tip === KategoriTipi.GELIR);

  console.log(`📂 ${giderKategorileri.length} gider, ${gelirKategorileri.length} gelir kategorisi bulundu\n`);

  // 3. Bütçe profili oluştur
  console.log('💰 Bütçe profili oluşturuluyor...');
  const butceProfili = await prisma.butceProfili.create({
    data: {
      kullaniciId: user.id,
      aylikToplamGelir: 35000,
      aylikHedefHarcama: 25000,
      kurulumTamamlandi: true,
      paraBirimi: 'TRY',
    },
  });
  console.log('  ✅ Aylık Gelir: ₺35.000 | Hedef Harcama: ₺25.000\n');

  // 4. Bütçe kalemleri ekle (kategori bazlı limitler)
  console.log('📊 Bütçe kalemleri oluşturuluyor...');
  const butceLimitleri = [
    { ad: 'Kira', limit: 8000 },
    { ad: 'Market', limit: 4000 },
    { ad: 'Yeme & İçme', limit: 2500 },
    { ad: 'Ulaşım', limit: 1500 },
    { ad: 'Abonelikler', limit: 500 },
    { ad: 'Giyim', limit: 1000 },
    { ad: 'Eğlence', limit: 1000 },
  ];

  for (const limit of butceLimitleri) {
    const kategori = giderKategorileri.find(k => k.ad === limit.ad);
    if (kategori) {
      await prisma.butceKalemi.create({
        data: {
          kullaniciId: user.id,
          butceProfilId: butceProfili.id,
          kategoriId: kategori.id,
          limitMiktar: limit.limit,
          uyariYuzdesi: 80,
        },
      });
      console.log(`  + ${limit.ad}: ₺${limit.limit.toLocaleString()}`);
    }
  }
  console.log('');

  // 5. Sabit gelirler ekle
  console.log('💵 Sabit gelirler ekleniyor...');
  const maasKategori = gelirKategorileri.find(k => k.ad === 'Maaş');
  const ekGelirKategori = gelirKategorileri.find(k => k.ad === 'Ek Gelir');
  
  if (maasKategori) {
    // Son 3 ayın maaşları
    for (let i = 0; i < 3; i++) {
      const tarih = new Date();
      tarih.setMonth(tarih.getMonth() - i);
      tarih.setDate(1);
      await prisma.islem.create({
        data: {
          kullaniciId: user.id,
          kategoriId: maasKategori.id,
          tip: IslemTipi.GELIR,
          baslik: 'Maaş',
          miktar: 35000,
          periyot: Periyot.AYLIK,
          sabitMi: true,
          tarih,
        },
      });
    }
    console.log('  + Maaş: ₺35.000 (son 3 ay)');
  }

  if (ekGelirKategori) {
    await prisma.islem.create({
      data: {
        kullaniciId: user.id,
        kategoriId: ekGelirKategori.id,
        tip: IslemTipi.GELIR,
        baslik: 'Freelance proje',
        miktar: 5000,
        periyot: Periyot.AYLIK,
        tarih: randomDate(30),
      },
    });
    console.log('  + Freelance: ₺5.000');
  }
  console.log('');

  // 6. Sabit giderler ekle
  console.log('🏠 Sabit giderler ekleniyor...');
  const sabitGiderler = [
    { kategori: 'Kira', baslik: 'Kira', miktar: 7500 },
    { kategori: 'Elektrik', baslik: 'Elektrik faturası', miktar: 450 },
    { kategori: 'Su', baslik: 'Su faturası', miktar: 120 },
    { kategori: 'Doğalgaz', baslik: 'Doğalgaz faturası', miktar: 350 },
    { kategori: 'İnternet', baslik: 'İnternet', miktar: 250 },
    { kategori: 'Telefon', baslik: 'Telefon hattı', miktar: 150 },
  ];

  for (const gider of sabitGiderler) {
    const kategori = giderKategorileri.find(k => k.ad === gider.kategori);
    if (kategori) {
      for (let i = 0; i < 3; i++) {
        const tarih = new Date();
        tarih.setMonth(tarih.getMonth() - i);
        tarih.setDate(Math.floor(Math.random() * 10) + 1);
        await prisma.islem.create({
          data: {
            kullaniciId: user.id,
            kategoriId: kategori.id,
            tip: IslemTipi.GIDER,
            baslik: gider.baslik,
            miktar: gider.miktar + randomAmount(-50, 50),
            periyot: Periyot.AYLIK,
            sabitMi: true,
            tarih,
          },
        });
      }
      console.log(`  + ${gider.baslik}: ~₺${gider.miktar}`);
    }
  }
  console.log('');

  // 7. Abonelikler ekle
  console.log('📺 Abonelikler ekleniyor...');
  const abonelikKategori = giderKategorileri.find(k => k.ad === 'Abonelikler');
  const abonelikler = [
    { baslik: 'Netflix', miktar: 99.99 },
    { baslik: 'Spotify', miktar: 59.99 },
    { baslik: 'YouTube Premium', miktar: 79.99 },
    { baslik: 'iCloud', miktar: 25.99 },
  ];

  if (abonelikKategori) {
    for (const abone of abonelikler) {
      for (let i = 0; i < 3; i++) {
        const tarih = new Date();
        tarih.setMonth(tarih.getMonth() - i);
        tarih.setDate(15);
        await prisma.islem.create({
          data: {
            kullaniciId: user.id,
            kategoriId: abonelikKategori.id,
            tip: IslemTipi.GIDER,
            baslik: abone.baslik,
            miktar: abone.miktar,
            periyot: Periyot.AYLIK,
            sabitMi: true,
            tarih,
          },
        });
      }
      console.log(`  + ${abone.baslik}: ₺${abone.miktar}`);
    }
  }
  console.log('');

  // 8. Rastgele günlük harcamalar ekle
  console.log('🛒 Günlük harcamalar ekleniyor...');
  const gunlukHarcamalar = [
    { kategori: 'Market', basliklar: ['Migros', 'A101', 'BIM', 'Carrefour', 'Şok'], min: 150, max: 800 },
    { kategori: 'Yeme & İçme', basliklar: ['Öğle yemeği', 'Akşam yemeği', 'Restoran', 'Fast food', 'Cafe'], min: 80, max: 350 },
    { kategori: 'Kahve', basliklar: ['Starbucks', 'Kahve Dünyası', 'Espresso Lab', 'Nero'], min: 50, max: 150 },
    { kategori: 'Ulaşım', basliklar: ['Taksi', 'Uber', 'Metro/Metrobüs', 'Benzin'], min: 50, max: 500 },
    { kategori: 'Eğlence', basliklar: ['Sinema', 'Konser', 'Bowling', 'Escape room'], min: 100, max: 400 },
    { kategori: 'Alışveriş', basliklar: ['Amazon', 'Trendyol', 'Hepsiburada', 'N11'], min: 100, max: 1500 },
  ];

  let toplamGunlukHarcama = 0;
  for (const harcamaTipi of gunlukHarcamalar) {
    const kategori = giderKategorileri.find(k => k.ad === harcamaTipi.kategori);
    if (kategori) {
      const islemSayisi = Math.floor(Math.random() * 15) + 8; // 8-22 arası işlem
      for (let i = 0; i < islemSayisi; i++) {
        const miktar = randomAmount(harcamaTipi.min, harcamaTipi.max);
        toplamGunlukHarcama += miktar;
        await prisma.islem.create({
          data: {
            kullaniciId: user.id,
            kategoriId: kategori.id,
            tip: IslemTipi.GIDER,
            baslik: harcamaTipi.basliklar[Math.floor(Math.random() * harcamaTipi.basliklar.length)],
            miktar,
            tarih: randomDate(90),
          },
        });
      }
      console.log(`  + ${harcamaTipi.kategori}: ${islemSayisi} işlem`);
    }
  }
  console.log(`  📈 Toplam günlük harcama: ~₺${Math.round(toplamGunlukHarcama).toLocaleString()}\n`);

  // 9. Hedefler ekle
  console.log('🎯 Hedefler ekleniyor...');
  const hedefler = [
    { baslik: 'Yeni Laptop', hedefMiktar: 45000, mevcutMiktar: 18500, aciklama: 'MacBook Pro M3 almak istiyorum' },
    { baslik: 'Tatil Fonu', hedefMiktar: 20000, mevcutMiktar: 8200, aciklama: 'Yaz tatili için birikim' },
    { baslik: 'Acil Durum Fonu', hedefMiktar: 50000, mevcutMiktar: 32000, aciklama: '3 aylık gider karşılığı' },
    { baslik: 'Araba Peşinatı', hedefMiktar: 150000, mevcutMiktar: 45000, aciklama: 'İlk arabam için birikim' },
  ];

  for (const hedef of hedefler) {
    const yeniHedef = await prisma.hedef.create({
      data: {
        kullaniciId: user.id,
        baslik: hedef.baslik,
        hedefMiktar: hedef.hedefMiktar,
        mevcutMiktar: hedef.mevcutMiktar,
        aciklama: hedef.aciklama,
        durum: hedef.mevcutMiktar >= hedef.hedefMiktar ? HedefDurumu.TAMAMLANDI : HedefDurumu.DEVAM_EDIYOR,
        renk: ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 4)],
      },
    });

    // Hedef geçmişi ekle
    const gecmisIslemSayisi = Math.floor(Math.random() * 5) + 3;
    let kalanMiktar = hedef.mevcutMiktar;
    for (let i = 0; i < gecmisIslemSayisi && kalanMiktar > 0; i++) {
      const islemMiktar = Math.min(kalanMiktar, randomAmount(1000, 10000));
      kalanMiktar -= islemMiktar;
      await prisma.hedefGecmisi.create({
        data: {
          hedefId: yeniHedef.id,
          miktar: islemMiktar,
          tarih: randomDate(60),
          notlar: ['Maaştan ayırdım', 'Ek gelirden', 'Birikim', null][Math.floor(Math.random() * 4)],
        },
      });
    }

    const yuzde = Math.round((hedef.mevcutMiktar / hedef.hedefMiktar) * 100);
    console.log(`  + ${hedef.baslik}: ₺${hedef.mevcutMiktar.toLocaleString()} / ₺${hedef.hedefMiktar.toLocaleString()} (%${yuzde})`);
  }
  console.log('');

  // 10. AI önerileri ekle
  console.log('🤖 AI önerileri ekleniyor...');
  const aiOneriler = [
    {
      tip: 'TASARRUF',
      baslik: 'Kahve harcamalarını azaltabilirsin',
      icerik: 'Son ayda kahve harcaman ₺850 olmuş. Eve kahve makinesi alarak aylık ₺600 tasarruf edebilirsin.',
    },
    {
      tip: 'BUTCE',
      baslik: 'Market bütçen aşıldı',
      icerik: 'Bu ay market harcamaların ₺4.200 olmuş. Hedef limitin ₺4.000 idi. Toplu alışveriş yapmayı deneyebilirsin.',
    },
    {
      tip: 'HEDEF',
      baslik: 'Laptop hedefine yaklaşıyorsun!',
      icerik: 'Laptop hedefinin %41\'ini tamamladın. Bu hızla 3 ay içinde hedefe ulaşabilirsin.',
    },
  ];

  for (const oneri of aiOneriler) {
    await prisma.aiOneri.create({
      data: {
        kullaniciId: user.id,
        tip: oneri.tip,
        baslik: oneri.baslik,
        icerik: oneri.icerik,
        veriOzeti: {},
      },
    });
    console.log(`  + ${oneri.tip}: ${oneri.baslik}`);
  }
  console.log('');

  // 11. Bildirimler ekle
  console.log('🔔 Bildirimler ekleniyor...');
  const bildirimler = [
    { tip: 'UYARI', baslik: 'Bütçe Uyarısı', mesaj: 'Market kategorisinde %85 kullanıma ulaştın' },
    { tip: 'BASARI', baslik: 'Hedef İlerlemesi', mesaj: 'Tatil Fonu hedefine ₺2.000 ekledin' },
    { tip: 'BILGI', baslik: 'Aylık Rapor Hazır', mesaj: 'Nisan ayı raporun incelemeye hazır' },
  ];

  for (const bildirim of bildirimler) {
    await prisma.bildirim.create({
      data: {
        kullaniciId: user.id,
        baslik: bildirim.baslik,
        mesaj: bildirim.mesaj,
        tip: bildirim.tip,
      },
    });
    console.log(`  + ${bildirim.tip}: ${bildirim.baslik}`);
  }

  // Özet
  const islemSayisi = await prisma.islem.count({ where: { kullaniciId: user.id } });
  const hedefSayisi = await prisma.hedef.count({ where: { kullaniciId: user.id } });

  console.log('\n========================================');
  console.log('✅ TEST VERİLERİ BAŞARIYLA OLUŞTURULDU!');
  console.log('========================================');
  console.log(`\n📧 Email: ${TEST_USER.email}`);
  console.log(`🔑 Şifre: ${TEST_USER.sifre}`);
  console.log(`\n📊 Özet:`);
  console.log(`   - ${islemSayisi} işlem`);
  console.log(`   - ${hedefSayisi} hedef`);
  console.log(`   - ${butceLimitleri.length} bütçe kalemi`);
  console.log(`   - ${aiOneriler.length} AI önerisi`);
  console.log(`   - ${bildirimler.length} bildirim`);
  console.log('\n🚀 Uygulamaya giriş yaparak test edebilirsin!');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
