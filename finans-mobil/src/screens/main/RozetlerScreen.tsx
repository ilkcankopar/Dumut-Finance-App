import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon, ProgressBar } from '../../components';
import { IconName } from '../../components/Icon';
import { levelApi, LevelDurum } from '../../api/level';
import { rozetApi, Rozet as ApiRozet, RozetlerResponse } from '../../api/rozet';

interface Rozet {
  id: string;
  isim: string;
  aciklama: string;
  icon: IconName;
  renk: string;
  kazanildi: boolean;
}

interface Props {
  navigation: any;
}

const LIGLER = [
  { isim: 'Bronz', minLevel: 1, maxLevel: 20, renk: '#CD7F32', icon: 'medal' as IconName },
  { isim: 'Gümüş', minLevel: 21, maxLevel: 40, renk: '#C0C0C0', icon: 'medal' as IconName },
  { isim: 'Altın', minLevel: 41, maxLevel: 60, renk: '#FFD700', icon: 'trophy' as IconName },
  { isim: 'Elmas', minLevel: 61, maxLevel: 80, renk: '#00CED1', icon: 'trophy' as IconName },
  { isim: 'Şampiyon', minLevel: 81, maxLevel: 100, renk: '#9C27B0', icon: 'trophy' as IconName },
];

const ikonMap: Record<string, IconName> = {
  'piggyBank': 'piggyBank',
  'moneyBillWave': 'moneyBillWave',
  'university': 'university',
  'bullseye': 'bullseye',
  'checkCircle': 'checkCircle',
  'trophy': 'trophy',
  'receipt': 'receipt',
  'chartLine': 'chartLine',
  'chartPie': 'chartPie',
  'users': 'users',
  'heart': 'heart',
  'medal': 'medal',
  'calendar': 'calendar',
  'shield': 'shield',
  'paw': 'paw',
  'star': 'star',
  'crown': 'crown',
  'microphone': 'microphone',
  'lock': 'lock',
};

