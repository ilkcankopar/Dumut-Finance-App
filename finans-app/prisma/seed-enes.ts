import { PrismaClient, KategoriTipi, IslemTipi, Periyot, KullaniciTipi } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
console.log('eneshasil22@gmail.com için mock veri ekleniyor...\n');

// Kullanıcıyı bul
let kullanici = await prisma.kullanici.findUnique({
where: { email: 'eneshasil22@gmail.com' }
});

if (!kullanici) {
// Kullanıcı yoksa oluştur (hash olmadan basit)
kullanici = await prisma.kullanici.create({
data: {
ad: 'Enes',
soyad: 'Hasıl',
email: 'eneshasil22@gmail.com',
sifreHash: '$2b$10$dummy.hash.for.seed',
kullaniciTipi: KullaniciTipi.CALISAN,
dilKodu: 'tr'
}
});
console.log(' + Yeni kullanıcı oluşturuldu:', kullanici.id);

// Bütçe profili oluştur
await prisma.butceProfili.create({
data: {
kullaniciId: kullanici.id,
aylikHedefHarcama: 15000,
aylikToplamGelir: 35000,
kurulumTamamlandi: true,
paraBirimi: 'TRY'
}
});
console.log(' + Bütçe profili oluşturuldu');
} else {
console.log(' - Kullanıcı bulundu:', kullanici.id);

// Bütçe profilini güncelle
await prisma.butceProfili.upsert({
where: { kullaniciId: kullanici.id },
update: {
aylikHedefHarcama: 15000,
aylikToplamGelir: 35000,
kurulumTamamlandi: true,
},
create: {
kullaniciId: kullanici.id,
aylikHedefHarcama: 15000,
aylikToplamGelir: 35000,
kurulumTamamlandi: true,
paraBirimi: 'TRY'
}
});
console.log(' + Bütçe profili güncellendi');
}

const kullaniciId = kullanici.id;

// Kategorileri bul
const kategoriler = await prisma.kategori.findMany({
where: { sistemKategorisi: true }
});

const kategoriMap = new Map(kategoriler.map(k => [k.ad, k]));

// Sistem kategorilerinin harcama hedeflerini (aylikHedef) Enes için güncelleyelim
const harcamaHedefleri: Record<string, number> = {
  'Kira': 9000,
  'Market': 5000,
  'Yeme & İçme': 3000,
  'Elektrik': 600,
  'Doğalgaz': 1000,
  'Abonelikler': 500,
  'Giyim': 3000,
  'Kahve': 1000,
  'Yakıt': 2500,
  'Spor': 1200
};

for (const [ad, hedef] of Object.entries(harcamaHedefleri)) {
  const kat = kategoriMap.get(ad);
  if (kat) {
    await prisma.kategori.update({
      where: { id: kat.id },
      data: { aylikHedef: hedef }
    });
  }
}
console.log(' + Kategori bütçe hedefleri güncellendi');

// Mevcut işlemleri sil (temiz başlangıç için)
await prisma.islem.deleteMany({
where: { kullaniciId }
});
console.log(' - Mevcut işlemler silindi');

const simdi = new Date();
const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);

