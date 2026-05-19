import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { dilService } from "./dil.service";

const tumDilleriGetir = asyncHandler(async (req: Request, res: Response) => {
  const diller = await dilService.tumDilleriGetir();
  ApiResponse.success(res, diller, "Diller getirildi");
});

const dilDetayGetir = asyncHandler(async (req: Request, res: Response) => {
  const { kod } = req.params;
  const dil = await dilService.dilDetayGetir(kod);
  ApiResponse.success(res, dil, "Dil detayi getirildi");
});

const cevirileriGetir = asyncHandler(async (req: Request, res: Response) => {
  const { kod } = req.params;
  const sonuc = await dilService.cevirileriGetir(kod);
  ApiResponse.success(res, sonuc, "Ceviriler getirildi");
});

const kullaniciDiliniGuncelle = asyncHandler(async (req: Request, res: Response) => {
  const { dilKodu } = req.body;
  const kullanici = await dilService.kullaniciDiliniGuncelle(
    req.kullanici!.id,
    dilKodu
  );
  ApiResponse.success(res, kullanici, "Dil guncellendi");
});

export const dilController = {
  tumDilleriGetir,
  dilDetayGetir,
  cevirileriGetir,
  kullaniciDiliniGuncelle,
};
