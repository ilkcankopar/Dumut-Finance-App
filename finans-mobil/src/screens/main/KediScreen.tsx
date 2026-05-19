import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme';
import { Icon } from '../../components';
import { IconName } from '../../components/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sprite sheet bilgileri - pixel-cat-sprites.png
// Bu sheet çok karmaşık, sadece REST animasyonunu kullanalım
// Toplam: 432x1696, her satır 16px yükseklik
const SPRITE = {
  sheetWidth: 432,
  sheetHeight: 1696,
  frameSize: 16,
  labelWidth: 152, // Sol taraftaki etiket + metin genişliği
  framesPerRow: 4,
};

type AnimationType = 'rest' | 'walk' | 'sleep' | 'eat' | 'meow' | 'yawn' | 'wash';

interface AnimationDef {
  row: number;
  frames: number;
  speed: number;
}

// Satır numaraları (her satır 16px)
const ANIMATIONS: Record<AnimationType, AnimationDef> = {
  rest: { row: 0, frames: 4, speed: 400 },      // İlk satır - rest down
  walk: { row: 5, frames: 4, speed: 150 },      // walk right
  sleep: { row: 17, frames: 4, speed: 600 },    // sleep 1
  eat: { row: 31, frames: 4, speed: 200 },      // eat down
  meow: { row: 43, frames: 4, speed: 250 },     // meow sit
  yawn: { row: 51, frames: 4, speed: 300 },     // yawn sit
  wash: { row: 57, frames: 4, speed: 250 },     // wash stand
};

interface KediDurumu {
  puan: number;
  seviye: number;
  mutluluk: number;
  tokluk: number;
  enerji: number;
  sonBesleme: number;
  aksesuarlar: string[];
  aktifAksesuar: string | null;
}

interface MarketItem {
  id: string;
  isim: string;
  fiyat: number;
  icon: IconName;
  kategori: 'yemek' | 'aksesuar' | 'ozel';
  etki?: { mutluluk?: number; tokluk?: number; enerji?: number };
  aciklama: string;
}

interface Props {
  navigation: any;
}

const MARKET_ITEMS: MarketItem[] = [
  { id: 'mama', isim: 'Kuru Mama', fiyat: 20, icon: 'utensils', kategori: 'yemek', etki: { tokluk: 20 }, aciklama: 'Gunluk beslenme' },
  { id: 'balik', isim: 'Taze Balik', fiyat: 40, icon: 'fish', kategori: 'yemek', etki: { tokluk: 35, mutluluk: 10 }, aciklama: 'Favorisi!' },
  { id: 'sut', isim: 'Sicak Sut', fiyat: 15, icon: 'coffee', kategori: 'yemek', etki: { tokluk: 15, enerji: 10 }, aciklama: 'Enerji verir' },
  { id: 'malt', isim: 'Kedi Malti', fiyat: 35, icon: 'seedling', kategori: 'yemek', etki: { tokluk: 10, mutluluk: 20, enerji: 15 }, aciklama: 'Saglikli' },
  { id: 'papyon', isim: 'Papyon', fiyat: 100, icon: 'ribbon', kategori: 'aksesuar', aciklama: 'Boyunda sik durur' },
  { id: 'sapka', isim: 'Kovboy Sapka', fiyat: 150, icon: 'hatWizard', kategori: 'aksesuar', aciklama: 'Kafasinda karizmatik' },
  { id: 'gozluk', isim: 'Pilot Gozluk', fiyat: 200, icon: 'glasses', kategori: 'aksesuar', aciklama: 'Cool gorunum' },
  { id: 'kolye', isim: 'Altin Kolye', fiyat: 300, icon: 'gem', kategori: 'aksesuar', aciklama: 'Parlak ve luks' },
  { id: 'tac', isim: 'Altin Tac', fiyat: 500, icon: 'crown', kategori: 'aksesuar', aciklama: 'Kral gibi' },
  { id: 'vitamin', isim: 'Vitamin', fiyat: 80, icon: 'capsules', kategori: 'ozel', etki: { mutluluk: 30, enerji: 30 }, aciklama: 'Tam destek' },
  { id: 'oyuncak', isim: 'Oyuncak', fiyat: 50, icon: 'gamepad', kategori: 'ozel', etki: { mutluluk: 25 }, aciklama: 'Eglenceli' },
];

