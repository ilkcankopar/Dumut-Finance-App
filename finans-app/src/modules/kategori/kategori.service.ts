import { prisma } from '../../prisma/client';
import { ApiError } from '@utils/ApiError';
import { KategoriOlusturDto, KategoriGuncelleDto } from './kategori.schema';


export const kategoriService = {
    async tumKategorileriGetir(kullaniciId : string){
        const simdi = new Date();
        const ayBaslangici = new Date(simdi.getFullYear(), simdi.getMonth(), 1);

        const kategoriler = await prisma.kategori.findMany({
            where : {
                aktif : true,
                OR : [
                    {sistemKategorisi : true},
                    {kullaniciId}
                ]
            },
            orderBy : [
                {sistemKategorisi : 'desc'},
                {ad : 'asc'}
            ],
            select :{ 
                id : true,
                ad : true,
                tip : true,
                renk : true,
                ikon : true,
                aylikHedef : true,
                sistemKategorisi : true,
                kullaniciId : true,
                _count : {
                    select : {islemler : true}
                },
                islemler : {
                    where: {
                        tarih: { gte: ayBaslangici },
                        tip: 'GIDER',
                        kullaniciId
                    },
                    select: { miktar: true }
                }
            }
        });

        return kategoriler.map(kat => {
            const harcanan = kat.islemler ? kat.islemler.reduce((acc, islem) => acc + islem.miktar, 0) : 0;
            const { islemler, ...kalan } = kat;
            return { ...kalan, harcanan };
        });
    },

    async kategoriOlustur(kullaniciId : string , dto : KategoriOlusturDto) {
        const mevcutKategori = await prisma.kategori.findFirst({
            where : {
                ad : {equals : dto.ad , mode : 'insensitive'},
                kullaniciId

            }
        });

        if(mevcutKategori){
            throw ApiError.conflict(`"${dto.ad}" adında bir kategori zaten mevcut`);
        }

        return prisma.kategori.create({
            data : {
                ...dto,
                kullaniciId,
                sistemKategorisi : false
            }
        })
    },


    async kategoriGuncelle(
        kullaniciId : string,
        kategoriId : string,
        dto : KategoriGuncelleDto
    ) {
        const kategori = await prisma.kategori.findUnique({
            where : {id : kategoriId}
        });

        if(!kategori) throw ApiError.notFound('Kategori Bulunamadı');

        if (kategori.kullaniciId && kategori.kullaniciId !== kullaniciId) {
            throw ApiError.forbidden("Bu kategoriyi düzenleme yetkiniz yok");
        }

        return prisma.kategori.update({
            where: { id: kategoriId },
            data: dto,
        });
    },

    async kategoriSil(kullaniciId: string, kategoriId: string) {
        const kategori = await prisma.kategori.findUnique({
          where: { id: kategoriId },
          include: { _count: { select: { islemler: true } } },
        });
    
        if (!kategori) throw ApiError.notFound("Kategori bulunamadı");
        if (kategori.sistemKategorisi) {
          throw ApiError.forbidden("Sistem kategorileri silinemez");
        }
        if (kategori.kullaniciId !== kullaniciId) {
          throw ApiError.forbidden("Bu kategoriyi silme yetkiniz yok");
        }
    
        if (kategori._count.islemler > 0) {
          await prisma.kategori.update({
            where: { id: kategoriId },
            data: { aktif: false },
          });
          return { mesaj: "Kategori pasife alındı (bağlı işlemler mevcut)" };
        }
    
        await prisma.kategori.delete({ where: { id: kategoriId } });
        return { mesaj: "Kategori silindi" };
      },
    
}
