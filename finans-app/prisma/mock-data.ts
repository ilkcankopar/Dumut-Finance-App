import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mockData() {
  // Kullanıcıyı bul
  const kullanici = await prisma.kullanici.findFirst({
    where: { email: 'ilkcankopar33@gmail.com' }
  });

  if (!kullanici) {
    console.log('Kullanıcı bulunamadı!');
    return;
  }

  console.log('Kullanıcı bulundu:', kullanici.email);

  // Kategorileri al
  const kategoriler = await prisma.kategori.findMany({
    where: { sistemKategorisi: true }
  });

  const giderKategorileri = kategoriler.filter(k => k.tip === 'GIDER');
  const gelirKategorileri = kategoriler.filter(k => k.tip === 'GELIR');

  // Mevcut işlemleri sil
  await prisma.islem.deleteMany({ where: { kullaniciId: kullanici.id } });
  await prisma.hedefGecmisi.deleteMany({ 
    where: { hedef: { kullaniciId: kullanici.id } } 
  });
  await prisma.hedef.deleteMany({ where: { kullaniciId: kullanici.id } });
  console.log('Eski veriler silindi');

  // Son 30 gün için random işlemler oluştur
  const now = new Date();
  const islemler = [];

  // Gider işlemleri
  const giderOrnekleri = [
    { baslik: 'Starbucks', kategori: 'Yeme & İçme', min: 50, max: 150 },
    { baslik: 'Burger King', kategori: 'Yeme & İçme', min: 80, max: 200 },
    { baslik: 'Migros', kategori: 'Market', min: 200, max: 800 },
    { baslik: 'A101', kategori: 'Market', min: 100, max: 400 },
    { baslik: 'Metro', kategori: 'Ulaşım', min: 20, max: 100 },
    { baslik: 'Uber', kategori: 'Ulaşım', min: 50, max: 200 },
    { baslik: 'Netflix', kategori: 'Abonelikler', min: 100, max: 100 },
    { baslik: 'Spotify', kategori: 'Abonelikler', min: 60, max: 60 },
    { baslik: 'Sinema', kategori: 'Sinema & Konser', min: 150, max: 300 },
    { baslik: 'Eczane', kategori: 'Eczane', min: 50, max: 300 },
    { baslik: 'Kırtasiye', kategori: 'Kitap & Kırtasiye', min: 30, max: 150 },
    { baslik: 'Fotokopi', kategori: 'Fotokopi & Baskı', min: 10, max: 50 },
    { baslik: 'Gym', kategori: 'Spor & Fitness', min: 500, max: 500 },
    { baslik: 'Zara', kategori: 'Giyim', min: 200, max: 800 },
    { baslik: 'Kahve', kategori: 'Yeme & İçme', min: 30, max: 80 },
  ];

  // Gelir işlemleri
  const gelirOrnekleri = [
    { baslik: 'Harçlık', kategori: 'Harçlık', min: 1000, max: 2000 },
    { baslik: 'Burs', kategori: 'Burs', min: 2000, max: 3000 },
    { baslik: 'Part-time', kategori: 'Part-time İş', min: 3000, max: 5000 },
  ];

  const istanbulKonumlar = [
    { konumAd: 'Kadıköy', enlem: 40.9901, boylam: 29.0278 },
    { konumAd: 'Beşiktaş', enlem: 41.0428, boylam: 29.0075 },
    { konumAd: 'Üsküdar', enlem: 41.0267, boylam: 29.0155 },
    { konumAd: 'Şişli', enlem: 41.0600, boylam: 28.9870 },
    { konumAd: 'Beyoğlu', enlem: 41.0370, boylam: 28.9850 },
  ];

  // 30 gün için işlemler oluştur
  for (let i = 0; i < 30; i++) {
    const tarih = new Date(now);
    tarih.setDate(tarih.getDate() - i);

    // Her gün 0-4 gider işlemi
    const gunlukGiderSayisi = Math.floor(Math.random() * 5);
    for (let j = 0; j < gunlukGiderSayisi; j++) {
      const ornek = giderOrnekleri[Math.floor(Math.random() * giderOrnekleri.length)];
      const kategori = giderKategorileri.find(k => k.ad === ornek.kategori);
      if (kategori) {
        // %80 ihtimalle konum ekle
        const konumEkle = Math.random() < 0.8;
        const konum = konumEkle ? istanbulKonumlar[Math.floor(Math.random() * istanbulKonumlar.length)] : null;

        islemler.push({
          kullaniciId: kullanici.id,
          kategoriId: kategori.id,
          tip: 'GIDER' as const,
          baslik: ornek.baslik,
          miktar: Math.floor(Math.random() * (ornek.max - ornek.min + 1)) + ornek.min,
          tarih: tarih,
          enlem: konum ? konum.enlem : null,
          boylam: konum ? konum.boylam : null,
          konumAd: konum ? konum.konumAd : null,
        });
      }
    }

    // Haftada bir gelir
    if (i % 7 === 0 && i > 0) {
      const ornek = gelirOrnekleri[Math.floor(Math.random() * gelirOrnekleri.length)];
      const kategori = gelirKategorileri.find(k => k.ad === ornek.kategori);
      if (kategori) {
        islemler.push({
          kullaniciId: kullanici.id,
          kategoriId: kategori.id,
          tip: 'GELIR' as const,
          baslik: ornek.baslik,
          miktar: Math.floor(Math.random() * (ornek.max - ornek.min + 1)) + ornek.min,
          tarih: tarih,
          enlem: null,
          boylam: null,
          konumAd: null,
        });
      }
    }
  }

  // Ay başı maaş/burs
  const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);
  const bursKategori = gelirKategorileri.find(k => k.ad === 'Burs');
  if (bursKategori) {
    islemler.push({
      kullaniciId: kullanici.id,
      kategoriId: bursKategori.id,
      tip: 'GELIR' as const,
      baslik: 'Aylık Burs',
      miktar: 4000,
      tarih: ayBasi,
      sabitMi: true,
      periyot: 'AYLIK' as const,
    });
  }

  // İşlemleri ekle
  await prisma.islem.createMany({ data: islemler });
  console.log(`${islemler.length} işlem eklendi`);

  // Hedefler ekle
  const hedefler = [
    {
      kullaniciId: kullanici.id,
      baslik: 'MacBook Pro',
      aciklama: 'Yeni MacBook almak istiyorum',
      hedefMiktar: 80000,
      mevcutMiktar: 25000,
      renk: '#1a1a1a',
      ikon: 'laptop',
      durum: 'DEVAM_EDIYOR' as const,
      oncelik: 1,
    },
    {
      kullaniciId: kullanici.id,
      baslik: 'Tatil Fonu',
      aciklama: 'Yaz tatili için birikim',
      hedefMiktar: 15000,
      mevcutMiktar: 8500,
      renk: '#4a4a4a',
      ikon: 'plane',
      durum: 'DEVAM_EDIYOR' as const,
      oncelik: 2,
    },
    {
      kullaniciId: kullanici.id,
      baslik: 'Acil Durum Fonu',
      aciklama: '3 aylık gider kadar birikim',
      hedefMiktar: 30000,
      mevcutMiktar: 12000,
      renk: '#666666',
      ikon: 'shield',
      durum: 'DEVAM_EDIYOR' as const,
      oncelik: 3,
    },
  ];

  for (const hedef of hedefler) {
    await prisma.hedef.create({ data: hedef });
  }
  console.log(`${hedefler.length} hedef eklendi`);

  // Bütçe profili güncelle
  await prisma.butceProfili.upsert({
    where: { kullaniciId: kullanici.id },
    update: {
      aylikHedefHarcama: 8000,
      aylikToplamGelir: 10000,
      kurulumTamamlandi: true,
    },
    create: {
      kullaniciId: kullanici.id,
      aylikHedefHarcama: 8000,
      aylikToplamGelir: 10000,
      kurulumTamamlandi: true,
    },
  });
  console.log('Bütçe profili güncellendi');

  console.log('\n✅ Mock data eklendi!');
}

mockData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
