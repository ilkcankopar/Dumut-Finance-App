import { PrismaClient, KullaniciTipi, IslemTipi, HedefDurumu } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const rozetler = [
  {
    ad: 'Ilk Adim',
    aciklama: 'Ilk islemini ekledin',
    ikon: 'star',
    renk: '#FFD700',
    kosul: { tip: 'ISLEM_EKLE', deger: 1 },
  },
  {
    ad: 'Duzenli Kullanici',
    aciklama: '50 islem eklendi',
    ikon: 'calendar',
    renk: '#4CAF50',
    kosul: { tip: 'ISLEM_EKLE', deger: 50 },
  },
  {
    ad: 'Butce Ustasi',
    aciklama: '100 islem eklendi',
    ikon: 'wallet',
    renk: '#2196F3',
    kosul: { tip: 'ISLEM_EKLE', deger: 100 },
  },
  {
    ad: 'Hedef Koyucu',
    aciklama: 'Ilk hedefini tamamladin',
    ikon: 'bullseye',
    renk: '#9C27B0',
    kosul: { tip: 'HEDEF_TAMAMLA', deger: 1 },
  },
  {
    ad: 'Hedef Avcisi',
    aciklama: '5 hedef tamamladin',
    ikon: 'bullseye',
    renk: '#E91E63',
    kosul: { tip: 'HEDEF_TAMAMLA', deger: 5 },
  },
  {
    ad: 'Tasarrufcu',
    aciklama: 'Butce uyumu %80 uzeri',
    ikon: 'piggyBank',
    renk: '#00BCD4',
    kosul: { tip: 'BUTCE_UYUMU', deger: 80 },
  },
  {
    ad: 'Kumbara Kralı',
    aciklama: 'Butce uyumu %95 uzeri',
    ikon: 'piggyBank',
    renk: '#FF9800',
    kosul: { tip: 'BUTCE_UYUMU', deger: 95 },
  },
  {
    ad: 'Sosyal Kelebek',
    aciklama: '5 arkadas eklendi',
    ikon: 'heart',
    renk: '#F44336',
    kosul: { tip: 'ARKADAS_SAYISI', deger: 5 },
  },
  {
    ad: 'Populer',
    aciklama: '10 arkadas eklendi',
    ikon: 'heart',
    renk: '#673AB7',
    kosul: { tip: 'ARKADAS_SAYISI', deger: 10 },
  },
  {
    ad: 'Tasarruf Sampiyonu',
    aciklama: 'Ayda 5000 TL tasarruf',
    ikon: 'chartLine',
    renk: '#3F51B5',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 5000 },
  },
];

const testKullanicilar = [
  { email: 'ali@test.com', sifre: 'Test123!', ad: 'Ali', soyad: 'Yilmaz', kullaniciTipi: KullaniciTipi.CALISAN },
  { email: 'ayse@test.com', sifre: 'Test123!', ad: 'Ayse', soyad: 'Demir', kullaniciTipi: KullaniciTipi.OGRENCI },
  { email: 'mehmet@test.com', sifre: 'Test123!', ad: 'Mehmet', soyad: 'Kaya', kullaniciTipi: KullaniciTipi.GIRISIMCI },
  { email: 'fatma@test.com', sifre: 'Test123!', ad: 'Fatma', soyad: 'Celik', kullaniciTipi: KullaniciTipi.CALISAN },
  { email: 'ahmet@test.com', sifre: 'Test123!', ad: 'Ahmet', soyad: 'Ozturk', kullaniciTipi: KullaniciTipi.OGRENCI },
];

