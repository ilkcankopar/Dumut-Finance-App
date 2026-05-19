import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROZETLER = [
  // Tasarruf Rozetleri
  {
    ad: 'İlk Adım',
    aciklama: 'İlk tasarrufunu yap',
    ikon: 'piggyBank',
    renk: '#4CAF50',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 1 },
  },
  {
    ad: 'Kumbaracı',
    aciklama: '100 TL tasarruf et',
    ikon: 'piggyBank',
    renk: '#66BB6A',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 100 },
  },
  {
    ad: 'Biriktirici',
    aciklama: '500 TL tasarruf et',
    ikon: 'moneyBillWave',
    renk: '#43A047',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 500 },
  },
  {
    ad: 'Tasarruf Ustası',
    aciklama: '1000 TL tasarruf et',
    ikon: 'moneyBillWave',
    renk: '#2E7D32',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 1000 },
  },
  {
    ad: 'Finans Gurusu',
    aciklama: '5000 TL tasarruf et',
    ikon: 'university',
    renk: '#1B5E20',
    kosul: { tip: 'TASARRUF_MIKTARI', deger: 5000 },
  },

  // Hedef Rozetleri
  {
    ad: 'Hayalperest',
    aciklama: 'İlk hedefini oluştur',
    ikon: 'bullseye',
    renk: '#2196F3',
    kosul: { tip: 'HEDEF_OLUSTUR', deger: 1 },
  },
  {
    ad: 'Başarıcı',
    aciklama: 'Bir hedefi tamamla',
    ikon: 'checkCircle',
    renk: '#1976D2',
    kosul: { tip: 'HEDEF_TAMAMLA', deger: 1 },
  },
  {
    ad: 'Kararlı',
    aciklama: '3 hedef tamamla',
    ikon: 'checkCircle',
    renk: '#1565C0',
    kosul: { tip: 'HEDEF_TAMAMLA', deger: 3 },
  },
  {
    ad: 'Hedef Avcısı',
    aciklama: '10 hedef tamamla',
    ikon: 'trophy',
    renk: '#0D47A1',
    kosul: { tip: 'HEDEF_TAMAMLA', deger: 10 },
  },

  // İşlem Rozetleri
  {
    ad: 'Kayıt Tutucu',
    aciklama: 'İlk işlemini kaydet',
    ikon: 'receipt',
    renk: '#FF9800',
    kosul: { tip: 'ISLEM_EKLE', deger: 1 },
  },
  {
    ad: 'Düzenli',
    aciklama: '10 işlem kaydet',
    ikon: 'receipt',
    renk: '#FB8C00',
    kosul: { tip: 'ISLEM_EKLE', deger: 10 },
  },
  {
    ad: 'Takipçi',
    aciklama: '50 işlem kaydet',
    ikon: 'chartLine',
    renk: '#F57C00',
    kosul: { tip: 'ISLEM_EKLE', deger: 50 },
  },
  {
    ad: 'Uzman Takipçi',
    aciklama: '100 işlem kaydet',
    ikon: 'chartLine',
    renk: '#EF6C00',
    kosul: { tip: 'ISLEM_EKLE', deger: 100 },
  },
  {
    ad: 'Muhasebeci',
    aciklama: '500 işlem kaydet',
    ikon: 'chartPie',
    renk: '#E65100',
    kosul: { tip: 'ISLEM_EKLE', deger: 500 },
  },

  // Sosyal Rozetler
  {
    ad: 'Sosyal',
    aciklama: 'İlk arkadaşını ekle',
    ikon: 'users',
    renk: '#E91E63',
    kosul: { tip: 'ARKADAS_SAYISI', deger: 1 },
  },
  {
    ad: 'Popüler',
    aciklama: '5 arkadaş edin',
    ikon: 'users',
    renk: '#D81B60',
    kosul: { tip: 'ARKADAS_SAYISI', deger: 5 },
  },
  {
    ad: 'Sosyal Kelebek',
    aciklama: '10 arkadaş edin',
    ikon: 'heart',
    renk: '#C2185B',
    kosul: { tip: 'ARKADAS_SAYISI', deger: 10 },
  },

  // Lig Rozetleri
  {
    ad: 'Gümüş Lig',
    aciklama: 'Gümüş lige yüksel',
    ikon: 'medal',
    renk: '#C0C0C0',
    kosul: { tip: 'LIG', deger: 'Gümüş' },
  },
  {
    ad: 'Altın Lig',
    aciklama: 'Altın lige yüksel',
    ikon: 'trophy',
    renk: '#FFD700',
    kosul: { tip: 'LIG', deger: 'Altın' },
  },
  {
    ad: 'Elmas Lig',
    aciklama: 'Elmas lige yüksel',
    ikon: 'trophy',
    renk: '#00CED1',
    kosul: { tip: 'LIG', deger: 'Elmas' },
  },
  {
    ad: 'Şampiyon Lig',
    aciklama: 'Şampiyon lige yüksel',
    ikon: 'crown',
    renk: '#9C27B0',
    kosul: { tip: 'LIG', deger: 'Şampiyon' },
  },

  // Özel Rozetler
  {
    ad: '7 Gün Serisi',
    aciklama: '7 gün üst üste işlem kaydet',
    ikon: 'calendar',
    renk: '#9C27B0',
    kosul: { tip: 'ARDISIK_GUN', deger: 7 },
  },
  {
    ad: '30 Gün Serisi',
    aciklama: '30 gün üst üste işlem kaydet',
    ikon: 'calendar',
    renk: '#7B1FA2',
    kosul: { tip: 'ARDISIK_GUN', deger: 30 },
  },
  {
    ad: 'Bütçe Ustası',
    aciklama: 'Bütçe limitinin altında kal',
    ikon: 'shield',
    renk: '#673AB7',
    kosul: { tip: 'BUTCE_UYUMU', deger: 100 },
  },
  {
    ad: 'Koleksiyoncu',
    aciklama: '10 rozet kazan',
    ikon: 'star',
    renk: '#FF5722',
    kosul: { tip: 'ROZET_SAYISI', deger: 10 },
  },
  {
    ad: 'Sesli Asistan Hayranı',
    aciklama: '10 işlemi sesle ekle',
    ikon: 'microphone',
    renk: '#00BCD4',
    kosul: { tip: 'SESLE_ISLEM', deger: 10 },
  },

  // Level Rozetleri
  {
    ad: 'Level 10',
    aciklama: 'Level 10\'a ulaş',
    ikon: 'star',
    renk: '#FFC107',
    kosul: { tip: 'LEVEL', deger: 10 },
  },
  {
    ad: 'Level 25',
    aciklama: 'Level 25\'e ulaş',
    ikon: 'star',
    renk: '#FF9800',
    kosul: { tip: 'LEVEL', deger: 25 },
  },
  {
    ad: 'Level 50',
    aciklama: 'Level 50\'ye ulaş',
    ikon: 'medal',
    renk: '#FF5722',
    kosul: { tip: 'LEVEL', deger: 50 },
  },
  {
    ad: 'Level 75',
    aciklama: 'Level 75\'e ulaş',
    ikon: 'trophy',
    renk: '#F44336',
    kosul: { tip: 'LEVEL', deger: 75 },
  },
  {
    ad: 'Level 100',
    aciklama: 'Maksimum level\'a ulaş',
    ikon: 'crown',
    renk: '#9C27B0',
    kosul: { tip: 'LEVEL', deger: 100 },
  },
];

async function seedRozetler() {
  console.log('Rozetler ekleniyor...');

  for (const rozet of ROZETLER) {
    await prisma.rozet.upsert({
      where: { ad: rozet.ad },
      update: {
        aciklama: rozet.aciklama,
        ikon: rozet.ikon,
        renk: rozet.renk,
        kosul: rozet.kosul,
      },
      create: {
        ad: rozet.ad,
        aciklama: rozet.aciklama,
        ikon: rozet.ikon,
        renk: rozet.renk,
        kosul: rozet.kosul,
      },
    });
    console.log(`✓ ${rozet.ad}`);
  }

  console.log(`\n${ROZETLER.length} rozet başarıyla eklendi!`);
}

seedRozetler()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
