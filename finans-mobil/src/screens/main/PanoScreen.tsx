import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../../theme';
import { Card, ProgressBar, Icon, Button, MiniMap } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { piyasaApi, HisseTakip, KriptoTakip } from '../../api/piyasa';
import { levelApi, LevelDurum } from '../../api/level';
import { saveWidgetData } from '../../services/widgetService';

const AppLogo = require('../../../app.png');

const ICON_COLOR = '#1a1a1a';
const ICON_COLOR_LIGHT = '#666';

interface Props {
  navigation: any;
}

interface ButceDurumu {
  profil: {
    aylikHedefHarcama: number;
    aylikToplamGelir: number;
    paraBirimi: string;
  };
  donemOzeti: {
    toplamGelir: number;
    toplamGider: number;
    netTasarruf: number;
    hedefKullanimYuzdesi: number;
    tasarrufPotansiyeli: number;
    durum: 'NORMAL' | 'UYARI' | 'ASIMI';
    kalanButce?: number;
    kalanGun?: number;
    gunlukHarcamaLimiti?: number;
    haftalikHarcamaLimiti?: number;
    ortalamaGunlukHarcama?: number;
  };
  kalemiDurumu: any[];
}

interface Hedef {
  id: string;
  baslik: string;
  hedefMiktar: number;
  mevcutMiktar: number;
  durum: string;
}

interface Islem {
  id: string;
  baslik: string;
  miktar: number;
  tip: 'GELIR' | 'GIDER';
  tarih: string;
  kategori: {
    ad: string;
    ikon: string;
    renk: string;
  };
}

// Level XP hesaplama
const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level <= 5) return (level - 1) * 100 + (level - 2) * 50;
  if (level <= 10) return 700 + (level - 5) * 300;
  return 2200 + (level - 10) * 500;
};

const getLigName = (level: number): string => {
  if (level <= 5) return 'Bronz';
  if (level <= 10) return 'Gumus';
  if (level <= 15) return 'Altin';
  if (level <= 25) return 'Platin';
  if (level <= 50) return 'Elmas';
  return 'Sampiyon';
};

const getIslemIconInfo = (baslik: string, tip: string, kategoriIkon?: string, kategoriRenk?: string) => {
  const lower = baslik.toLowerCase();
  if (lower.includes('netflix')) return { name: 'netflix' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('spotify')) return { name: 'spotify' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('youtube')) return { name: 'youtube' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('amazon')) return { name: 'amazon' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('apple')) return { name: 'apple' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('google')) return { name: 'google' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('steam')) return { name: 'steam' as const, color: ICON_COLOR, bg: '#f5f5f5' };
  if (lower.includes('playstation') || lower.includes('psn')) return { name: 'playstation' as const, color: ICON_COLOR, bg: '#f5f5f5' };

  if (kategoriIkon) {
    return {
      name: (kategoriIkon as any) || 'tag',
      color: ICON_COLOR,
      bg: '#f5f5f5'
    };
  }

  return {
    name: (tip === 'GELIR' ? 'arrowUp' : 'arrowDown') as any,
    color: ICON_COLOR,
    bg: '#f5f5f5'
  };
};