async function main() {
  console.log('Sosyal veriler ekleniyor...\n');

  // Rozetleri ekle
  console.log('Rozetler ekleniyor...');
  for (const rozet of rozetler) {
    const mevcut = await prisma.rozet.findUnique({ where: { ad: rozet.ad } });
    if (!mevcut) {
      await prisma.rozet.create({
        data: {
          ad: rozet.ad,
          aciklama: rozet.aciklama,
          ikon: rozet.ikon,
          renk: rozet.renk,
          kosul: rozet.kosul,
        },
      });
      console.log(`  + Rozet: ${rozet.ad}`);
    } else {
      console.log(`  - Rozet: ${rozet.ad} (zaten mevcut)`);
    }
  }

  // Test kullanıcılarını ekle
  console.log('\nTest kullanicilari ekleniyor...');
  const olusturulanKullanicilar: string[] = [];

  for (const kullanici of testKullanicilar) {
    const mevcut = await prisma.kullanici.findUnique({ where: { email: kullanici.email } });
    if (mevcut) {
      console.log(`  - Kullanici: ${kullanici.email} (zaten mevcut)`);
      olusturulanKullanicilar.push(mevcut.id);
      continue;
    }

    const sifreHash = await bcrypt.hash(kullanici.sifre, 10);
    const yeniKullanici = await prisma.kullanici.create({
      data: {
        email: kullanici.email,
        sifreHash,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        kullaniciTipi: kullanici.kullaniciTipi,
        dilKodu: 'tr',
      },
    });

    await prisma.butceProfili.create({
      data: {
        kullaniciId: yeniKullanici.id,
        aylikHedefHarcama: 5000 + Math.random() * 10000,
        aylikToplamGelir: 10000 + Math.random() * 20000,
        kurulumTamamlandi: true,
        paraBirimi: 'TRY',
      },
    });

    olusturulanKullanicilar.push(yeniKullanici.id);
    console.log(`  + Kullanici: ${kullanici.email}`);
  }

  // Arkadaşlık ilişkileri oluştur
  if (olusturulanKullanicilar.length >= 2) {
    console.log('\nArkadaslik iliskileri ekleniyor...');
    const arkadasliklar = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 4],
      [2, 3], [2, 4],
      [3, 4],
    ];

    for (const [i, j] of arkadasliklar) {
      if (i < olusturulanKullanicilar.length && j < olusturulanKullanicilar.length) {
        const mevcut = await prisma.arkadaslik.findFirst({
          where: {
            OR: [
              { gonderenId: olusturulanKullanicilar[i], alinanId: olusturulanKullanicilar[j] },
              { gonderenId: olusturulanKullanicilar[j], alinanId: olusturulanKullanicilar[i] },
            ],
          },
        });

        if (!mevcut) {
          await prisma.arkadaslik.create({
            data: {
              gonderenId: olusturulanKullanicilar[i],
              alinanId: olusturulanKullanicilar[j],
              kabul: true,
            },
          });
          console.log(`  + Arkadaslik: Kullanici ${i + 1} <-> Kullanici ${j + 1}`);
        }
      }
    }
  }

  // Kullanıcılara rozetler ata
  console.log('\nRozetler ataniyor...');
  const tumRozetler = await prisma.rozet.findMany();

  for (let i = 0; i < olusturulanKullanicilar.length; i++) {
    const kullaniciId = olusturulanKullanicilar[i];
    const rozetSayisi = Math.floor(Math.random() * 4) + 1;

    for (let j = 0; j < rozetSayisi && j < tumRozetler.length; j++) {
      const rozet = tumRozetler[j];
      const mevcut = await prisma.kullaniciRozet.findFirst({
        where: { kullaniciId, rozetId: rozet.id },
      });

      if (!mevcut) {
        await prisma.kullaniciRozet.create({
          data: {
            kullaniciId,
            rozetId: rozet.id,
          },
        });
      }
    }
    console.log(`  + Kullanici ${i + 1}: ${rozetSayisi} rozet atandi`);
  }

  // Grup hedefleri oluştur
  if (olusturulanKullanicilar.length >= 2) {
    console.log('\nGrup hedefleri ekleniyor...');
    
    const grupHedefler = [
      { ad: 'Tatil Fonu', aciklama: 'Yaz tatili icin birlikte birikim', hedefMiktar: 50000, renk: '#2196F3' },
      { ad: 'Ev Esyasi', aciklama: 'Yeni ev icin esya alimi', hedefMiktar: 25000, renk: '#4CAF50' },
    ];

    for (const hedef of grupHedefler) {
      const olusturanId = olusturulanKullanicilar[0];
      
      const mevcut = await prisma.grupHedef.findFirst({
        where: { ad: hedef.ad, olusturanId },
      });

      if (!mevcut) {
        const grupHedef = await prisma.grupHedef.create({
          data: {
            ad: hedef.ad,
            aciklama: hedef.aciklama,
            hedefMiktar: hedef.hedefMiktar,
            mevcutMiktar: Math.random() * hedef.hedefMiktar * 0.6,
            renk: hedef.renk,
            olusturanId,
          },
        });

        // İlk 3 kullanıcıyı üye olarak ekle
        for (let i = 0; i < 3 && i < olusturulanKullanicilar.length; i++) {
          await prisma.grupHedefUye.create({
            data: {
              grupHedefId: grupHedef.id,
              kullaniciId: olusturulanKullanicilar[i],
              katki: Math.random() * 5000,
            },
          });
        }

        console.log(`  + Grup Hedef: ${hedef.ad}`);
      }
    }
  }

  console.log('\n-----------------------------');
  console.log('Sosyal veriler basariyla eklendi!');
  console.log(`  - ${rozetler.length} rozet`);
  console.log(`  - ${testKullanicilar.length} test kullanicisi`);
  console.log(`  - Arkadaslik iliskileri`);
  console.log(`  - Grup hedefleri`);
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
