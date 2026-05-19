import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
console.log('eneshasil22@gmail.com için takip örnekleri ekleniyor...\n');

const kullanici = await prisma.kullanici.findUnique({
where: { email: 'eneshasil22@gmail.com' }
});

if (!kullanici) {
console.log('Kullanıcı bulunamadı');
return;
}

// THYAO hissesini takip et
let hisse = await prisma.hisse.upsert({
where: { sembol: 'THYAO' },
update: {},
create: {
sembol: 'THYAO',
ad: 'Türk Hava Yolları',
borsaKodu: 'BIST',
paraBirimi: 'TRY'
}
});

await prisma.hisseTakip.upsert({
where: { kullaniciId_hisseId: { kullaniciId: kullanici.id, hisseId: hisse.id } },
update: {},
create: { kullaniciId: kullanici.id, hisseId: hisse.id, hedefFiyat: 300 }
});
console.log(' + THYAO takibe eklendi');

// GARAN hissesini takip et
hisse = await prisma.hisse.upsert({
where: { sembol: 'GARAN' },
update: {},
create: {
sembol: 'GARAN',
ad: 'Garanti BBVA',
borsaKodu: 'BIST',
paraBirimi: 'TRY'
}
});

await prisma.hisseTakip.upsert({
where: { kullaniciId_hisseId: { kullaniciId: kullanici.id, hisseId: hisse.id } },
update: {},
create: { kullaniciId: kullanici.id, hisseId: hisse.id, hedefFiyat: 50 }
});
console.log(' + GARAN takibe eklendi');

// Bitcoin takip et
let kripto = await prisma.kripto.upsert({
where: { sembol: 'BTC' },
update: {},
create: {
sembol: 'BTC',
ad: 'Bitcoin',
geckoId: 'bitcoin'
}
});

await prisma.kriptoTakip.upsert({
where: { kullaniciId_kriptoId: { kullaniciId: kullanici.id, kriptoId: kripto.id } },
update: {},
create: { kullaniciId: kullanici.id, kriptoId: kripto.id, hedefFiyat: 100000 }
});
console.log(' + Bitcoin takibe eklendi');

console.log('\nTakip örnekleri başarıyla eklendi!');
}

main()
.catch((e) => {
console.error('Hata:', e);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});