const VARSAYILAN: KediDurumu = {
  puan: 5000,
  seviye: 1,
  mutluluk: 80,
  tokluk: 70,
  enerji: 90,
  sonBesleme: Date.now(),
  aksesuarlar: [],
  aktifAksesuar: null,
};

// Pixel Art Animasyonlu Kedi
const PixelCat = ({ 
  animation,
  size = 200,
}: { 
  animation: AnimationType;
  size?: number;
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const animDef = ANIMATIONS[animation];
  
  // Frame animasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % animDef.frames);
    }, animDef.speed);
    
    return () => clearInterval(interval);
  }, [animation, animDef.speed, animDef.frames]);
  
  // Animasyon değişince frame sıfırla
  useEffect(() => {
    setCurrentFrame(0);
  }, [animation]);
  
  // Scale faktörü - 16px'i size'a büyüt
  const scale = size / SPRITE.frameSize;
  
  // Frame pozisyonu (sprite sheet üzerinde)
  const frameX = SPRITE.labelWidth + (currentFrame * SPRITE.frameSize);
  const frameY = animDef.row * SPRITE.frameSize;
  
  return (
    <View style={[pixelStyles.container, { width: size, height: size }]}>
      <View style={[pixelStyles.frameWrapper, { width: size, height: size }]}>
        <Image
          source={require('../../../assets/pixel-cat-sprites.png')}
          style={{
            width: SPRITE.sheetWidth * scale,
            height: SPRITE.sheetHeight * scale,
            position: 'absolute',
            left: -frameX * scale,
            top: -frameY * scale,
          }}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
};

const pixelStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrapper: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});

