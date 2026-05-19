import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.kullanici.findMany();
  if (users.length === 0) {
    console.log("Kullanıcı bulunamadı.");
    return;
  }
  
  for (const user of users) {
    // Find or create a GIDER category for this user or system category
    let kategori = await prisma.kategori.findFirst({
      where: {
        tip: 'GIDER',
        OR: [
          { sistemKategorisi: true },
          { kullaniciId: user.id }
        ]
      }
    });

    if (!kategori) {
      kategori = await prisma.kategori.create({
        data: {
          ad: "Gıda",
          tip: "GIDER",
          renk: "#FF3B30",
          ikon: "utensils",
          sistemKategorisi: true
        }
      });
    }

    const islemler = [
      {
        kullaniciId: user.id,
        kategoriId: kategori.id,
        tip: "GIDER" as any,
        baslik: "Kadıköy Kahve",
        miktar: 150,
        konumAd: "Kadıköy",
        enlem: 40.9901,
        boylam: 29.0207,
        sabitMi: false,
        periyot: "AYLIK" as any
      },
      {
        kullaniciId: user.id,
        kategoriId: kategori.id,
        tip: "GIDER" as any,
        baslik: "Kadıköy Yemek",
        miktar: 600,
        konumAd: "Kadıköy",
        enlem: 40.9850,
        boylam: 29.0250,
        sabitMi: false,
        periyot: "AYLIK" as any
      },
      {
        kullaniciId: user.id,
        kategoriId: kategori.id,
        tip: "GIDER" as any,
        baslik: "Beşiktaş Ulaşım",
        miktar: 200,
        konumAd: "Beşiktaş",
        enlem: 41.0422,
        boylam: 29.0083,
        sabitMi: false,
        periyot: "AYLIK" as any
      },
      {
        kullaniciId: user.id,
        kategoriId: kategori.id,
        tip: "GIDER" as any,
        baslik: "Beşiktaş Market",
        miktar: 450,
        konumAd: "Beşiktaş",
        enlem: 41.0450,
        boylam: 29.0050,
        sabitMi: false,
        periyot: "AYLIK" as any
      }
    ];

    const existing = await prisma.islem.findFirst({
      where: { kullaniciId: user.id, konumAd: "Kadıköy" }
    });

    if (!existing) {
      for (const islem of islemler) {
        await prisma.islem.create({ data: islem });
      }
      console.log(`Mock harcama verileri ${user.email || user.id} için eklendi!`);
    } else {
      console.log(`Mock harcamalar ${user.email || user.id} için zaten var.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
