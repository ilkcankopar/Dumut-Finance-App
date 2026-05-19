import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Card, Icon } from '../../components';
import { IconName } from '../../components/Icon';
import { levelApi, SiralamaKullanici, LevelDurum, KullaniciProfil } from '../../api/level';

const ICON_COLOR = '#1a1a1a';
const ICON_COLOR_LIGHT = '#666';

interface Oyuncu {
  id: string;
  isim: string;
  avatar: string;
  level: number;
  xp: number;
  lig: string;
  sira?: number;
  arkadas?: boolean;
  sen?: boolean;
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

const siralamaToOyuncu = (k: SiralamaKullanici): Oyuncu => ({
  id: k.id,
  isim: `${k.ad} ${k.soyad}`,
  avatar: `${k.ad[0]}${k.soyad[0]}`,
  level: k.level,
  xp: k.toplamXP,
  lig: k.lig,
  sira: k.sira,
  arkadas: k.arkadas,
  sen: k.benMi,
});

export const LeaderboardScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secilenTab, setSecilenTab] = useState<'global' | 'arkadaslar' | 'lig'>('global');
  const [secilenLig, setSecilenLig] = useState<string | null>(null);
  const [kullaniciBilgi, setKullaniciBilgi] = useState<LevelDurum | null>(null);
  const [oyuncular, setOyuncular] = useState<Oyuncu[]>([]);
  const [benimSiram, setBenimSiram] = useState(0);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [secilenProfil, setSecilenProfil] = useState<KullaniciProfil | null>(null);
  const [profilYukleniyor, setProfilYukleniyor] = useState(false);

  const kullaniciProfilAc = async (kullaniciId: string) => {
    setProfilYukleniyor(true);
    setModalVisible(true);
    try {
      const profil = await levelApi.kullaniciProfil(kullaniciId);
      setSecilenProfil(profil);
    } catch (error) {
      console.log('Profil yüklenemedi:', error);
    } finally {
      setProfilYukleniyor(false);
    }
  };

  const modalKapat = () => {
    setModalVisible(false);
    setSecilenProfil(null);
  };

  const veriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      // Kullanıcı bilgisi ve global sıralama paralel yükle
      const [durum, globalData] = await Promise.all([
        levelApi.durumGetir(),
        levelApi.globalSiralama(1, 50),
      ]);

      setKullaniciBilgi(durum);
      setSecilenLig(durum.lig);
      setBenimSiram(globalData.benimSiram);
      
      const oyuncuListesi = globalData.kullanicilar.map(siralamaToOyuncu);
      setOyuncular(oyuncuListesi);
    } catch (error) {
      console.log('Veri yukleme hatasi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const tabDegistir = useCallback(async (tab: 'global' | 'arkadaslar' | 'lig') => {
    setSecilenTab(tab);
    setLoading(true);
    
    try {
      if (tab === 'global') {
        const data = await levelApi.globalSiralama(1, 50);
        setBenimSiram(data.benimSiram);
        setOyuncular(data.kullanicilar.map(siralamaToOyuncu));
      } else if (tab === 'arkadaslar') {
        const data = await levelApi.arkadasSiralama();
        setOyuncular(data.map(siralamaToOyuncu));
      } else if (tab === 'lig') {
        const data = await levelApi.ligSiralama(secilenLig || undefined);
        setOyuncular(data.kullanicilar.map(siralamaToOyuncu));
      }
    } catch (error) {
      console.log('Tab degistirme hatasi:', error);
    } finally {
      setLoading(false);
    }
  }, [secilenLig]);

  const ligDegistir = useCallback(async (lig: string) => {
    setSecilenLig(lig);
    setLoading(true);
    
    try {
      const data = await levelApi.ligSiralama(lig);
      setOyuncular(data.kullanicilar.map(siralamaToOyuncu));
    } catch (error) {
      console.log('Lig degistirme hatasi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    veriYukle();
  }, [veriYukle]);

  const onRefresh = async () => {
    setRefreshing(true);
    await tabDegistir(secilenTab);
    setRefreshing(false);
  };

  const getLigBilgisi = (ligIsim: string) => {
    return LIGLER.find(l => l.isim === ligIsim) || LIGLER[0];
  };

  const getRankIcon = (sira: number): { icon: IconName; color: string } | null => {
    if (sira === 1) return { icon: 'trophy', color: '#FFD700' };
    if (sira === 2) return { icon: 'medal', color: '#C0C0C0' };
    if (sira === 3) return { icon: 'medal', color: '#CD7F32' };
    return null;
  };

  const kullaniciSira = benimSiram;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevronLeft" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sıralama</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sıralama</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Kullanici Ozet Karti */}
      {kullaniciBilgi && (
        <View style={styles.kullaniciKart}>
          <View style={styles.kullaniciSol}>
            <View style={styles.kullaniciAvatar}>
              <Text style={styles.avatarText}>{kullaniciBilgi.ad[0]}{kullaniciBilgi.soyad[0]}</Text>
            </View>
            <View>
              <Text style={styles.kullaniciIsim}>Senin Sıran</Text>
              <View style={styles.kullaniciLig}>
                <Icon 
                  name={getLigBilgisi(kullaniciBilgi.lig).icon} 
                  size={14} 
                  color="#fff"
                />
                <Text style={styles.kullaniciLigText}>
                  {kullaniciBilgi.lig} Lig
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.kullaniciSag}>
            <Text style={styles.kullaniciSiraText}>#{kullaniciSira}</Text>
            <Text style={styles.kullaniciLevel}>Level {kullaniciBilgi.level}</Text>
          </View>
        </View>
      )}

      {/* Tab Secici */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, secilenTab === 'global' && styles.tabActive]}
          onPress={() => tabDegistir('global')}
        >
          <Icon name="users" size={16} color={secilenTab === 'global' ? colors.onPrimary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, secilenTab === 'global' && styles.tabTextActive]}>Global</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, secilenTab === 'arkadaslar' && styles.tabActive]}
          onPress={() => tabDegistir('arkadaslar')}
        >
          <Icon name="heart" size={16} color={secilenTab === 'arkadaslar' ? colors.onPrimary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, secilenTab === 'arkadaslar' && styles.tabTextActive]}>Arkadaşlar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, secilenTab === 'lig' && styles.tabActive]}
          onPress={() => tabDegistir('lig')}
        >
          <Icon name="trophy" size={16} color={secilenTab === 'lig' ? colors.onPrimary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, secilenTab === 'lig' && styles.tabTextActive]}>Ligim</Text>
        </TouchableOpacity>
      </View>

      {/* Lig Secici (sadece Lig tabında) */}
      {secilenTab === 'lig' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.ligScroll}
          contentContainerStyle={styles.ligScrollContent}
        >
          {LIGLER.map(lig => (
            <TouchableOpacity
              key={lig.isim}
              style={[
                styles.ligBtn,
                secilenLig === lig.isim && styles.ligBtnActive,
                secilenLig === lig.isim && { borderColor: lig.renk },
              ]}
              onPress={() => ligDegistir(lig.isim)}
            >
              <Icon name={lig.icon} size={16} color={secilenLig === lig.isim ? lig.renk : colors.onSurfaceVariant} />
              <Text style={[
                styles.ligBtnText,
                secilenLig === lig.isim && { color: lig.renk },
              ]}>
                {lig.isim}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Siralama Listesi */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top 3 Podium */}
        {secilenTab === 'global' && oyuncular.length >= 3 && (
          <View style={styles.podium}>
            {/* 2. Sira */}
            <View style={styles.podiumItem}>
              {oyuncular[1] && (
                <>
                  <View style={[styles.podiumAvatar, styles.podiumAvatar2]}>
                    <Text style={styles.podiumAvatarText}>{oyuncular[1].avatar}</Text>
                  </View>
                  <Text style={styles.podiumIsim} numberOfLines={1}>
                    {oyuncular[1].isim}
                  </Text>
                  <View style={styles.podiumXP}>
                    <Text style={styles.podiumXPText}>{oyuncular[1].xp.toLocaleString()} XP</Text>
                  </View>
                  <View style={[styles.podiumStand, styles.podiumStand2]}>
                    <Icon name="medal" size={20} color="#C0C0C0" />
                    <Text style={styles.podiumRank}>2</Text>
                  </View>
                </>
              )}
            </View>

            {/* 1. Sira */}
            <View style={styles.podiumItem}>
              {oyuncular[0] && (
                <>
                  <View style={[styles.podiumAvatar, styles.podiumAvatar1]}>
                    <Text style={styles.podiumAvatarText}>{oyuncular[0].avatar}</Text>
                  </View>
                  <Text style={styles.podiumIsim} numberOfLines={1}>
                    {oyuncular[0].isim}
                  </Text>
                  <View style={styles.podiumXP}>
                    <Text style={styles.podiumXPText}>{oyuncular[0].xp.toLocaleString()} XP</Text>
                  </View>
                  <View style={[styles.podiumStand, styles.podiumStand1]}>
                    <Icon name="trophy" size={24} color="#FFD700" />
                    <Text style={styles.podiumRank}>1</Text>
                  </View>
                </>
              )}
            </View>

            {/* 3. Sira */}
            <View style={styles.podiumItem}>
              {oyuncular[2] && (
                <>
                  <View style={[styles.podiumAvatar, styles.podiumAvatar3]}>
                    <Text style={styles.podiumAvatarText}>{oyuncular[2].avatar}</Text>
                  </View>
                  <Text style={styles.podiumIsim} numberOfLines={1}>
                    {oyuncular[2].isim}
                  </Text>
                  <View style={styles.podiumXP}>
                    <Text style={styles.podiumXPText}>{oyuncular[2].xp.toLocaleString()} XP</Text>
                  </View>
                  <View style={[styles.podiumStand, styles.podiumStand3]}>
                    <Icon name="medal" size={18} color="#CD7F32" />
                    <Text style={styles.podiumRank}>3</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Liste */}
        <View style={styles.liste}>
          {oyuncular.slice(secilenTab === 'global' ? 3 : 0).map((oyuncu) => {
            const ligBilgi = getLigBilgisi(oyuncu.lig);
            const rankIcon = getRankIcon(oyuncu.sira || 0);
            
            return (
              <TouchableOpacity 
                key={oyuncu.id} 
                style={[
                  styles.listeItem,
                  oyuncu.sen && styles.listeItemSen,
                ]}
                onPress={() => kullaniciProfilAc(oyuncu.id)}
                activeOpacity={0.7}
              >
                {/* Sira */}
                <View style={styles.siraContainer}>
                  {rankIcon ? (
                    <Icon name={rankIcon.icon} size={20} color={oyuncu.sen ? '#fff' : rankIcon.color} />
                  ) : (
                    <Text style={[styles.siraText, oyuncu.sen && { color: '#fff' }]}>#{oyuncu.sira}</Text>
                  )}
                </View>

                {/* Avatar */}
                <View style={[styles.listeAvatar, oyuncu.sen && styles.listeAvatarSen]}>
                  <Text style={[styles.listeAvatarText, oyuncu.sen && { color: '#fff' }]}>{oyuncu.avatar}</Text>
                </View>

                {/* Bilgi */}
                <View style={styles.listeBilgi}>
                  <View style={styles.listeIsimRow}>
                    <Text style={[styles.listeIsim, oyuncu.sen && styles.listeIsimSen]}>
                      {oyuncu.sen ? 'Sen' : oyuncu.isim}
                    </Text>
                    {oyuncu.arkadas && !oyuncu.sen && (
                      <Icon name="heart" size={12} color={colors.error} />
                    )}
                  </View>
                  <View style={styles.listeMeta}>
                    <Icon name={ligBilgi.icon} size={12} color={oyuncu.sen ? '#fff' : ligBilgi.renk} />
                    <Text style={[styles.listeLevel, { color: oyuncu.sen ? 'rgba(255,255,255,0.8)' : ligBilgi.renk }]}>
                      Level {oyuncu.level}
                    </Text>
                  </View>
                </View>

                {/* XP */}
                <View style={styles.listeXP}>
                  <Text style={[styles.listeXPText, oyuncu.sen && { color: '#fff' }]}>{oyuncu.xp.toLocaleString()}</Text>
                  <Text style={[styles.listeXPLabel, oyuncu.sen && { color: 'rgba(255,255,255,0.7)' }]}>XP</Text>
                </View>
                
                <Icon name="chevronRight" size={14} color={oyuncu.sen ? 'rgba(255,255,255,0.5)' : ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            );
          })}
        </View>

        {oyuncular.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={ICON_COLOR_LIGHT} />
            <Text style={styles.emptyText}>Bu kategoride kimse yok</Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Profil Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={modalKapat}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={modalKapat}>
              <Icon name="times" size={20} color={ICON_COLOR} />
            </TouchableOpacity>

            {profilYukleniyor ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={ICON_COLOR} />
                <Text style={styles.modalLoadingText}>Profil yükleniyor...</Text>
              </View>
            ) : secilenProfil ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profil Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{secilenProfil.avatar}</Text>
                  </View>
                  <Text style={styles.modalName}>{secilenProfil.ad} {secilenProfil.soyad}</Text>
                  <View style={styles.modalBadges}>
                    <View style={styles.modalBadge}>
                      <Icon name="trophy" size={14} color={ICON_COLOR} />
                      <Text style={styles.modalBadgeText}>#{secilenProfil.globalSira}</Text>
                    </View>
                    <View style={styles.modalBadge}>
                      <Icon name="medal" size={14} color={ICON_COLOR} />
                      <Text style={styles.modalBadgeText}>{secilenProfil.lig}</Text>
                    </View>
                  </View>
                </View>

                {/* Level Info */}
                <View style={styles.modalLevelCard}>
                  <View style={styles.modalLevelCircle}>
                    <Text style={styles.modalLevelNumber}>{secilenProfil.level}</Text>
                    <Text style={styles.modalLevelLabel}>Level</Text>
                  </View>
                  <View style={styles.modalLevelInfo}>
                    <Text style={styles.modalUnvan}>{secilenProfil.unvan}</Text>
                    <Text style={styles.modalXP}>{secilenProfil.toplamXP.toLocaleString()} XP</Text>
                  </View>
                </View>

                {/* İstatistikler */}
                <Text style={styles.modalSectionTitle}>İstatistikler</Text>
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Icon name="receipt" size={18} color={ICON_COLOR} />
                    <Text style={styles.modalStatValue}>{secilenProfil.istatistikler.toplamIslem}</Text>
                    <Text style={styles.modalStatLabel}>İşlem</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Icon name="bullseye" size={18} color={ICON_COLOR} />
                    <Text style={styles.modalStatValue}>{secilenProfil.istatistikler.tamamlananHedef}/{secilenProfil.istatistikler.toplamHedef}</Text>
                    <Text style={styles.modalStatLabel}>Hedef</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Icon name="medal" size={18} color={ICON_COLOR} />
                    <Text style={styles.modalStatValue}>{secilenProfil.istatistikler.toplamRozet}</Text>
                    <Text style={styles.modalStatLabel}>Rozet</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Icon name="users" size={18} color={ICON_COLOR} />
                    <Text style={styles.modalStatValue}>{secilenProfil.istatistikler.toplamArkadas}</Text>
                    <Text style={styles.modalStatLabel}>Arkadaş</Text>
                  </View>
                </View>

                {/* Rozetler */}
                {secilenProfil.sonRozetler.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Son Rozetler</Text>
                    <View style={styles.modalRozetler}>
                      {secilenProfil.sonRozetler.map(rozet => (
                        <View key={rozet.id} style={[styles.modalRozet, { borderColor: rozet.renk }]}>
                          <Text style={styles.modalRozetAd}>{rozet.ad}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Üyelik */}
                <View style={styles.modalFooter}>
                  <Icon name="calendar" size={14} color={ICON_COLOR_LIGHT} />
                  <Text style={styles.modalFooterText}>{secilenProfil.istatistikler.uyeGunSayisi} gündür üye</Text>
                </View>
              </ScrollView>
            ) : null}
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
  kullaniciKart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: spacing.containerMargin,
    padding: spacing.md,
    backgroundColor: 'rgb(26, 45, 77)',
    borderRadius: 12,
  },
  kullaniciSol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  kullaniciAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  kullaniciIsim: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  kullaniciLig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kullaniciLigText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  kullaniciSag: {
    alignItems: 'flex-end',
  },
  kullaniciSiraText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  kullaniciLevel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  ligScroll: {
    marginBottom: spacing.sm,
  },
  ligScrollContent: {
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.sm,
  },
  ligBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    gap: 6,
  },
  ligBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
  },
  ligBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
  },
  podiumAvatar: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  podiumAvatar1: {
    width: 60,
    height: 60,
    backgroundColor: '#FFD700',
  },
  podiumAvatar2: {
    width: 50,
    height: 50,
    backgroundColor: '#C0C0C0',
  },
  podiumAvatar3: {
    width: 45,
    height: 45,
    backgroundColor: '#CD7F32',
  },
  podiumAvatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
  podiumIsim: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurface,
    marginBottom: 2,
  },
  podiumXP: {
    marginBottom: spacing.xs,
  },
  podiumXPText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  podiumStand: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumStand1: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF8E1',
  },
  podiumStand2: {
    width: 70,
    height: 60,
    backgroundColor: '#F5F5F5',
  },
  podiumStand3: {
    width: 65,
    height: 50,
    backgroundColor: '#EFEBE9',
  },
  podiumRank: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.onSurface,
  },
  liste: {
    paddingHorizontal: spacing.containerMargin,
  },
  listeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  listeItemSen: {
    backgroundColor: 'rgb(26, 45, 77)',
    borderRadius: 8,
    marginVertical: 4,
    borderBottomWidth: 0,
  },
  siraContainer: {
    width: 36,
    alignItems: 'center',
  },
  siraText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  listeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listeAvatarSen: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  listeAvatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  listeBilgi: {
    flex: 1,
  },
  listeIsimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listeIsim: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  listeIsimSen: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  listeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listeLevel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  listeXP: {
    alignItems: 'flex-end',
  },
  listeXPText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  listeXPLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  modalLoadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR_LIGHT,
    marginTop: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalAvatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  modalName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: ICON_COLOR,
    marginBottom: spacing.xs,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  modalBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: ICON_COLOR,
  },
  modalLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ICON_COLOR,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalLevelCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modalLevelNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  modalLevelLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  modalLevelInfo: {
    flex: 1,
  },
  modalUnvan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  modalXP: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  modalSectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
    marginBottom: spacing.sm,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: ICON_COLOR,
    marginTop: 4,
  },
  modalStatLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  modalRozetler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalRozet: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  modalRozetAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: ICON_COLOR,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalFooterText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: ICON_COLOR_LIGHT,
  },
});
