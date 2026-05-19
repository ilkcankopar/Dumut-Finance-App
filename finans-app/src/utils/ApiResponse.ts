import { Response } from 'express';


interface PaginationMeta {
    toplam: number;
    sayfa: number;
    sayfaBasinaKayit: number;
    toplamSayfa: number;

}

export class ApiResponse<T> {
    static success<T>(
        res: Response,
        data: T,
        message = 'İşlem Başarılı',
        statusCode = 200
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        })
    }

    static created<T>(res: Response, data: T, message = 'Başarıyla Oluşturuldu') {
        return this.success(res, data, message, 201);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        meta: PaginationMeta,
        message = 'İşlem Başarılı'
    ) {
        return res.status(200).json({
            success: true,
            message,
            data,
            meta
        })
    }
    static noContent(res: Response) {
        return res.status(204).send();
    }

    static error(res: Response, message = 'Bir hata oluştu', statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message
        });
    }
}