export const PanoScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const [butceDurumu, setButceDurumu] = useState<ButceDurumu | null>(null);
  const [hedefler, setHedefler] = useState<Hedef[]>([]);
  const [sonIslemler, setSonIslemler] = useState<Islem[]>([]);
  const [sabitIslemler, setSabitIslemler] = useState<Islem[]>([]);
  const [gunlukIpucu, setGunlukIpucu] = useState<string>('');
  const [takipListesi, setTakipListesi] = useState<{ hisseTakipler: HisseTakip[]; kriptoTakipler: KriptoTakip[] }>({ hisseTakipler: [], kriptoTakipler: [] });
  const [haritaOzeti, setHaritaOzeti] = useState<any>(null);

  // Level durumu
  const [levelDurum, setLevelDurum] = useState<LevelDurum | null>(null);
  const [yakinOdemeler, setYakinOdemeler] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [aiYatirimOneri, setAiYatirimOneri] = useState<string>('');
  const [loadingAiOneri, setLoadingAiOneri] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Level durumunu API'den yükle
  const loadLevelDurum = useCallback(async () => {
    try {
      const durum = await levelApi.durumGetir();
      setLevelDurum(durum);
    } catch (e) {
      console.log('Level load error:', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [butceRes, hedefRes, islemRes, sabitIslemRes, ipucuRes, yakinOdemelerRes, takipRes, kategoriRes, aiOneriRes, haritaRes] = await Promise.all([
        apiClient.get('/butce/durum').catch(() => null),
        apiClient.get('/hedef').catch(() => null),
        apiClient.get('/islem?sayfaBasinaKayit=5&sayfa=1').catch(() => null),
        apiClient.get('/islem?sabitMi=true&sayfaBasinaKayit=10&sayfa=1').catch(() => null),
        apiClient.get('/butce/gunluk-ipucu').catch(() => null),
        apiClient.get('/islem/yakin-odemeler').catch(() => null),
        piyasaApi.takipListesi().catch(() => null),
        apiClient.get('/kategori').catch(() => null),
        apiClient.get('/butce/ai-yatirim-onerisi').catch(() => null),
        apiClient.get('/islem/harita-ozeti').catch(() => null),
      ]);

      if (butceRes?.data?.data) {
        setButceDurumu(butceRes.data.data);
      }

      if (hedefRes?.data?.data) {
        setHedefler(hedefRes.data.data);
      }

      if (islemRes?.data?.data) {
        const islemData = Array.isArray(islemRes.data.data)
          ? islemRes.data.data
          : islemRes.data.data.islemler || [];
        setSonIslemler(islemData);
      }

      if (sabitIslemRes?.data?.data) {
        const sabitData = Array.isArray(sabitIslemRes.data.data)
          ? sabitIslemRes.data.data
          : sabitIslemRes.data.data.islemler || [];
        setSabitIslemler(sabitData);
      }

      if (ipucuRes?.data?.data?.ipucu) {
        setGunlukIpucu(ipucuRes.data.data.ipucu);
      }

      if (yakinOdemelerRes?.data?.data?.odemeler) {
        setYakinOdemeler(yakinOdemelerRes.data.data.odemeler);
      }

      if (kategoriRes?.data?.data) {
        setKategoriler(kategoriRes.data.data);
      }

      if (takipRes) {
        setTakipListesi(takipRes);
      }

      if (aiOneriRes?.data?.data?.oneri) {
        setAiYatirimOneri(aiOneriRes.data.data.oneri);
      }

      if (haritaRes?.data?.data) {
        setHaritaOzeti(haritaRes.data.data);
      }

      // Widget verisini güncelle
      const butceData = butceRes?.data?.data;
      const hedefData = hedefRes?.data?.data?.[0];
      if (butceData) {
        saveWidgetData({
          gunlukHarcama: Math.round(butceData.donemOzeti?.ortalamaGunlukHarcama || 0),
          gunlukLimit: Math.round(butceData.donemOzeti?.gunlukHarcamaLimiti || 500),
          toplamGelir: Math.round(butceData.donemOzeti?.toplamGelir || 0),
          toplamGider: Math.round(butceData.donemOzeti?.toplamGider || 0),
          hedefAdi: hedefData?.baslik || 'Hedef',
          mevcutMiktar: Math.round(hedefData?.mevcutMiktar || 0),
          hedefMiktar: Math.round(hedefData?.hedefMiktar || 1000),
        });
      }
    } catch (error) {
      console.log('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const yenileAiOneri = async () => {
    setLoadingAiOneri(true);
    try {
      const res = await apiClient.get('/butce/ai-yatirim-onerisi');
      if (res?.data?.data?.oneri) {
        setAiYatirimOneri(res.data.data.oneri);
      }
    } catch (e) {
      console.log('AI Yatirim oneri hatasi', e);
    } finally {
      setLoadingAiOneri(false);
    }
  };

  // Ekrana her odaklanıldığında verileri yenile
  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadLevelDurum();
    }, [fetchData, loadLevelDurum])
  );

  const navigateToBildirimler = () => {
    navigation.navigate('Bildirimler');
  };

  const navigateToAsistan = () => {
    navigation.navigate('Asistan');
  };

  const navigateToAiOneriler = () => {
    navigation.navigate('AiOneriler');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  // Basit bütçe hesaplamaları
  const toplamGider = butceDurumu?.donemOzeti?.toplamGider || 0;
  const toplamGelir = butceDurumu?.donemOzeti?.toplamGelir || 0;

  // Sabit giderler toplamı (kira, kredi vb. - zorunlu giderler)
  const sabitGiderlerToplami = sabitIslemler
    .filter(i => i.tip === 'GIDER')
    .reduce((acc, i) => acc + i.miktar, 0);

  // Sabit gelirler toplamı
  const sabitGelirlerToplami = sabitIslemler
    .filter(i => i.tip === 'GELIR')
    .reduce((acc, i) => acc + i.miktar, 0);

  // Sabit işlemler net = sabit gelirler - sabit giderler
  const sabitNet = sabitGelirlerToplami - sabitGiderlerToplami;

  // Net Kalan = Toplam Gelir - Toplam Gider
  const netKalan = toplamGelir - toplamGider;

  const butceDurum = netKalan < 0 ? 'ASIMI' : netKalan < toplamGelir * 0.2 ? 'UYARI' : 'NORMAL';

  // Günlük / Haftalık hesaplamalar
  const bugun = new Date();
  const ayinSonGunu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).getDate();
  const kalanGun = ayinSonGunu - bugun.getDate() + 1;
  const gunlukLimit = kalanGun > 0 && netKalan > 0 ? netKalan / kalanGun : 0;
  const haftalikLimit = gunlukLimit * 7;
  const gecenGun = bugun.getDate();
  const ortalamaGunluk = gecenGun > 0 ? toplamGider / gecenGun : 0;

  // Hedef hesaplamaları
  const toplamHedefMiktar = hedefler.reduce((acc, h) => acc + (h.hedefMiktar || 0), 0);
  const toplamMevcutMiktar = hedefler.reduce((acc, h) => acc + (h.mevcutMiktar || 0), 0);
  const hedefYuzdesi = toplamHedefMiktar > 0
    ? Math.round((toplamMevcutMiktar / toplamHedefMiktar) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={navigateToBildirimler}>
            <Icon name="bell" size={20} color={ICON_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerProfile} onPress={() => navigation.navigate('Profil')}>
            <Text style={styles.profileInitials}>
              {user?.ad?.substring(0, 2).toUpperCase() || 'US'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={ICON_COLOR_LIGHT} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşlem, kategori ara..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <>
            {/* Minimalist Level Badge - En Üstte */}
            {levelDurum && (
              <TouchableOpacity 
                style={styles.levelBadgeTop}
                onPress={() => navigation.navigate('Rozetler')}
                activeOpacity={0.8}
              >
                <View style={styles.levelBadgeCircle}>
                  <Text style={styles.levelBadgeNumber}>{levelDurum.level}</Text>
                </View>
                <View style={styles.levelBadgeInfo}>
                  <Text style={styles.levelBadgeUnvan}>{levelDurum.unvan}</Text>
                  <View style={styles.levelBadgeXPRow}>
                    <Text style={styles.levelBadgeXP}>{levelDurum.toplamXP.toLocaleString()} XP</Text>
                    <View style={styles.levelBadgeProgress}>
                      <View style={[styles.levelBadgeProgressFill, { width: `${levelDurum.ilerlemeYuzdesi}%` }]} />
                    </View>
                  </View>
                </View>
                <Icon name="chevronRight" size={14} color={ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            )}

            {/* Hoşgeldin Mesajı */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.welcomeSection}>
              <View style={styles.welcomeHeaderRow}>
                <Text style={styles.welcomeText}>
                  Merhaba, <Text style={styles.welcomeName}>{user?.ad || 'Kullanıcı'}</Text>
                </Text>
                {user?.kullaniciTipi && (
                  <View style={[
                    styles.accountTypeBadge,
                    user.kullaniciTipi === 'OGRENCI' && { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
                    user.kullaniciTipi === 'GIRISIMCI' && { backgroundColor: '#f5f5f5', borderColor: '#e8e8e8' },
                    user.kullaniciTipi === 'BUSINESS' && { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' },
                  ]}>
                    <Icon 
                      name={
                        user.kullaniciTipi === 'OGRENCI' ? 'book' : 
                        user.kullaniciTipi === 'GIRISIMCI' ? 'lightbulb' : 
                        user.kullaniciTipi === 'BUSINESS' ? 'briefcase' : 'user'
                      } 
                      size={12} 
                      color={
                        user.kullaniciTipi === 'OGRENCI' ? '#0284C7' : 
                        user.kullaniciTipi === 'GIRISIMCI' ? '#1a1a1a' : 
                        user.kullaniciTipi === 'BUSINESS' ? '#9333EA' : colors.primary
                      } 
                    />
                    <Text style={[
                      styles.accountTypeBadgeText,
                      user.kullaniciTipi === 'OGRENCI' && { color: '#0284C7' },
                      user.kullaniciTipi === 'GIRISIMCI' && { color: '#1a1a1a' },
                      user.kullaniciTipi === 'BUSINESS' && { color: '#9333EA' },
                    ]}>
                      {user.kullaniciTipi === 'OGRENCI' ? 'Öğrenci Hesabı' : 
                       user.kullaniciTipi === 'GIRISIMCI' ? 'Girişimci Hesabı' : 
                       user.kullaniciTipi === 'BUSINESS' ? 'İşletme Hesabı' : 'Bireysel'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.welcomeSubtext}>Bugün finansal durumun nasıl?</Text>
            </Animated.View>

            {/* Günlük AI İpucu */}
            {gunlukIpucu ? (
              <Animated.View entering={FadeInDown.delay(50).duration(400)}>
                <TouchableOpacity
                  style={styles.tipCard}
                  onPress={navigateToAiOneriler}
                  activeOpacity={0.85}
                >
                  <View style={styles.tipIconWrap}>
                    <Icon name="lightbulb" size={18} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.tipText}>{gunlukIpucu}</Text>
                  <Icon name="chevronRight" size={14} color={ICON_COLOR_LIGHT} />
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            {/* Hızlı İşlem - Sesli Asistan */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <TouchableOpacity style={styles.quickActionCard} onPress={navigateToAsistan} activeOpacity={0.8}>
                <View style={styles.quickActionLeft}>
                  <View style={styles.micIconWrapper}>
                    <Icon name="microphone" size={24} color={colors.onPrimary} />
                  </View>
                  <View>
                    <Text style={styles.quickActionTitle}>Hızlı İşlem</Text>
                    <Text style={styles.quickActionSubtitle}>Sesli komutla işlem ekle</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={18} color={ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            </Animated.View>

            {/* Bütçe Özeti */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Card variant="outlined" style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetTitle}>Bu Ay</Text>
                  <View style={[
                    styles.budgetBadge,
                    butceDurum === 'UYARI' && styles.budgetBadgeWarning,
                    butceDurum === 'ASIMI' && styles.budgetBadgeError,
                  ]}>
                    <Text style={[
                      styles.budgetBadgeText,
                      butceDurum === 'UYARI' && styles.budgetBadgeTextWarning,
                      butceDurum === 'ASIMI' && styles.budgetBadgeTextError,
                    ]}>
                      {toplamGelir > 0 ? Math.round((toplamGider / toplamGelir) * 100) : 0}%
                    </Text>
                  </View>
                </View>

                {toplamGelir > 0 || toplamGider > 0 ? (
                  <>
                    <View style={styles.budgetMain}>
                      <Text style={styles.budgetLabel}>Net Kalan</Text>
                      <Text style={[styles.budgetValue, netKalan < 0 && styles.budgetValueNegative]}>
                        {formatCurrency(netKalan)}
                      </Text>
                      <Text style={styles.budgetSubtext}>
                        {netKalan >= 0 ? 'Bu ay tasarruf yaptın!' : 'Bu ay harcamaların gelirini aştı'}
                      </Text>
                    </View>

                    <View style={styles.budgetFooter}>
                      <View style={styles.budgetFooterItem}>
                        <Text style={styles.budgetFooterLabel}>Gelir</Text>
                        <Text style={[styles.budgetFooterValue, { color: colors.success }]}>
                          {formatCurrency(toplamGelir)}
                        </Text>
                      </View>
                      <View style={styles.budgetFooterDivider} />
                      <View style={styles.budgetFooterItem}>
                        <Text style={styles.budgetFooterLabel}>Gider</Text>
                        <Text style={[styles.budgetFooterValue, { color: colors.error }]}>
                          {formatCurrency(toplamGider)}
                        </Text>
                      </View>
                      <View style={styles.budgetFooterDivider} />
                      <View style={styles.budgetFooterItem}>
                        <Text style={styles.budgetFooterLabel}>Net Kalan</Text>
                        <Text style={[styles.budgetFooterValue, { color: netKalan < 0 ? colors.error : colors.success }]}>
                          {formatCurrency(netKalan)}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.budgetEmpty}>
                    <Text style={styles.budgetEmptyText}>Henüz işlem yok</Text>
                    <Text style={styles.budgetEmptyHint}>
                      İşlem ekleyerek başla
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Akıllı Finans Danışmanı Kartı */}
            <Animated.View entering={FadeInDown.delay(220).duration(400)}>
              <Card variant="featured" style={{ marginVertical: spacing.md, padding: spacing.md, borderRadius: 24, backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#1a1a1a' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="lightbulb" size={20} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1a1a1a' }}>Akıllı Finans Danışmanı</Text>
                      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#666666' }}>Bütçene ve piyasaya özel tavsiyeler</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAiModal(true);
                      if (!aiYatirimOneri) {
                        yenileAiOneri();
                      }
                    }}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                  >
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFF' }}>Öneri Al</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>

            {/* Harcama Coğrafyası Kartı */}
            <Animated.View entering={FadeInDown.delay(230).duration(400)}>
              <Card variant="outlined" style={styles.mapGeographyCard}>
                <View style={styles.mapCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.mapIconWrap}>
                      <Icon name="mapMarkerAlt" size={20} color="#ffffff" />
                    </View>
                    <View>
                      <Text style={styles.mapCardTitle}>Harcama Coğrafyası</Text>
                      <Text style={styles.mapCardSubtitle}>En çok harcadığın bölgeler</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => navigation.navigate('HaritaOzeti')}
                  >
                    <Text style={styles.mapButtonText}>Haritayı Aç</Text>
                  </TouchableOpacity>
                </View>

                {haritaOzeti?.enCokHarcananKonum ? (
                  <View style={styles.mapCardContent}>
                    <Text style={styles.mapSummaryText}>
                      📍 Bu hafta en çok <Text style={{ fontFamily: 'Poppins_700Bold', color: colors.primary }}>{haritaOzeti.enCokHarcananKonum.konumAd}</Text> bölgesinde harcama yaptın.
                    </Text>

                    <View style={{ marginVertical: spacing.sm, borderRadius: 16, overflow: 'hidden' }}>
                      <MiniMap haritaVerisi={haritaOzeti.haritaVerisi || []} height={200} />
                    </View>

                    <View style={styles.mapStatsRow}>
                      <View style={styles.mapStatItem}>
                        <Text style={styles.mapStatLabel}>Toplam Gider</Text>
                        <Text style={styles.mapStatValue}>{haritaOzeti.enCokHarcananKonum.toplamGider.toLocaleString('tr-TR')} TL</Text>
                      </View>
                      <View style={styles.mapStatDivider} />
                      <View style={styles.mapStatItem}>
                        <Text style={styles.mapStatLabel}>İşlem Sayısı</Text>
                        <Text style={styles.mapStatValue}>{haritaOzeti.enCokHarcananKonum.islemSayisi} adet</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mapEmptyContent}>
                    <Text style={styles.mapEmptyText}>
                      Henüz konum eklenmiş bir harcaman yok. İşlem eklerken GPS konumunu açarak harcama haritanı oluşturabilirsin!
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>


            {/* Günlük/Haftalık Harcama Limitleri */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)}>
              <Card variant="outlined" style={styles.spendingCard}>
                <View style={styles.spendingHeader}>
                  <Icon name="calendar" size={18} color={ICON_COLOR} />
                  <Text style={styles.spendingTitle}>Harcama Rehberi</Text>
                  <View style={styles.kalanGunBadge}>
                    <Text style={styles.kalanGunText}>{kalanGun} gün kaldı</Text>
                  </View>
                </View>

                <View style={styles.spendingGrid}>
                  <View style={styles.spendingItem}>
                    <Text style={styles.spendingLabel}>Günlük Limit</Text>
                    <Text style={styles.spendingValue}>{formatCurrency(gunlukLimit)}</Text>
                    <Text style={styles.spendingHint}>harcayabilirsin</Text>
                  </View>
                  <View style={styles.spendingDivider} />
                  <View style={styles.spendingItem}>
                    <Text style={styles.spendingLabel}>Haftalık Limit</Text>
                    <Text style={styles.spendingValue}>{formatCurrency(haftalikLimit)}</Text>
                    <Text style={styles.spendingHint}>harcayabilirsin</Text>
                  </View>
                </View>

                {ortalamaGunluk > 0 && (
                  <View style={styles.spendingAverage}>
                    <Text style={styles.spendingAverageLabel}>
                      Şu ana kadar günlük ortalama:
                    </Text>
                    <Text style={[
                      styles.spendingAverageValue,
                      ortalamaGunluk > gunlukLimit && { color: colors.error }
                    ]}>
                      {formatCurrency(ortalamaGunluk)}
                    </Text>
                    {ortalamaGunluk > gunlukLimit ? (
                      <Text style={styles.spendingWarning}>Limitin üzerinde!</Text>
                    ) : (
                      <Text style={styles.spendingSuccess}>Hedefte gidiyorsun</Text>
                    )}
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Yakın Ödemeler */}
            {yakinOdemeler.length > 0 && (
              <Animated.View entering={FadeInDown.delay(255).duration(400)}>
                <Card variant="outlined" style={styles.yakinOdemelerCard}>
                  <View style={styles.yakinOdemelerHeader}>
                    <Icon name="calendar" size={18} color={ICON_COLOR} />
                    <Text style={styles.yakinOdemelerTitle}>Yakın Ödemeler</Text>
                    <View style={styles.yakinOdemelerCount}>
                      <Text style={styles.yakinOdemelerCountText}>{yakinOdemeler.length}</Text>
                    </View>
                  </View>
                  {yakinOdemeler.slice(0, 4).map((odeme, index) => {
                    const durumRenk = odeme.durum === 'YAKIN' ? colors.error : odeme.durum === 'BU_HAFTA' ? '#F59E0B' : colors.primary;
                    return (
                      <View
                        key={odeme.id || index}
                        style={[
                          styles.yakinOdemeItem,
                          index === Math.min(yakinOdemeler.length, 4) - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <View style={[styles.yakinOdemeIcon, { backgroundColor: colors.primaryContainer + '40' }]}>
                          <Icon name="creditCard" size={16} color={ICON_COLOR} />
                        </View>
                        <View style={styles.yakinOdemeInfo}>
                          <Text style={styles.yakinOdemeBaslik} numberOfLines={1}>{odeme.baslik}</Text>
                          <Text style={styles.yakinOdemeTarih}>
                            {odeme.gunFarki === 0 ? 'Bugün' : odeme.gunFarki === 1 ? 'Yarın' : `${odeme.gunFarki} gün sonra`}
                          </Text>
                        </View>
                        <View style={styles.yakinOdemeRight}>
                          <Text style={styles.yakinOdemeMiktar}>₺{odeme.miktar.toLocaleString('tr-TR')}</Text>
                          <View style={[styles.yakinOdemeDurum, { backgroundColor: durumRenk + '20' }]}>
                            <Text style={[styles.yakinOdemeDurumText, { color: durumRenk }]}>
                              {odeme.gunFarki} gün
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.yakinOdemelerButton}
                    onPress={() => navigation.navigate('Islemler')}
                  >
                    <Text style={styles.yakinOdemelerButtonText}>Tümünü Gör</Text>
                    <Icon name="chevronRight" size={14} color={ICON_COLOR_LIGHT} />
                  </TouchableOpacity>
                </Card>
              </Animated.View>
            )}

            {/* Kategoriye Göre Harcama */}
            {butceDurumu?.kalemiDurumu && butceDurumu.kalemiDurumu.length > 0 && (
              <Animated.View entering={FadeInDown.delay(260).duration(400)}>
                <Card variant="outlined" style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Icon name="chartPie" size={18} color={ICON_COLOR} />
                    <Text style={styles.categoryTitle}>Harcama Dağılımı</Text>
                  </View>
                  <View style={styles.categoryList}>
                    {butceDurumu.kalemiDurumu.slice(0, 5).map((item: any, index: number) => {
                      const yuzde = toplamGider > 0 ? Math.round((item.harcanan / toplamGider) * 100) : 0;
                      return (
                        <View key={item.kategoriId || index} style={styles.categoryItem}>
                          <View style={styles.categoryLeft}>
                            <View style={[styles.categoryDot, { backgroundColor: item.kategori?.renk || colors.primary }]} />
                            <Text style={styles.categoryName} numberOfLines={1}>{item.kategori?.ad || 'Kategori'}</Text>
                          </View>
                          <View style={styles.categoryRight}>
                            <Text style={styles.categoryAmount}>{formatCurrency(item.harcanan)}</Text>
                            <Text style={styles.categoryPercent}>{yuzde}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Takip Listem (Kripto & BIST) */}
            {(takipListesi?.hisseTakipler?.length > 0 || takipListesi?.kriptoTakipler?.length > 0) && (
              <Animated.View entering={FadeInDown.delay(240).duration(400)}>
                <Card variant="outlined" style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <View style={styles.recentHeaderLeft}>
                      <Icon name="star" size={18} color={ICON_COLOR} />
                      <Text style={styles.recentTitle}>Takip Listem</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Piyasa')}>
                      <Text style={styles.recentSeeAll}>Piyasa</Text>
                    </TouchableOpacity>
                  </View>

                  {takipListesi.hisseTakipler.slice(0, 3).map((hisse, index) => (
                    <TouchableOpacity
                      key={`hisse-${hisse.id || index}`}
                      style={[
                        styles.takipItemRow,
                        index === Math.min(takipListesi.hisseTakipler.length, 3) - 1 && takipListesi.kriptoTakipler.length === 0 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => navigation.navigate('HisseDetay', { sembol: hisse.sembol, borsa: 'BIST' })}
                    >
                      <View style={styles.takipItemLeft}>
                        {(hisse.icon || hisse.ikon) ? (
                          <Image source={{ uri: hisse.icon || hisse.ikon }} style={styles.takipImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.takipIconPlaceholder}>
                            <Text style={styles.takipIconPlaceholderText}>
                              {hisse.sembol.slice(0, 2)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.takipInfo}>
                          <Text style={styles.takipSembol}>{hisse.sembol}</Text>
                          <Text style={styles.takipAd} numberOfLines={1}>{hisse.ad || 'Hisse'}</Text>
                          {netKalan > 0 && Number(hisse.guncelFiyat) > 0 && (
                            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.primary, marginTop: 2 }}>
                              Bütçenle ~{Math.floor(netKalan / Number(hisse.guncelFiyat))} adet alabilirsin
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.takipItemRight}>
                        <Text style={styles.takipFiyat}>
                          ₺{Number(hisse.guncelFiyat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <View style={[styles.takipBadge, { backgroundColor: (hisse.degisimYuzde || 0) >= 0 ? colors.success + '20' : colors.error + '20' }]}>
                          <Text style={[styles.takipBadgeText, { color: (hisse.degisimYuzde || 0) >= 0 ? colors.success : colors.error }]}>
                            {(hisse.degisimYuzde || 0) >= 0 ? '+' : ''}{(hisse.degisimYuzde || 0).toFixed(2)}%
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {takipListesi.kriptoTakipler.slice(0, 3).map((kripto, index) => (
                    <View
                      key={`kripto-${kripto.id || index}`}
                      style={[
                        styles.takipItemRow,
                        index === Math.min(takipListesi.kriptoTakipler.length, 3) - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={styles.takipItemLeft}>
                        {(kripto.icon || kripto.ikon) ? (
                          <Image source={{ uri: kripto.icon || kripto.ikon }} style={styles.takipImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.takipIconPlaceholder}>
                            <Text style={styles.takipIconPlaceholderText}>₿</Text>
                          </View>
                        )}
                        <View style={styles.takipInfo}>
                          <Text style={styles.takipSembol}>{kripto.sembol ? kripto.sembol.toUpperCase() : ''}</Text>
                          <Text style={styles.takipAd} numberOfLines={1}>{kripto.ad || 'Kripto'}</Text>
                          {netKalan > 0 && Number(kripto.usdFiyat || (kripto as any).guncelFiyat) > 0 && (
                            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.primary, marginTop: 2 }}>
                              Bütçenle ~{(netKalan / (Number(kripto.usdFiyat || (kripto as any).guncelFiyat) * 36)).toFixed(4)} {kripto.sembol ? kripto.sembol.toUpperCase() : 'adet'} alabilirsin
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.takipItemRight}>
                        <Text style={styles.takipFiyat}>
                          ${Number(kripto.usdFiyat || (kripto as any).guncelFiyat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <View style={[styles.takipBadge, { backgroundColor: (kripto.degisim24s || 0) >= 0 ? colors.success + '20' : colors.error + '20' }]}>
                          <Text style={[styles.takipBadgeText, { color: (kripto.degisim24s || 0) >= 0 ? colors.success : colors.error }]}>
                            {(kripto.degisim24s || 0) >= 0 ? '+' : ''}{(kripto.degisim24s || 0).toFixed(2)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Son İşlemler */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)}>
              <Card variant="outlined" style={styles.recentCard}>
                <View style={styles.recentHeader}>
                  <View style={styles.recentHeaderLeft}>
                    <Icon name="history" size={18} color={ICON_COLOR} />
                    <Text style={styles.recentTitle}>Son İşlemler</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Islemler')}>
                    <Text style={styles.recentSeeAll}>Tümü</Text>
                  </TouchableOpacity>
                </View>

                {sonIslemler.length > 0 ? (
                  sonIslemler.slice(0, 5).map((islem, index) => {
                    const iconInfo = getIslemIconInfo(islem.baslik, islem.tip, islem.kategori?.ikon, islem.kategori?.renk);
                    return (
                      <View
                        key={islem.id || index}
                        style={[
                          styles.recentItem,
                          index === Math.min(sonIslemler.length, 5) - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <View style={[
                          styles.recentIconWrap,
                          { backgroundColor: iconInfo.bg }
                        ]}>
                          <Icon
                            name={iconInfo.name}
                            size={16}
                            color={iconInfo.color}
                          />
                        </View>
                        <View style={styles.recentInfo}>
                          <Text style={styles.recentItemTitle} numberOfLines={1}>
                            {islem.baslik}
                          </Text>
                          <Text style={styles.recentItemCategory}>
                            {islem.kategori?.ad || 'Kategori'}
                          </Text>
                        </View>
                        <Text style={[
                          styles.recentAmount,
                          { color: islem.tip === 'GELIR' ? colors.success : colors.error }
                        ]}>
                          {islem.tip === 'GELIR' ? '+' : '-'}{formatCurrency(islem.miktar)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.recentEmpty}>
                    <Text style={styles.recentEmptyText}>Henüz işlem yok</Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Kategori Bütçe ve Harcama Hedefleri Kartı (Premium Tasarım) */}
            {kategoriler.filter(k => k.tip !== 'GELIR' && (k.aylikHedef || 0) > 0).length > 0 && (
              <Animated.View entering={FadeInDown.delay(260).duration(400)}>
                <Card variant="featured" style={{ marginVertical: spacing.md, padding: spacing.md, borderRadius: 24, backgroundColor: colors.surface }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="chartPie" size={20} color={colors.onPrimary} />
                      </View>
                      <View>
                        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.primary }}>Kategori Bütçeleri</Text>
                        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.onSurfaceVariant }}>Aylık harcama ve günlük limitleriniz</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Kategori')}
                      style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                    >
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.onPrimary }}>Yönet</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 14 }}>
                    {(butceDurumu?.kalemiDurumu || [])
                      .slice(0, 5)
                      .map((kalem: any, index: number) => {
                        const kat = kalem.kategori || {};
                        const harcanan = kalem.harcanan || 0;
                        const hedef = kalem.limitMiktar || 1;
                        const oran = Math.min(100, Math.round((harcanan / hedef) * 100));
                        const isOver = harcanan > hedef;
                        const kalanButce = Math.max(0, hedef - harcanan);
                        const gunlukLimit = Math.floor(kalanButce / Math.max(1, kalanGun));
                        const themeColor = isOver ? colors.error : '#10B981';

                        return (
                          <View key={kalem.id || kat.id || index} style={{ backgroundColor: colors.background, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.borderLight }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon name={(kat.ikon as any) || 'tag'} size={18} color={ICON_COLOR} />
                                </View>
                                <View>
                                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.onSurface }}>{kat.ad || 'Kategori'}</Text>
                                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: isOver ? colors.error : colors.onSurfaceVariant }}>
                                    ₺{harcanan.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} / ₺{hedef.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                  </Text>
                                </View>
                              </View>
                              <View style={{ backgroundColor: isOver ? colors.error + '15' : '#10B98115', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: themeColor }}>
                                  %{oran} {isOver ? '⚠️' : '🎯'}
                                </Text>
                              </View>
                            </View>

                            <View style={{ height: 8, backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                              <View
                                style={{
                                  height: '100%',
                                  width: `${oran}%`,
                                  backgroundColor: themeColor,
                                  borderRadius: 4
                                }}
                              />
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="wallet" size={14} color={ICON_COLOR} />
                                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: isOver ? colors.error : colors.primary }}>
                                  Günlük Bütçe: ₺{gunlukLimit.toLocaleString('tr-TR')}
                                </Text>
                              </View>
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.onSurfaceVariant }}>
                                Kalan: ₺{kalanButce.toLocaleString('tr-TR')} ({kalanGun} gün)
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Sabit İşlemler (Abonelikler / Sabit Gider ve Gelirler) */}
            {sabitIslemler.length > 0 && (
              <Animated.View entering={FadeInDown.delay(280).duration(400)}>
                <Card variant="outlined" style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <View style={styles.recentHeaderLeft}>
                      <Icon name="calendar" size={18} color={ICON_COLOR} />
                      <Text style={styles.recentTitle}>Sabit İşlemlerim</Text>
                    </View>
                  </View>

                  {sabitIslemler.map((islem, index) => {
                    const day = new Date(islem.tarih).getDate();
                    return (
                      <View
                        key={islem.id || `sabit-${index}`}
                        style={[
                          styles.recentItem,
                          index === sabitIslemler.length - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <View style={[
                          styles.recentIconWrap,
                          { backgroundColor: '#f5f5f5' }
                        ]}>
                          <Icon
                            name={islem.tip === 'GELIR' ? 'arrowUp' : 'arrowDown'}
                            size={16}
                            color={ICON_COLOR}
                          />
                        </View>
                        <View style={styles.recentInfo}>
                          <Text style={styles.recentItemTitle} numberOfLines={1}>
                            {islem.baslik}
                          </Text>
                          <Text style={styles.recentItemCategory}>
                            Her ayın {day}. günü
                          </Text>
                        </View>
                        <Text style={[
                          styles.recentAmount,
                          { color: islem.tip === 'GELIR' ? colors.success : colors.error }
                        ]}>
                          {islem.tip === 'GELIR' ? '+' : '-'}{formatCurrency(islem.miktar)}
                        </Text>
                      </View>
                    );
                  })}
                </Card>
              </Animated.View>
            )}

            {/* Hedef Özeti */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <Card variant="outlined" style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalHeaderLeft}>
                    <Icon name="bullseye" size={20} color={ICON_COLOR} />
                    <Text style={styles.goalTitle}>Hedeflerim</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Hedefler')}>
                    <Text style={styles.goalSeeAll}>Tümünü Gör</Text>
                  </TouchableOpacity>
                </View>

                {hedefler.length > 0 ? (
                  <>
                    <View style={styles.goalProgress}>
                      <View style={styles.goalProgressCircle}>
                        <Text style={styles.goalProgressPercent}>{hedefYuzdesi}%</Text>
                        <Text style={styles.goalProgressLabel}>Tamamlandı</Text>
                      </View>
                      <View style={styles.goalProgressInfo}>
                        <Text style={styles.goalProgressAmount}>
                          {formatCurrency(toplamMevcutMiktar)}
                        </Text>
                        <Text style={styles.goalProgressTarget}>
                          / {formatCurrency(toplamHedefMiktar)} hedef
                        </Text>
                        <Text style={styles.goalProgressRemaining}>
                          {formatCurrency(toplamHedefMiktar - toplamMevcutMiktar)} kaldı
                        </Text>
                      </View>
                    </View>

                    {hedefler.slice(0, 2).map((hedef, index) => {
                      const yuzde = hedef.hedefMiktar > 0
                        ? Math.round((hedef.mevcutMiktar / hedef.hedefMiktar) * 100)
                        : 0;
                      return (
                        <View key={hedef.id || index} style={styles.goalItem}>
                          <View style={styles.goalItemLeft}>
                            <Text style={styles.goalItemName}>{hedef.baslik}</Text>
                            <Text style={styles.goalItemAmount}>
                              {formatCurrency(hedef.mevcutMiktar)} / {formatCurrency(hedef.hedefMiktar)}
                            </Text>
                          </View>
                          <View style={styles.goalItemRight}>
                            <Text style={styles.goalItemPercent}>{yuzde}%</Text>
                            <ProgressBar
                              progress={yuzde}
                              height={4}
                              color={colors.secondary}
                              style={styles.goalItemProgress}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <View style={styles.goalEmpty}>
                    <Text style={styles.goalEmptyText}>Henüz hedef eklenmedi</Text>
                    <TouchableOpacity
                      style={styles.goalEmptyButton}
                      onPress={() => navigation.navigate('Hedefler')}
                    >
                      <Icon name="plus" size={14} color={ICON_COLOR} />
                      <Text style={styles.goalEmptyButtonText}>Hedef Ekle</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Hızlı Aksiyonlar */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('İşlem')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="arrowUp" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Gelir Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('İşlem')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="arrowDown" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Gider Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('Hedefler')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="bullseye" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Hedefe Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('Raporlar')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="chartPie" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Raporlar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('Islemler')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="history" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Geçmiş</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('HaritaOzeti')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="mapMarkerAlt" size={20} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.quickActionItemText}>Harita</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Sosyal Alan */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Sosyal</Text>
              <View style={styles.socialGrid}>
                <TouchableOpacity
                  style={styles.socialCard}
                  onPress={() => navigation.navigate('Mesajlar')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.socialIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="paperPlane" size={22} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.socialCardTitle}>Mesajlar</Text>
                  <Text style={styles.socialCardSubtitle}>Arkadaşlarla sohbet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialCard}
                  onPress={() => navigation.navigate('Arkadaslar')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.socialIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="users" size={22} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.socialCardTitle}>Arkadaşlar</Text>
                  <Text style={styles.socialCardSubtitle}>Arkadaş ekle</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.socialGrid, { marginTop: spacing.sm }]}>
                <TouchableOpacity
                  style={styles.socialCard}
                  onPress={() => navigation.navigate('Leaderboard')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.socialIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="trophy" size={22} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.socialCardTitle}>Sıralama</Text>
                  <Text style={styles.socialCardSubtitle}>Arkadaşlarla yarış</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialCard}
                  onPress={() => navigation.navigate('Rozetler')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.socialIcon, { backgroundColor: '#f5f5f5' }]}>
                    <Icon name="medal" size={22} color={ICON_COLOR} />
                  </View>
                  <Text style={styles.socialCardTitle}>Rozetler</Text>
                  <Text style={styles.socialCardSubtitle}>Başarılarını gör</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Akıllı Danışman Popup Modal */}
      <Modal
        visible={showAiModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg, maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="lightbulb" size={18} color={ICON_COLOR} />
                </View>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.primary }}>Finansal Tavsiyeler</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAiModal(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="close" size={16} color={ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
              {loadingAiOneri ? (
                <View style={{ paddingVertical: spacing.xl * 2, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' }}>
                    Finansal durumunuz ve piyasa verileri analiz ediliyor...
                  </Text>
                </View>
              ) : (
                <View style={{ gap: spacing.md }}>
                  <View style={{ backgroundColor: colors.primaryContainer + '20', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '30' }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.primary, marginBottom: 6 }}>
                      Özel Strateji Özeti
                    </Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.onSurface, lineHeight: 22 }}>
                      {aiYatirimOneri || "Bütçe ve piyasa verileriniz inceleniyor. Harcama disiplininizi sürdürerek tasarruflarınızı sepet portföyde değerlendirebilirsiniz."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={yenileAiOneri}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 16 }}
                  >
                    <Icon name="repeat" size={16} color={ICON_COLOR} />
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.primary }}>Tavsiyeleri Yenile</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAiModal(false)}
              style={{ marginTop: spacing.md, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 20, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFF' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.sm,
  },
  logo: {
    width: 100,
    height: 100,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  profileInitials: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  dashboardGamification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.containerMargin,
    marginTop: 0,
    marginBottom: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 16,
  },
  dashboardGamificationDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  streakDashboardBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  streakDashboardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDashboardText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FF6B35',
    lineHeight: 18,
  },
  streakDashboardLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    lineHeight: 12,
  },
  levelDashboardBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  levelDashboardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDashboardText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.primary,
    lineHeight: 18,
  },
  ligDashboardText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    lineHeight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onPrimary,
  },
  searchContainer: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  welcomeSection: {
    marginBottom: spacing.lg,
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  accountTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  accountTypeBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: colors.primary,
  },
  welcomeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  welcomeName: {
    fontFamily: 'Poppins_700Bold',
    color: colors.onSurface,
  },
  welcomeSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFECB3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#5D4037',
    lineHeight: 18,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  aiTextCol: {
    flex: 1,
  },
  aiTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 2,
  },
  aiSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 17,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  micIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onPrimary,
  },
  quickActionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.secondary,
  },
  budgetCard: {
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  budgetBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  budgetBadgeWarning: {
    backgroundColor: '#f5f5f5',
  },
  budgetBadgeError: {
    backgroundColor: '#f0f0f0',
  },
  budgetBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  budgetBadgeTextWarning: {
    color: '#1a1a1a',
  },
  budgetBadgeTextError: {
    color: colors.error,
  },
  budgetMain: {
    marginBottom: spacing.md,
  },
  budgetLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  budgetValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: colors.onSurface,
  },
  budgetValueNegative: {
    color: colors.error,
  },
  budgetProgress: {
    marginBottom: spacing.md,
  },
  budgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetFooterItem: {
    flex: 1,
  },
  budgetFooterDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  budgetFooterLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  budgetFooterValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  spendingCard: {
    marginBottom: spacing.md,
  },
  spendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  spendingTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    flex: 1,
  },
  kalanGunBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kalanGunText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.primary,
  },
  spendingGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  spendingItem: {
    flex: 1,
    alignItems: 'center',
  },
  spendingDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  spendingLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  spendingValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  spendingHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  spendingAverage: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  spendingAverageLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  spendingAverageValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.onSurface,
  },
  spendingWarning: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.error,
  },
  spendingSuccess: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.success,
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  goalSeeAll: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  goalProgressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalProgressPercent: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.onSurface,
  },
  goalProgressLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  goalProgressInfo: {
    flex: 1,
  },
  goalProgressAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
  },
  goalProgressTarget: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  goalProgressRemaining: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  goalItemLeft: {
    flex: 1,
  },
  goalItemName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  goalItemAmount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  goalItemRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  goalItemPercent: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  goalItemProgress: {
    width: '100%',
  },
  goalEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  goalEmptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  goalEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  goalEmptyButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  quickActions: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionItemText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
  },
  categoryCard: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.onSurface,
  },
  categoryPercent: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    minWidth: 32,
    textAlign: 'right',
  },
  recentCard: {
    marginBottom: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  recentSeeAll: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentItemTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  recentItemCategory: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  recentAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  recentEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recentEmptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  kediCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECEFF1',
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  kediCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kediIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  kediTextCol: {
    flex: 1,
  },
  kediTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  kediSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  socialSection: {
    marginTop: spacing.lg,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  socialCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.onSurface,
    marginBottom: 2,
  },
  socialCardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  yakinOdemelerCard: {
    marginBottom: spacing.md,
  },
  yakinOdemelerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  yakinOdemelerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    flex: 1,
  },
  yakinOdemelerCount: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  yakinOdemelerCountText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.error,
  },
  yakinOdemeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  yakinOdemeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  yakinOdemeInfo: {
    flex: 1,
  },
  yakinOdemeBaslik: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  yakinOdemeTarih: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  yakinOdemeRight: {
    alignItems: 'flex-end',
  },
  yakinOdemeMiktar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 2,
  },
  yakinOdemeDurum: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yakinOdemeDurumText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
  },
  yakinOdemelerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  yakinOdemelerButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  // Sabit Giderler Kartı
  fixedExpensesCard: {
    marginBottom: spacing.md,
    borderColor: colors.error + '30',
  },
  fixedExpensesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fixedExpensesTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    flex: 1,
  },
  fixedExpensesTotal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.error,
  },
  fixedExpensesList: {
    gap: spacing.sm,
  },
  fixedExpenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  fixedExpenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  fixedExpenseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fixedExpenseName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
  },
  fixedExpenseAmount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.error,
  },
  fixedExpensesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  fixedExpensesSummaryLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  fixedExpensesSummaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  fixedExpensesSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fixedExpensesSummarySeparator: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  // Budget subtext
  budgetSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  budgetEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  budgetEmptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  budgetEmptyHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  takipItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  takipItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  takipIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takipIconPlaceholderText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onPrimary,
  },
  takipImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  takipInfo: {
    flex: 1,
  },
  takipSembol: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  takipAd: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  takipItemRight: {
    alignItems: 'flex-end',
  },
  takipFiyat: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  takipBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  takipBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  mapGeographyCard: {
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mapIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  mapCardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  mapButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mapButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
  },
  mapCardContent: {
    marginTop: spacing.xs,
  },
  mapSummaryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
  },
  mapStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerLow || '#f7f7f7',
    padding: spacing.sm,
    borderRadius: 16,
  },
  mapStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mapStatLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  mapStatValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: colors.onSurface,
    marginTop: 2,
  },
  mapStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight || '#e0e0e0',
  },
  mapEmptyContent: {
    paddingVertical: spacing.sm,
  },
  mapEmptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  levelWidget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(26, 45, 77)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  levelWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelCircleSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  levelWidgetInfo: {
    gap: 2,
  },
  levelWidgetUnvan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  levelWidgetLig: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelWidgetRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelWidgetXP: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  levelProgressSmall: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  levelBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: spacing.sm,
    paddingRight: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  levelBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgb(26, 45, 77)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  levelBadgeInfo: {
    flex: 1,
  },
  levelBadgeUnvan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: ICON_COLOR,
  },
  levelBadgeXPRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadgeXP: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: ICON_COLOR_LIGHT,
  },
  levelBadgeProgress: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelBadgeProgressFill: {
    height: '100%',
    backgroundColor: 'rgb(26, 45, 77)',
    borderRadius: 2,
  },
});
