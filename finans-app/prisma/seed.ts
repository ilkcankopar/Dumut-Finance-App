import { PrismaClient, KategoriTipi } from '@prisma/client';

const prisma = new PrismaClient();

const sistemDilleri = [
  { kod: 'tr', ad: 'Türkçe' },
  { kod: 'en', ad: 'English' },
  { kod: 'de', ad: 'Deutsch' },
  { kod: 'fr', ad: 'Français' },
];

const ceviriler: Record<string, Record<string, string>> = {
  tr: {
    'common.welcome': 'Hoş Geldiniz',
    'common.login': 'Giriş Yap',
    'common.register': 'Kayıt Ol',
    'common.logout': 'Çıkış Yap',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.add': 'Ekle',
    'common.search': 'Ara',
    'common.filter': 'Filtrele',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'nav.home': 'Ana Sayfa',
    'nav.transactions': 'İşlemler',
    'nav.reports': 'Raporlar',
    'nav.profile': 'Profil',
    'nav.assistant': 'Asistan',
    'dashboard.balance': 'Bakiye',
    'dashboard.income': 'Gelir',
    'dashboard.expense': 'Gider',
    'dashboard.savings': 'Tasarruf',
    'dashboard.budget': 'Bütçe',
    'dashboard.goals': 'Hedefler',
    'transaction.income': 'Gelir',
    'transaction.expense': 'Gider',
    'transaction.amount': 'Tutar',
    'transaction.category': 'Kategori',
    'transaction.date': 'Tarih',
    'transaction.note': 'Not',
    'profile.settings': 'Ayarlar',
    'profile.categories': 'Kategoriler',
    'profile.notifications': 'Bildirimler',
    'profile.language': 'Dil',
    'profile.theme': 'Tema',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.name': 'Ad',
    'auth.surname': 'Soyad',
    'auth.forgotPassword': 'Şifremi Unuttum',
    'auth.googleLogin': 'Google ile Giriş',
    'onboarding.selectLanguage': 'Dil Seçin',
    'onboarding.continue': 'Devam Et',
  },
  en: {
    'common.welcome': 'Welcome',
    'common.login': 'Login',
    'common.register': 'Register',
    'common.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'nav.home': 'Home',
    'nav.transactions': 'Transactions',
    'nav.reports': 'Reports',
    'nav.profile': 'Profile',
    'nav.assistant': 'Assistant',
    'dashboard.balance': 'Balance',
    'dashboard.income': 'Income',
    'dashboard.expense': 'Expense',
    'dashboard.savings': 'Savings',
    'dashboard.budget': 'Budget',
    'dashboard.goals': 'Goals',
    'transaction.income': 'Income',
    'transaction.expense': 'Expense',
    'transaction.amount': 'Amount',
    'transaction.category': 'Category',
    'transaction.date': 'Date',
    'transaction.note': 'Note',
    'profile.settings': 'Settings',
    'profile.categories': 'Categories',
    'profile.notifications': 'Notifications',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'First Name',
    'auth.surname': 'Last Name',
    'auth.forgotPassword': 'Forgot Password',
    'auth.googleLogin': 'Login with Google',
    'onboarding.selectLanguage': 'Select Language',
    'onboarding.continue': 'Continue',
  },
  de: {
    'common.welcome': 'Willkommen',
    'common.login': 'Anmelden',
    'common.register': 'Registrieren',
    'common.logout': 'Abmelden',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'nav.home': 'Startseite',
    'nav.transactions': 'Transaktionen',
    'nav.reports': 'Berichte',
    'nav.profile': 'Profil',
    'nav.assistant': 'Assistent',
    'dashboard.balance': 'Kontostand',
    'dashboard.income': 'Einkommen',
    'dashboard.expense': 'Ausgaben',
    'dashboard.savings': 'Ersparnisse',
    'dashboard.budget': 'Budget',
    'dashboard.goals': 'Ziele',
    'transaction.income': 'Einkommen',
    'transaction.expense': 'Ausgabe',
    'transaction.amount': 'Betrag',
    'transaction.category': 'Kategorie',
    'transaction.date': 'Datum',
    'transaction.note': 'Notiz',
    'profile.settings': 'Einstellungen',
    'profile.categories': 'Kategorien',
    'profile.notifications': 'Benachrichtigungen',
    'profile.language': 'Sprache',
    'profile.theme': 'Design',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.name': 'Vorname',
    'auth.surname': 'Nachname',
    'auth.forgotPassword': 'Passwort vergessen',
    'auth.googleLogin': 'Mit Google anmelden',
    'onboarding.selectLanguage': 'Sprache wählen',
    'onboarding.continue': 'Weiter',
  },
  fr: {
    'common.welcome': 'Bienvenue',
    'common.login': 'Connexion',
    'common.register': 'Inscription',
    'common.logout': 'Déconnexion',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'nav.home': 'Accueil',
    'nav.transactions': 'Transactions',
    'nav.reports': 'Rapports',
    'nav.profile': 'Profil',
    'nav.assistant': 'Assistant',
    'dashboard.balance': 'Solde',
    'dashboard.income': 'Revenus',
    'dashboard.expense': 'Dépenses',
    'dashboard.savings': 'Épargne',
    'dashboard.budget': 'Budget',
    'dashboard.goals': 'Objectifs',
    'transaction.income': 'Revenu',
    'transaction.expense': 'Dépense',
    'transaction.amount': 'Montant',
    'transaction.category': 'Catégorie',
    'transaction.date': 'Date',
    'transaction.note': 'Note',
    'profile.settings': 'Paramètres',
    'profile.categories': 'Catégories',
    'profile.notifications': 'Notifications',
    'profile.language': 'Langue',
    'profile.theme': 'Thème',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Prénom',
    'auth.surname': 'Nom',
    'auth.forgotPassword': 'Mot de passe oublié',
    'auth.googleLogin': 'Connexion avec Google',
    'onboarding.selectLanguage': 'Choisir la langue',
    'onboarding.continue': 'Continuer',
  },
};

