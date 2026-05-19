import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { islemService } from "./islem.service";
import { ocrService } from "./ocr.service";
import { prisma } from "../../prisma/client";

export const islemController = {
olustur: asyncHandler(async (req: Request, res: Response) => {
const veri = await islemService.islemOlustur(req.kullanici!.id, req.body);
ApiResponse.created(res, veri, "İşlem oluşturuldu");
}),

listele: asyncHandler(async (req: Request, res: Response) => {
const { islemler, meta } = await islemService.islemleriGetir(
req.kullanici!.id,
req.query as any
);
ApiResponse.paginated(res, islemler, meta);
}),

getir: asyncHandler(async (req: Request, res: Response) => {
const veri = await islemService.islemGetir(
req.kullanici!.id,
req.params.id
);
ApiResponse.success(res, veri);
}),

guncelle: asyncHandler(async (req: Request, res: Response) => {
const veri = await islemService.islemGuncelle(
req.kullanici!.id,
req.params.id,
req.body
);
ApiResponse.success(res, veri, "İşlem güncellendi");
}),

sil: asyncHandler(async (req: Request, res: Response) => {
const veri = await islemService.islemSil(
req.kullanici!.id,
req.params.id
);
ApiResponse.success(res, veri);
}),

ozet: asyncHandler(async (req: Request, res: Response) => {
const { baslangic, bitis } = req.query;

const bugun = new Date();
const ayBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
const ayBitis = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);

const veri = await islemService.ozet(
req.kullanici!.id,
baslangic ? new Date(baslangic as string) : ayBaslangic,
bitis ? new Date(bitis as string) : ayBitis
);

ApiResponse.success(res, veri, "Özet getirildi");
}),

haritaOzeti: asyncHandler(async (req: Request, res: Response) => {
  const { baslangic, bitis } = req.query;
  const veri = await islemService.haritaOzeti(
    req.kullanici!.id,
    baslangic ? new Date(baslangic as string) : undefined,
    bitis ? new Date(bitis as string) : undefined
  );
  ApiResponse.success(res, veri, "Harita özeti getirildi");
}),

/** Yakın ödemeleri getir */
yakinOdemeler: asyncHandler(async (req: Request, res: Response) => {
const veri = await islemService.yakinOdemeleriGetir(req.kullanici!.id);
ApiResponse.success(res, veri, "Yakın ödemeler getirildi");
}),

/** Ödeme durumunu güncelle */
odemeDurumuGuncelle: asyncHandler(async (req: Request, res: Response) => {
const { id } = req.params;
const { odendi } = req.body;
const veri = await islemService.odemeDurumGuncelle(
req.kullanici!.id,
id,
odendi
);
ApiResponse.success(res, veri, odendi ? "Ödeme işaretlendi" : "Ödeme kaldırıldı");
}),

/** Fiş tarama (OCR) */
ocrTara: asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    ApiResponse.error(res, "Lütfen bir fiş görseli yükleyin.", 400);
    return;
  }
  
  const veri = await ocrService.fisTara(req.file.buffer, req.file.mimetype);
  
  // Try to find the category by name
  let kategoriId = null;
  const kategori = await prisma.kategori.findFirst({
    where: { ad: { contains: veri.kategoriAd, mode: "insensitive" } }
  });
  if (kategori) {
    kategoriId = kategori.id;
  }

  ApiResponse.success(res, { ...veri, kategoriId }, "Fiş başarıyla tarandı.");
}),
};