export const KediScreen = ({ navigation }: Props) => {
  const [kedi, setKedi] = useState<KediDurumu>(VARSAYILAN);
  const [marketAcik, setMarketAcik] = useState(false);
  const [secilenKategori, setSecilenKategori] = useState<'yemek' | 'aksesuar' | 'ozel'>('yemek');
  const [animation, setAnimation] = useState<AnimationType>('rest');
  const isAnimatingRef = useRef(false);

  const veriYukle = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('dumut_data');
      let coinData = await AsyncStorage.getItem('kullanici_coin');
      
      const coinValue = coinData ? parseInt(coinData, 10) : 0;
      if (coinValue < 500 || !coinData) {
        await AsyncStorage.setItem('kullanici_coin', '5000');
        coinData = '5000';
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        const simdi = Date.now();
        const gecenSaat = (simdi - (parsed.sonBesleme || simdi)) / (1000 * 60 * 60);
        const newKedi = {
          ...VARSAYILAN,
          ...parsed,
          puan: parseInt(coinData, 10),
          tokluk: Math.round(Math.max(0, (parsed.tokluk || 70) - gecenSaat * 4)),
          mutluluk: Math.round(Math.max(0, (parsed.mutluluk || 80) - gecenSaat * 2)),
          enerji: Math.round(Math.max(0, (parsed.enerji || 90) - gecenSaat * 1)),
        };
        setKedi(newKedi);
        if (newKedi.enerji < 20) setAnimation('sleep');
      } else {
        setKedi({ ...VARSAYILAN, puan: 5000 });
        await AsyncStorage.setItem('kullanici_coin', '5000');
      }
    } catch (e) { console.log(e); }
  }, []);

  useEffect(() => { veriYukle(); }, [veriYukle]);

  // Enerji düşükse uyku
  useEffect(() => {
    if (!isAnimatingRef.current) {
      if (kedi.enerji < 20) {
        setAnimation('sleep');
      } else if (animation === 'sleep' && kedi.enerji >= 20) {
        setAnimation('rest');
      }
    }
  }, [kedi.enerji, animation]);

  const kediKaydet = async (yeniKedi: KediDurumu) => {
    setKedi(yeniKedi);
    await AsyncStorage.setItem('dumut_data', JSON.stringify(yeniKedi));
    await AsyncStorage.setItem('kullanici_coin', yeniKedi.puan.toString());
  };

  const sevdir = () => {
    if (isAnimatingRef.current || animation === 'sleep') return;
    isAnimatingRef.current = true;
    
    // Meow animasyonu
    setAnimation('meow');
    setTimeout(() => {
      setAnimation('wash'); // Yıkanma/mutlu
      setTimeout(() => {
        setAnimation('rest');
        isAnimatingRef.current = false;
      }, 1500);
    }, 1200);
    
    const yeniMutluluk = Math.min(100, kedi.mutluluk + 5);
    kediKaydet({ ...kedi, mutluluk: yeniMutluluk });
    Toast.show({ type: 'success', text1: 'Miyav!', text2: 'Dumut mutlu oldu' });
  };

  const itemSatinAl = async (item: MarketItem) => {
    if (kedi.puan < item.fiyat) {
      Toast.show({ type: 'error', text1: 'Yetersiz Puan!' });
      return;
    }
    if (item.kategori === 'aksesuar' && kedi.aksesuarlar.includes(item.id)) {
      kediKaydet({ ...kedi, aktifAksesuar: kedi.aktifAksesuar === item.id ? null : item.id });
      Toast.show({ type: 'success', text1: kedi.aktifAksesuar === item.id ? 'Cikarildi' : 'Takildi!' });
      return;
    }
    
    isAnimatingRef.current = true;
    let yeniKedi = { ...kedi, puan: kedi.puan - item.fiyat };
    
    if (item.kategori === 'aksesuar') {
      yeniKedi.aksesuarlar = [...yeniKedi.aksesuarlar, item.id];
      yeniKedi.aktifAksesuar = item.id;
      setAnimation('meow');
      setTimeout(() => {
        setAnimation('rest');
        isAnimatingRef.current = false;
      }, 1500);
      Toast.show({ type: 'success', text1: `${item.isim} alindi!` });
    } else {
      // Yemek yeme animasyonu
      setAnimation('eat');
      setTimeout(() => {
        setAnimation('yawn'); // Esneme (tok)
        setTimeout(() => {
          setAnimation('rest');
          isAnimatingRef.current = false;
        }, 1200);
      }, 1800);
      
      if (item.etki) {
        if (item.etki.mutluluk) yeniKedi.mutluluk = Math.min(100, yeniKedi.mutluluk + item.etki.mutluluk);
        if (item.etki.tokluk) yeniKedi.tokluk = Math.min(100, yeniKedi.tokluk + item.etki.tokluk);
        if (item.etki.enerji) yeniKedi.enerji = Math.min(100, yeniKedi.enerji + item.etki.enerji);
      }
      yeniKedi.sonBesleme = Date.now();
      Toast.show({ type: 'success', text1: 'Nam nam!', text2: 'Dumut yemeyi sevdi' });
    }
    await kediKaydet(yeniKedi);
  };

  const filteredItems = MARKET_ITEMS.filter(item => item.kategori === secilenKategori);
  const aktifItem = kedi.aktifAksesuar ? MARKET_ITEMS.find(i => i.id === kedi.aktifAksesuar) : null;

  const getStatusText = () => {
    switch (animation) {
      case 'sleep': return 'Zzz... Uyuyor';
      case 'eat': return 'Nam nam!';
      case 'meow': return 'Miyav!';
      case 'yawn': return 'Haahh... Tok!';
      case 'wash': return 'Temizleniyor...';
      case 'walk': return 'Geziyor...';
      default: return 'Dokun ve sev!';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevronLeft" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Dumut</Text>
          {aktifItem && (
            <View style={styles.aktivAksesuarBadge}>
              <Icon name={aktifItem.icon} size={12} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.coinBox}>
          <Icon name="star" size={16} color={colors.secondary} />
          <Text style={styles.coinText}>{kedi.puan}</Text>
        </View>
      </View>

      {/* Pixel Art Kedi */}
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={sevdir} 
        style={styles.catContainer}
      >
        <PixelCat animation={animation} size={180} />
        <Text style={styles.hint}>{getStatusText()}</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[
          { key: 'mutluluk', value: kedi.mutluluk, icon: 'heart' as IconName },
          { key: 'tokluk', value: kedi.tokluk, icon: 'utensils' as IconName },
          { key: 'enerji', value: kedi.enerji, icon: 'lightbulb' as IconName },
        ].map((stat) => (
          <View key={stat.key} style={styles.statRow}>
            <View style={styles.statIcon}>
              <Icon name={stat.icon} size={14} color={colors.primary} />
            </View>
            <View style={styles.statBarBg}>
              <View 
                style={[
                  styles.statBarFill, 
                  { 
                    width: `${stat.value}%`,
                    backgroundColor: stat.value < 30 ? '#E57373' : colors.secondary,
                  }
                ]} 
              />
            </View>
            <Text style={styles.statText}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Rozetler')} style={styles.sideBtn}>
          <Icon name="medal" size={22} color={colors.primary} />
          <Text style={styles.sideBtnText}>Rozet</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMarketAcik(true)} style={styles.marketBtn}>
          <Icon name="shoppingCart" size={24} color="#FFF" />
          <Text style={styles.marketBtnText}>Market</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.sideBtn}>
          <Icon name="trophy" size={22} color={colors.primary} />
          <Text style={styles.sideBtnText}>Sira</Text>
        </TouchableOpacity>
      </View>

      {/* Market Modal */}
      <Modal visible={marketAcik} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Market</Text>
              <View style={styles.modalCoin}>
                <Icon name="star" size={16} color={colors.secondary} />
                <Text style={styles.modalCoinText}>{kedi.puan}</Text>
              </View>
              <TouchableOpacity onPress={() => setMarketAcik(false)} style={styles.closeBtn}>
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
              {(['yemek', 'aksesuar', 'ozel'] as const).map((kat) => (
                <TouchableOpacity
                  key={kat}
                  onPress={() => setSecilenKategori(kat)}
                  style={[styles.tab, secilenKategori === kat && styles.tabActive]}
                >
                  <Text style={[styles.tabText, secilenKategori === kat && styles.tabTextActive]}>
                    {kat === 'yemek' ? 'Yemek' : kat === 'aksesuar' ? 'Aksesuar' : 'Ozel'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
              {filteredItems.map((item) => {
                const sahipMi = item.kategori === 'aksesuar' && kedi.aksesuarlar.includes(item.id);
                const aktifMi = kedi.aktifAksesuar === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => itemSatinAl(item)}
                    style={[styles.itemCard, aktifMi && styles.itemCardActive]}
                  >
                    <View style={[styles.itemIcon, aktifMi && styles.itemIconActive]}>
                      <Icon name={item.icon} size={22} color={aktifMi ? '#FFF' : colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.isim}</Text>
                      <Text style={styles.itemDesc}>{item.aciklama}</Text>
                    </View>
                    <Text style={[styles.priceText, kedi.puan < item.fiyat && !sahipMi && styles.priceInsufficient]}>
                      {sahipMi ? (aktifMi ? 'Aktif' : 'Tak') : item.fiyat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: colors.primary },
  aktivAksesuarBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  coinBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  coinText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.primary },
  catContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  hint: {
    position: 'absolute', bottom: 20,
    fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#888',
  },
  statsContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0',
  },
  statBarBg: { flex: 1, height: 10, backgroundColor: '#E8E8E8', borderRadius: 5, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 5 },
  statText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.primary, width: 30, textAlign: 'right' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  sideBtn: { alignItems: 'center', gap: 4 },
  sideBtnText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.primary },
  marketBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 22,
  },
  marketBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(13,30,61,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 20 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.primary },
  modalCoin: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FAF8F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  modalCoinText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.primary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#F0F0F0',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.primary },
  tabTextActive: { color: '#FFF' },
  itemsScroll: { paddingHorizontal: 16 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
  },
  itemCardActive: { borderColor: colors.primary, backgroundColor: '#FAF8F5' },
  itemIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  itemIconActive: { backgroundColor: colors.primary },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.primary },
  itemDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#888', marginTop: 2 },
  priceText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.primary },
  priceInsufficient: { color: '#999' },
});
