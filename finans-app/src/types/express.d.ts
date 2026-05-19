interface KullaniciBilgi {
    id: string;
    email: string;
    kullaniciTipi: string;
}

declare global {
    namespace Express {
        interface Request {
            kullanici?: KullaniciBilgi;
            user?: KullaniciBilgi;
        }
    }
}