// GELİR İŞLEMLERİ
const gelirIslemleri = [
{
baslik: 'Maaş - Ocak',
miktar: 35000,
tip: IslemTipi.GELIR,
kategoriId: kategoriMap.get('Maaş')?.id,
tarih: new Date(ayBasi),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 1,
},
{
baslik: 'Yatırım Getirisi - Borsa',
miktar: 2500,
tip: IslemTipi.GELIR,
kategoriId: kategoriMap.get('Yatırım Getirisi')?.id,
tarih: new Date(ayBasi.getTime() + 5 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'BİST portföy getirisi',
},
];

// GİDER İŞLEMLERİ
const giderIslemleri = [
// Sabit Giderler
{
baslik: 'Kira',
miktar: 8500,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Kira')?.id,
tarih: new Date(ayBasi.getTime() + 3 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 5,
},
{
baslik: 'Elektrik Faturası',
miktar: 450,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Elektrik')?.id,
tarih: new Date(ayBasi.getTime() + 10 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 15,
},
{
baslik: 'Doğalgaz Faturası',
miktar: 650,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Doğalgaz')?.id,
tarih: new Date(ayBasi.getTime() + 12 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 20,
},
{
baslik: 'İnternet',
miktar: 299,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('İnternet')?.id,
tarih: new Date(ayBasi.getTime() + 7 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 10,
},
{
baslik: 'Telefon',
miktar: 250,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Telefon')?.id,
tarih: new Date(ayBasi.getTime() + 8 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 12,
},
// Değişken Giderler
{
baslik: 'Market Alışverişi',
miktar: 3500,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Market')?.id,
tarih: new Date(ayBasi.getTime() + 4 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'Haftalık market',
},
{
baslik: 'Restoran',
miktar: 1200,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Yeme & İçme')?.id,
tarih: new Date(ayBasi.getTime() + 6 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'Akşam yemeği dışarıda',
},
{
baslik: 'Kahve',
miktar: 400,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Kahve')?.id,
tarih: new Date(ayBasi.getTime() + 2 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'Günlük kahve',
},
{
baslik: 'Yakıt',
miktar: 1500,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Yakıt')?.id,
tarih: new Date(ayBasi.getTime() + 9 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'Aylık yakıt',
},
{
baslik: 'Netflix',
miktar: 149,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Abonelikler')?.id,
tarih: new Date(ayBasi.getTime() + 1 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 2,
},
{
baslik: 'Spotify',
miktar: 49,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Müzik')?.id,
tarih: new Date(ayBasi.getTime() + 1 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 2,
},
{
baslik: 'Spor Salonu',
miktar: 800,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Spor')?.id,
tarih: new Date(ayBasi.getTime() + 3 * 24 * 60 * 60 * 1000),
sabitMi: true,
periyot: Periyot.AYLIK,
odemeGunu: 5,
},
{
baslik: 'Giyim',
miktar: 1500,
tip: IslemTipi.GIDER,
kategoriId: kategoriMap.get('Giyim')?.id,
tarih: new Date(ayBasi.getTime() + 11 * 24 * 60 * 60 * 1000),
sabitMi: false,
notlar: 'Yeni sezon alışverişi',
},
];

// Tüm işlemleri ekle
const islemler = [...gelirIslemleri, ...giderIslemleri];

let eklenen = 0;
for (const islem of islemler) {
if (islem.kategoriId) {
await prisma.islem.create({
data: {
kullaniciId,
kategoriId: islem.kategoriId,
baslik: islem.baslik,
miktar: islem.miktar,
tip: islem.tip,
tarih: islem.tarih,
sabitMi: islem.sabitMi,
periyot: islem.periyot || Periyot.AYLIK,
odemeGunu: islem.odemeGunu,
notlar: islem.notlar || null,
odendi: false,
}
});
eklenen++;
}
}

console.log(` + ${eklenen} işlem eklendi`);
console.log('\n--- ÖZET ---');
console.log('Toplam Gelir:', gelirIslemleri.reduce((sum, i) => sum + i.miktar, 0).toLocaleString('tr-TR'), 'TL');
console.log('Toplam Gider:', giderIslemleri.reduce((sum, i) => sum + i.miktar, 0).toLocaleString('tr-TR'), 'TL');
console.log('Bakiye (tahmini):', (gelirIslemleri.reduce((sum, i) => sum + i.miktar, 0) - giderIslemleri.reduce((sum, i) => sum + i.miktar, 0)).toLocaleString('tr-TR'), 'TL');
console.log('\nMock veri başarıyla eklendi!');
}

main()
.catch((e) => {
console.error('Hata:', e);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});