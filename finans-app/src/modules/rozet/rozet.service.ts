import { prisma } from '../../prisma/client';
import { levelService, XP_KAZANIMLARI } from '../level/level.service';

interface RozetKosul {
  tip: string;
  deger: number | string;
}

export const rozetService = {
  async tumRozetleriGetir() {
    return prisma.rozet.findMany({
      orderBy: { ad: 'asc' },
    });
  },

  async kullaniciRozetleriGetir(kullaniciId: string) {
    const [kazanilanlar, tumRozetler] = await Promise.all([
      prisma.kullaniciRozet.findMany({
        where: { kullaniciId },
        include: { rozet: true },
        orderBy: { kazanildi: 'desc' },
      }),
      prisma.rozet.findMany({ orderBy: { ad: 'asc' } }),
    ]);

    const kazanilanIdler = new Set(kazanilanlar.map(r => r.rozetId));

    return {
      kazanilan: kazanilanlar.map((r) => ({
        ...r.rozet,
        kazanildi: r.kazanildi,
        durum: 'kazanildi' as const,
      })),
      kazanilmayan: tumRozetler
        .filter(r => !kazanilanIdler.has(r.id))
        .map(r => ({
          ...r,
          kazanildi: null,
          durum: 'kilitli' as const,
        })),
      toplam: tumRozetler.length,
      kazanilanSayisi: kazanilanlar.length,
    };
  },

  async rozetKontrolEt(kullaniciId: string) {
    const tumRozetler = await prisma.rozet.findMany();
    const kazanilmisRozetler = await prisma.kullaniciRozet.findMany({
      where: { kullaniciId },
      select: { rozetId: true },
    });
    const kazanilmisIdler = new Set(kazanilmisRozetler.map((r) => r.rozetId));

    const kazanilmayanRozetler = tumRozetler.filter((r) => !kazanilmisIdler.has(r.id));

    const yeniKazanilanlar: string[] = [];

    for (const rozet of kazanilmayanRozetler) {
      const kosul = rozet.kosul as unknown as RozetKosul;
      const kazanildi = await this.kosulKontrol(kullaniciId, kosul);

      if (kazanildi) {
        await prisma.kullaniciRozet.create({
          data: {
            kullaniciId,
            rozetId: rozet.id,
          },
        });
        yeniKazanilanlar.push(rozet.id);

        // XP ver
        await levelService.xpEkle(kullaniciId, XP_KAZANIMLARI.ROZET_KAZAN, `Rozet kazanıldı: ${rozet.ad}`);

        await prisma.bildirim.create({
          data: {
            kullaniciId,
            baslik: 'Yeni Rozet Kazandınız!',
            mesaj: `"${rozet.ad}" rozetini kazandınız: ${rozet.aciklama}`,
            okundu: false,
            tip: 'ROZET',
          },
        });
      }
    }

    if (yeniKazanilanlar.length > 0) {
      const yeniRozetler = await prisma.rozet.findMany({
        where: { id: { in: yeniKazanilanlar } },
      });
      return { yeniRozetler, kazanilanSayisi: yeniKazanilanlar.length };
    }

    return { yeniRozetler: [], kazanilanSayisi: 0 };
  },

  async kosulKontrol(kullaniciId: string, kosul: RozetKosul): Promise<boolean> {
    const deger = typeof kosul.deger === 'number' ? kosul.deger : 0;
    
    switch (kosul.tip) {
      case 'HEDEF_TAMAMLA': {
        const tamamlanan = await prisma.hedef.count({
          where: { kullaniciId, durum: 'TAMAMLANDI' },
        });
        return tamamlanan >= deger;
      }

      case 'HEDEF_OLUSTUR': {
        const hedefSayisi = await prisma.hedef.count({
          where: { kullaniciId },
        });
        return hedefSayisi >= deger;
      }

      case 'ISLEM_EKLE': {
        const islemSayisi = await prisma.islem.count({
          where: { kullaniciId },
        });
        return islemSayisi >= deger;
      }

      case 'SESLE_ISLEM': {
        const sesliIslemSayisi = await prisma.islem.count({
          where: { kullaniciId, sesleEklendi: true },
        });
        return sesliIslemSayisi >= deger;
      }

      case 'BUTCE_UYUMU': {
        const profil = await prisma.butceProfili.findUnique({
          where: { kullaniciId },
        });
        if (!profil || !profil.aylikHedefHarcama) return false;

        const buAy = new Date();
        buAy.setDate(1);
        buAy.setHours(0, 0, 0, 0);

        const toplamHarcama = await prisma.islem.aggregate({
          where: {
            kullaniciId,
            tip: 'GIDER',
            tarih: { gte: buAy },
          },
          _sum: { miktar: true },
        });

        const harcama = toplamHarcama._sum.miktar || 0;
        return harcama <= profil.aylikHedefHarcama;
      }

      case 'ARKADAS_SAYISI': {
        const arkadasSayisi = await prisma.arkadaslik.count({
          where: {
            kabul: true,
            OR: [
              { gonderenId: kullaniciId },
              { alinanId: kullaniciId },
            ],
          },
        });
        return arkadasSayisi >= deger;
      }

      case 'TASARRUF_MIKTARI': {
        const [gelirler, giderler] = await Promise.all([
          prisma.islem.aggregate({
            where: { kullaniciId, tip: 'GELIR' },
            _sum: { miktar: true },
          }),
          prisma.islem.aggregate({
            where: { kullaniciId, tip: 'GIDER' },
            _sum: { miktar: true },
          }),
        ]);

        const tasarruf = (gelirler._sum.miktar || 0) - (giderler._sum.miktar || 0);
        return tasarruf >= deger;
      }

      case 'ARDISIK_GUN': {
        const seri = await prisma.seri.findFirst({
          where: { kullaniciId, tip: 'islem' },
          select: { enUzunSeri: true },
        });
        return (seri?.enUzunSeri || 0) >= deger;
      }

      case 'LIG': {
        const kullanici = await prisma.kullanici.findUnique({
          where: { id: kullaniciId },
          select: { lig: true },
        });
        
        const ligSirasi = ['Bronz', 'Gümüş', 'Altın', 'Elmas', 'Şampiyon'];
        const mevcutLigIndex = ligSirasi.indexOf(kullanici?.lig || 'Bronz');
        const hedefLigIndex = ligSirasi.indexOf(kosul.deger as string);
        
        return mevcutLigIndex >= hedefLigIndex;
      }

      case 'LEVEL': {
        const kullanici = await prisma.kullanici.findUnique({
          where: { id: kullaniciId },
          select: { level: true },
        });
        return (kullanici?.level || 1) >= deger;
      }

      case 'ROZET_SAYISI': {
        const rozetSayisi = await prisma.kullaniciRozet.count({
          where: { kullaniciId },
        });
        return rozetSayisi >= deger;
      }

      default:
        return false;
    }
  },
};