const sistemKategorileri = [
  // =====================
  // GİDER KATEGORİLERİ
  // =====================
  
  // Yeme & İçme (En çok kullanılan)
  { ad: 'Yeme & İçme', tip: KategoriTipi.GIDER, renk: '#F97316', ikon: 'utensils' },
  { ad: 'Market', tip: KategoriTipi.GIDER, renk: '#22C55E', ikon: 'shoppingCart' },
  
  // Ulaşım
  { ad: 'Ulaşım', tip: KategoriTipi.GIDER, renk: '#3B82F6', ikon: 'bus' },
  { ad: 'Yakıt', tip: KategoriTipi.GIDER, renk: '#64748B', ikon: 'gasPump' },
  
  // Konut & Faturalar
  { ad: 'Kira', tip: KategoriTipi.GIDER, renk: '#6366F1', ikon: 'home' },
  { ad: 'Elektrik', tip: KategoriTipi.GIDER, renk: '#F59E0B', ikon: 'lightbulb' },
  { ad: 'Su', tip: KategoriTipi.GIDER, renk: '#06B6D4', ikon: 'home' },
  { ad: 'Doğalgaz', tip: KategoriTipi.GIDER, renk: '#EF4444', ikon: 'gasPump' },
  { ad: 'İnternet', tip: KategoriTipi.GIDER, renk: '#8B5CF6', ikon: 'wifi' },
  { ad: 'Telefon', tip: KategoriTipi.GIDER, renk: '#10B981', ikon: 'mobile' },
  
  // Eğitim & Öğrenci
  { ad: 'Eğitim', tip: KategoriTipi.GIDER, renk: '#0EA5E9', ikon: 'graduationCap' },
  { ad: 'Kitap & Kırtasiye', tip: KategoriTipi.GIDER, renk: '#0284C7', ikon: 'book' },
  { ad: 'Fotokopi & Baskı', tip: KategoriTipi.GIDER, renk: '#475569', ikon: 'file' },
  { ad: 'Kurs & Sertifika', tip: KategoriTipi.GIDER, renk: '#7C3AED', ikon: 'certificate' },
  
  // Abonelikler & Eğlence
  { ad: 'Abonelikler', tip: KategoriTipi.GIDER, renk: '#EC4899', ikon: 'tv' },
  { ad: 'Eğlence', tip: KategoriTipi.GIDER, renk: '#A855F7', ikon: 'gamepad' },
  { ad: 'Sinema & Konser', tip: KategoriTipi.GIDER, renk: '#E11D48', ikon: 'film' },
  
  // Sağlık & Kişisel Bakım
  { ad: 'Sağlık', tip: KategoriTipi.GIDER, renk: '#EF4444', ikon: 'stethoscope' },
  { ad: 'Eczane', tip: KategoriTipi.GIDER, renk: '#F43F5E', ikon: 'pills' },
  { ad: 'Spor & Fitness', tip: KategoriTipi.GIDER, renk: '#84CC16', ikon: 'dumbbell' },
  { ad: 'Kişisel Bakım', tip: KategoriTipi.GIDER, renk: '#D946EF', ikon: 'cut' },
  
  // Giyim & Alışveriş
  { ad: 'Giyim', tip: KategoriTipi.GIDER, renk: '#F472B6', ikon: 'tshirt' },
  { ad: 'Alışveriş', tip: KategoriTipi.GIDER, renk: '#FB923C', ikon: 'shoppingBag' },
  
  // Teknoloji
  { ad: 'Teknoloji', tip: KategoriTipi.GIDER, renk: '#64748B', ikon: 'laptop' },
  
  // Hediye & Sosyal
  { ad: 'Hediye', tip: KategoriTipi.GIDER, renk: '#FB7185', ikon: 'gift' },
  { ad: 'Bağış', tip: KategoriTipi.GIDER, renk: '#C084FC', ikon: 'heart' },
  
  // Seyahat
  { ad: 'Seyahat', tip: KategoriTipi.GIDER, renk: '#38BDF8', ikon: 'plane' },
  
  // Araç (opsiyonel)
  { ad: 'Araç Bakım', tip: KategoriTipi.GIDER, renk: '#475569', ikon: 'car' },
  
  // Ev & Yaşam
  { ad: 'Ev Eşyası', tip: KategoriTipi.GIDER, renk: '#78716C', ikon: 'couch' },
  
  // Finans
  { ad: 'Kredi Ödemesi', tip: KategoriTipi.GIDER, renk: '#7C3AED', ikon: 'bank' },
  { ad: 'Sigorta', tip: KategoriTipi.GIDER, renk: '#1E293B', ikon: 'shield' },
  
  // Diğer
  { ad: 'Diğer Gider', tip: KategoriTipi.GIDER, renk: '#94A3B8', ikon: 'tag' },
  
  // =====================
  // GELİR KATEGORİLERİ
  // =====================
  { ad: 'Maaş', tip: KategoriTipi.GELIR, renk: '#22C55E', ikon: 'moneyBill' },
  { ad: 'Burs', tip: KategoriTipi.GELIR, renk: '#0EA5E9', ikon: 'graduationCap' },
  { ad: 'Harçlık', tip: KategoriTipi.GELIR, renk: '#8B5CF6', ikon: 'wallet' },
  { ad: 'Part-time İş', tip: KategoriTipi.GELIR, renk: '#14B8A6', ikon: 'briefcase' },
  { ad: 'Freelance', tip: KategoriTipi.GELIR, renk: '#06B6D4', ikon: 'laptop' },
  { ad: 'Ek Gelir', tip: KategoriTipi.GELIR, renk: '#10B981', ikon: 'plus' },
  { ad: 'Yatırım Getirisi', tip: KategoriTipi.GELIR, renk: '#F59E0B', ikon: 'chartLine' },
  { ad: 'Kira Geliri', tip: KategoriTipi.GELIR, renk: '#6366F1', ikon: 'home' },
  { ad: 'Hediye', tip: KategoriTipi.GELIR, renk: '#EC4899', ikon: 'gift' },
  { ad: 'Satış', tip: KategoriTipi.GELIR, renk: '#A855F7', ikon: 'tag' },
  { ad: 'İade', tip: KategoriTipi.GELIR, renk: '#D946EF', ikon: 'receipt' },
  { ad: 'Diğer Gelir', tip: KategoriTipi.GELIR, renk: '#84CC16', ikon: 'plus' },
];