export const RozetlerScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [levelDurum, setLevelDurum] = useState<LevelDurum | null>(null);
  const [rozetData, setRozetData] = useState<RozetlerResponse | null>(null);
  const [secilenRozet, setSecilenRozet] = useState<ApiRozet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [animValue] = useState(new Animated.Value(0));

  const veriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      // Paralel yükle, hatada null dön
      const [levelRes, rozetRes] = await Promise.all([
        levelApi.durumGetir().catch(e => { console.log('Level hatası:', e); return null; }),
        rozetApi.kullaniciRozetleriGetir().catch(e => { console.log('Rozet hatası:', e); return null; }),
      ]);
      
      if (levelRes) setLevelDurum(levelRes);
      if (rozetRes) setRozetData(rozetRes);
      
      if (!levelRes && !rozetRes) {
        Toast.show({
          type: 'error',
          text1: 'Bağlantı Hatası',
          text2: 'Sunucuya bağlanılamadı',
        });
      }
    } catch (error: any) {
      console.log('Veri yukleme hatasi:', error?.message || error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error?.message || 'Veriler yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    veriYukle();
  }, [veriYukle]);

  const rozetKontrol = async () => {
    try {
      const sonuc = await rozetApi.rozetKontrolEt();
      if (sonuc.kazanilanSayisi > 0) {
        Toast.show({
          type: 'success',
          text1: 'Yeni Rozet!',
          text2: `${sonuc.kazanilanSayisi} yeni rozet kazandın!`,
        });
        veriYukle();
      } else {
        Toast.show({
          type: 'info',
          text1: 'Rozet Kontrolü',
          text2: 'Henüz yeni rozet kazanmadın',
        });
      }
    } catch (error) {
      console.log('Rozet kontrol hatasi:', error);
    }
  };

  const getIconName = (ikon: string): IconName => {
    return ikonMap[ikon] || 'star';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevronLeft" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rozetler & Level</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.onSurfaceVariant }}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!levelDurum || !rozetData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevronLeft" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rozetler & Level</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Icon name="times" size={48} color={colors.error} />
          <Text style={{ marginTop: 10, color: colors.onSurfaceVariant, textAlign: 'center' }}>
            Veriler yüklenemedi{'\n'}Sunucu bağlantısını kontrol edin
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
            onPress={veriYukle}
          >
            <Text style={{ color: colors.onPrimary, fontFamily: 'Poppins_500Medium' }}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mevcutLig = LIGLER.find(l => levelDurum.level >= l.minLevel && levelDurum.level <= l.maxLevel) || LIGLER[0];
  const levelIlerlemesi = levelDurum.ilerlemeYuzdesi;

  const kazanilanSayisi = rozetData.kazanilanSayisi;
  const toplamRozet = rozetData.toplam;
  const tumRozetler = [...rozetData.kazanilan, ...rozetData.kazanilmayan];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rozetler & Level</Text>
        <TouchableOpacity 
          style={styles.coinBadge}
          onPress={rozetKontrol}
        >
          <Icon name="refresh" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Level Karti */}
        <Card variant="outlined" style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.ligBadge}>
              <Icon name={mevcutLig.icon} size={24} color="#fff" />
              <Text style={styles.ligIsim}>{mevcutLig.isim} Lig</Text>
            </View>
            <View style={styles.unvanBadge}>
              <Text style={styles.unvanText}>{levelDurum.unvan}</Text>
            </View>
          </View>

          <View style={styles.levelContent}>
            <View style={styles.levelCircle}>
              <Text style={styles.levelNumber}>{levelDurum.level}</Text>
              <Text style={styles.levelLabel}>Level</Text>
            </View>
            
            <View style={styles.levelInfo}>
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>Tecrübe</Text>
                <Text style={styles.xpValue}>{levelDurum.toplamXP.toLocaleString()} XP</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(levelIlerlemesi, 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.sonrakiLevel}>
                {levelDurum.level < 100 ? `Sonraki level: ${levelDurum.sonrakiLevelXP.toLocaleString()} XP` : 'Maksimum level!'}
              </Text>
            </View>
          </View>

          {/* Lig Gosterimi */}
          <View style={styles.liglerContainer}>
            {LIGLER.map((lig, index) => {
              const aktif = lig.isim === mevcutLig.isim;
              const gecildi = levelDurum.level > lig.maxLevel;
              return (
                <View 
                  key={lig.isim} 
                  style={[
                    styles.ligItem,
                    aktif && styles.ligItemActive,
                    gecildi && styles.ligItemPassed,
                  ]}
                >
                  <Icon 
                    name={lig.icon} 
                    size={16} 
                    color="#fff"
                  />
                  <Text style={[
                    styles.ligItemText,
                    aktif && { fontFamily: 'Poppins_600SemiBold' },
                  ]}>
                    {lig.isim}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Ozet Karti */}
        <Card variant="outlined" style={styles.ozetCard}>
          <View style={styles.ozetItem}>
            <Text style={styles.ozetDeger}>{kazanilanSayisi}</Text>
            <Text style={styles.ozetLabel}>Kazanilan</Text>
          </View>
          <View style={styles.ozetDivider} />
          <View style={styles.ozetItem}>
            <Text style={styles.ozetDeger}>{toplamRozet - kazanilanSayisi}</Text>
            <Text style={styles.ozetLabel}>Kalan</Text>
          </View>
          <View style={styles.ozetDivider} />
          <View style={styles.ozetItem}>
            <Text style={styles.ozetDeger}>{Math.round((kazanilanSayisi / toplamRozet) * 100)}%</Text>
            <Text style={styles.ozetLabel}>Tamamlandi</Text>
          </View>
        </Card>

        {/* Rozet Listesi */}
        <Text style={styles.sectionTitle}>Kazanılan Rozetler ({rozetData.kazanilan.length})</Text>
        <View style={styles.rozetlerGrid}>
          {rozetData.kazanilan.map(rozet => (
            <TouchableOpacity
              key={rozet.id}
              style={[styles.rozetCard, styles.rozetCardEarned]}
              onPress={() => {
                setSecilenRozet(rozet);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.rozetIcon, { backgroundColor: rozet.renk + '20' }]}>
                <Icon 
                  name={getIconName(rozet.ikon)} 
                  size={28} 
                  color={rozet.renk} 
                />
              </View>
              <Text style={styles.rozetIsim}>{rozet.ad}</Text>
              <View style={styles.kazanildiBadge}>
                <Icon name="check" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {rozetData.kazanilmayan.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Kilitli Rozetler ({rozetData.kazanilmayan.length})</Text>
            <View style={styles.rozetlerGrid}>
              {rozetData.kazanilmayan.map(rozet => (
                <TouchableOpacity
                  key={rozet.id}
                  style={styles.rozetCard}
                  onPress={() => {
                    setSecilenRozet(rozet);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rozetIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Icon 
                      name={getIconName(rozet.ikon)} 
                      size={28} 
                      color={colors.onSurfaceVariant} 
                    />
                  </View>
                  <Text style={[styles.rozetIsim, styles.rozetIsimLocked]}>{rozet.ad}</Text>
                  <View style={styles.xpGerekli}>
                    <Icon name="lock" size={10} color={colors.onSurfaceVariant} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Liderlik Linki */}
        <TouchableOpacity 
          style={styles.kediLink}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <View style={styles.kediLinkIcon}>
            <Icon name="trophy" size={24} color={colors.primary} />
          </View>
          <View style={styles.kediLinkText}>
            <Text style={styles.kediLinkTitle}>Sıralamayı Gör</Text>
            <Text style={styles.kediLinkSubtitle}>Arkadaşlarınla yarış!</Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Rozet Detay Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          {secilenRozet && (
            <View style={styles.modalContent}>
              <View style={[styles.modalIcon, { backgroundColor: secilenRozet.renk + '20' }]}>
                <Icon name={getIconName(secilenRozet.ikon)} size={48} color={secilenRozet.renk} />
              </View>
              <Text style={styles.modalTitle}>{secilenRozet.ad}</Text>
              <Text style={styles.modalDesc}>{secilenRozet.aciklama}</Text>
              
              {secilenRozet.durum === 'kazanildi' ? (
                <View style={styles.kazanildiLabel}>
                  <Icon name="checkCircle" size={20} color={colors.success} />
                  <Text style={styles.kazanildiText}>Kazanıldı!</Text>
                </View>
              ) : (
                <View style={styles.kilitliLabel}>
                  <Icon name="lock" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.kilitliText}>Koşulu tamamlayınca kazanılır</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  coinText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FF8F00',
  },
  scrollView: {
    flex: 1,
    padding: spacing.containerMargin,
  },
  levelCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: 'rgb(26, 45, 77)',
    borderColor: 'rgb(26, 45, 77)',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ligBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ligIsim: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  unvanBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  unvanText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  levelCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  levelLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelInfo: {
    flex: 1,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  xpLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  xpValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  progressBarContainer: {
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  sonrakiLevel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  liglerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  ligItem: {
    alignItems: 'center',
    opacity: 0.4,
  },
  ligItemActive: {
    opacity: 1,
  },
  ligItemPassed: {
    opacity: 0.7,
  },
  ligItemText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
  ozetCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ozetItem: {
    flex: 1,
    alignItems: 'center',
  },
  ozetDeger: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.primary,
  },
  ozetLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  ozetDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  kategoriScroll: {
    marginBottom: spacing.md,
  },
  kategoriContent: {
    gap: spacing.sm,
  },
  kategoriBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
  },
  kategoriBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kategoriText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  kategoriTextActive: {
    color: colors.onPrimary,
  },
  rozetlerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rozetCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  rozetCardEarned: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
  },
  rozetCardUnlockable: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  rozetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  rozetIsim: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  rozetIsimLocked: {
    color: colors.onSurfaceVariant,
  },
  rozetOdul: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rozetOdulText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FF8F00',
  },
  kazanildiBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 2,
  },
  xpGerekli: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  xpGerekliText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
    color: colors.onSurfaceVariant,
  },
  kediLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  kediLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  kediLinkText: {
    flex: 1,
  },
  kediLinkTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  kediLinkSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.containerMargin,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  modalDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInfo: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: spacing.lg,
  },
  modalInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  modalOdul: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalOdulText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#FF8F00',
  },
  kazanildiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kazanildiText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.success,
  },
  talepBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  talepBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onPrimary,
  },
  kilitliLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kilitliText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
});
