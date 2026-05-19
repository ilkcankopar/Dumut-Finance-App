

import rateLimit from "express-rate-limit";

export const genel = rateLimit({
windowMs: 15 * 60 * 1000,
max: 1000, // Geliştirme için artırıldı
message: {
success: false,
message: "Çok fazla istek gönderdiniz. 15 dakika sonra tekrar deneyin.",
},
standardHeaders: true,
legacyHeaders: false,
});

export const auth = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100, // Geliştirme için artırıldı (15 dakikada max 100 giriş denemesi)
message: {
success: false,
message:
"Çok fazla giriş denemesi yaptınız. 15 dakika sonra tekrar deneyin.",
},
});

export const sesliAsistan = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 20,
    message: {
        success: false,
        message: "Sesli asistan limitine ulaştınız.",
    },
});