async function main() {
  // Dilleri ekle
  console.log('Sistem dilleri ekleniyor...\n');
  
  for (const dil of sistemDilleri) {
    const mevcut = await prisma.dil.findUnique({
      where: { kod: dil.kod },
    });

    if (!mevcut) {
      await prisma.dil.create({
        data: { kod: dil.kod, ad: dil.ad, aktif: true },
      });
      console.log(`  + Dil: ${dil.ad}`);
    } else {
      console.log(`  - Dil: ${dil.ad} (zaten mevcut)`);
    }
  }

  // Çevirileri ekle
  console.log('\nÇeviriler ekleniyor...\n');
  
  for (const [dilKodu, ceviriListesi] of Object.entries(ceviriler)) {
    let ceviriEklenen = 0;
    for (const [anahtar, deger] of Object.entries(ceviriListesi)) {
      const mevcut = await prisma.ceviri.findUnique({
        where: { dilKodu_anahtar: { dilKodu, anahtar } },
      });

      if (!mevcut) {
        await prisma.ceviri.create({
          data: { dilKodu, anahtar, deger },
        });
        ceviriEklenen++;
      }
    }
    console.log(`  ${dilKodu}: ${ceviriEklenen} yeni çeviri eklendi`);
  }

  // Kategorileri ekle
  console.log('\nSistem kategorileri ekleniyor...\n');

  let eklenen = 0;
  let atlanan = 0;

  for (const kategori of sistemKategorileri) {
    // Önce bu kategorinin var olup olmadığını kontrol et
    const mevcut = await prisma.kategori.findFirst({
      where: {
        ad: kategori.ad,
        sistemKategorisi: true,
      },
    });

    if (mevcut) {
      console.log(`  - ${kategori.ad} (zaten mevcut)`);
      atlanan++;
      continue;
    }

    // Yoksa oluştur
    await prisma.kategori.create({
      data: {
        ad: kategori.ad,
        tip: kategori.tip,
        renk: kategori.renk,
        ikon: kategori.ikon,
        sistemKategorisi: true,
        kullaniciId: null,
      },
    });
    console.log(`  + ${kategori.ad}`);
    eklenen++;
  }

  console.log(`\n-----------------------------`);
  console.log(`Eklenen: ${eklenen} kategori`);
  console.log(`Atlanan: ${atlanan} kategori (zaten mevcut)`);
  console.log(`Toplam: ${sistemKategorileri.length} sistem kategorisi`);
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
