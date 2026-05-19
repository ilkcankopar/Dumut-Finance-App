import { PrismaClient, IslemTipi, Periyot, KategoriTipi } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Kullanıcıyı bul
  const kullanici = await prisma.kullanici.findUnique({
    where: { email: 'ilkcankopar1903@gmail.com' }
  });

  if (!kullanici) {
    console.log('Kullanıcı bulunamadı!');
    return;
  }

  console.log('Kullanıcı bulundu:', kullanici.id);

  // Kategorileri bul veya oluştur
  let gelirKategori = await prisma.kategori.findFirst({
    where: { ad: 'Maaş', sistemKategorisi: true }
  });

  if (!gelirKategori) {
    gelirKategori = await prisma.kategori.create({
      data: {
        ad: 'Maaş',
        tip: KategoriTipi.GELIR,
        renk: '#4CAF50',
        ikon: 'wallet',
        sistemKategorisi: true,
      }
    });
    console.log('Gelir kategorisi oluşturuldu');
  }

  let kiraKategori = await prisma.kategori.findFirst({
    where: { ad: 'Kira', sistemKategorisi: true }
  });

  if (!kiraKategori) {
    kiraKategori = await prisma.kategori.create({
      data: {
        ad: 'Kira',
        tip: KategoriTipi.GIDER,
        renk: '#F44336',
        ikon: 'home',
        sistemKategorisi: true,
      }
    });
    console.log('Kira kategorisi oluşturuldu');
  }

  let borcKategori = await prisma.kategori.findFirst({
    where: { ad: 'Borç', sistemKategorisi: true }
  });

  if (!borcKategori) {
    borcKategori = await prisma.kategori.create({
      data: {
        ad: 'Borç',
        tip: KategoriTipi.GIDER,
        renk: '#FF9800',
        ikon: 'creditCard',
        sistemKategorisi: true,
      }
    });
    console.log('Borç kategorisi oluşturuldu');
  }

  // Bütçe profilini oluştur veya güncelle
  const butceProfili = await prisma.butceProfili.upsert({
    where: { kullaniciId: kullanici.id },
    update: {
      aylikToplamGelir: 41000,
      aylikHedefHarcama: 20000,
      kurulumTamamlandi: true,
    },
    create: {
      kullaniciId: kullanici.id,
      aylikToplamGelir: 41000,
      aylikHedefHarcama: 20000,
      paraBirimi: 'TRY',
      kurulumTamamlandi: true,
    },
  });

  console.log('Bütçe profili oluşturuldu:', butceProfili.id);

  // Sabit Gelirler
  const gelirler = [
    { baslik: 'Dişhane Maaş', miktar: 15000, odemeGunu: 10 },
    { baslik: 'Süreyya', miktar: 6500, odemeGunu: 10 },
    { baslik: 'Annem', miktar: 13000, odemeGunu: 10 },
    { baslik: 'Neffa', miktar: 6500, odemeGunu: 10 },
  ];

  for (const gelir of gelirler) {
    await prisma.islem.create({
      data: {
        kullaniciId: kullanici.id,
        kategoriId: gelirKategori.id,
        baslik: gelir.baslik,
        miktar: gelir.miktar,
        tip: IslemTipi.GELIR,
        periyot: Periyot.AYLIK,
        sabitMi: true,
        odemeGunu: gelir.odemeGunu,
        odendi: false,
        tarih: new Date(),
      },
    });
    console.log(`Gelir eklendi: ${gelir.baslik} - ${gelir.miktar} TL`);
  }

  // Sabit Giderler
  const giderler = [
    { baslik: 'Kira', miktar: 17000, odemeGunu: 17, kategori: kiraKategori.id },
    { baslik: 'Ofis Kirası', miktar: 12500, odemeGunu: 1, kategori: kiraKategori.id },
    { baslik: 'Kredi Kartı', miktar: 30000, odemeGunu: 28, kategori: borcKategori.id },
    { baslik: 'Kredi Borcu', miktar: 17000, odemeGunu: 30, kategori: borcKategori.id },
  ];

  for (const gider of giderler) {
    await prisma.islem.create({
      data: {
        kullaniciId: kullanici.id,
        kategoriId: gider.kategori,
        baslik: gider.baslik,
        miktar: gider.miktar,
        tip: IslemTipi.GIDER,
        periyot: Periyot.AYLIK,
        sabitMi: true,
        odemeGunu: gider.odemeGunu,
        odendi: false,
        tarih: new Date(),
      },
    });
    console.log(`Gider eklendi: ${gider.baslik} - ${gider.miktar} TL`);
  }

  console.log('\n--- ÖZET ---');
  console.log('Toplam Gelir: 41.000 TL');
  console.log('Toplam Gider: 76.500 TL');
  console.log('Aylık Harcama Hedefi: 20.000 TL');
  console.log('\nTüm veriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });