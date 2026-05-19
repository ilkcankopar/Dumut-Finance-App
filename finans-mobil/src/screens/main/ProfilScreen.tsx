import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { IconName } from '../../components/Icon';
import { levelApi, LevelDurum, LevelIstatistik } from '../../api/level';
import { rozetApi } from '../../api/rozet';

interface MenuItem {
  id: string;
  title: string;
  icon: IconName;
  route?: string;
  badge?: number;
}

interface Props {
  navigation: any;
}

const LIGLER = [
  { isim: 'Bronz', renk: '#CD7F32', icon: 'medal' as IconName },
  { isim: 'Gümüş', renk: '#C0C0C0', icon: 'medal' as IconName },
  { isim: 'Altın', renk: '#FFD700', icon: 'trophy' as IconName },
  { isim: 'Elmas', renk: '#00CED1', icon: 'trophy' as IconName },
  { isim: 'Şampiyon', renk: '#9C27B0', icon: 'trophy' as IconName },
];

export const ProfilScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [levelDurum, setLevelDurum] = useState<LevelDurum | null>(null);
  const [istatistikler, setIstatistikler] = useState<LevelIstatistik | null>(null);
  const [rozetSayisi, setRozetSayisi] = useState({ kazanilan: 0, toplam: 0 });

  const loadData = useCallback(async () => {
    try {
      const [levelRes, istatRes, rozetRes] = await Promise.all([
        levelApi.durumGetir().catch(() => null),
        levelApi.istatistikler().catch(() => null),
        rozetApi.kullaniciRozetleriGetir().catch(() => null),
      ]);
      
      if (levelRes) setLevelDurum(levelRes);
      if (istatRes) setIstatistikler(istatRes);
      if (rozetRes) setRozetSayisi({ kazanilan: rozetRes.kazanilanSayisi, toplam: rozetRes.toplam });
    } catch (error) {
      console.log('Profil veri yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Çıkış yapıldı',
        text2: 'Görüşmek üzere!',
      });
    } catch (error) {
      console.log('Çıkış hatası:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Çıkış yapılırken bir sorun oluştu',
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'rozetler', title: 'Rozetler & Level', icon: 'medal', route: 'Rozetler', badge: rozetSayisi.kazanilan },
    { id: 'siralama', title: 'Sıralama', icon: 'trophy', route: 'Leaderboard' },
    { id: 'arkadaslar', title: 'Arkadaşlar', icon: 'users', route: 'Arkadaslar', badge: istatistikler?.toplamArkadas },
    { id: 'hedef', title: 'Hedeflerim', icon: 'bullseye', route: 'Hedefler', badge: istatistikler?.toplamHedef },
    { id: 'islemler', title: 'Geçmiş İşlemler', icon: 'history', route: 'Islemler' },
    { id: 'kategori', title: 'Kategori Yönetimi', icon: 'tag', route: 'KategoriYonetimi' },
    { id: 'kedi', title: 'Kedim', icon: 'paw', route: 'Kedi' },
    { id: 'ai', title: 'Akıllı Öneriler', icon: 'lightbulb', route: 'AiOneriler' },
    { id: 'bildirim', title: 'Bildirimler', icon: 'bell', route: 'Bildirimler' },
  ];

  const getKullaniciTipiLabel = () => {
    switch (user?.kullaniciTipi) {
      case 'OGRENCI':
        return 'Öğrenci';
      case 'GIRISIMCI':
        return 'Girişimci';
      case 'BUSINESS':
        return 'Çalışan Hesabı';
      default:
        return 'Kullanıcı';
    }
  };

  const getLigInfo = (ligIsim: string) => {
    return LIGLER.find(l => l.isim === ligIsim) || LIGLER[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profil Kartı */}
        <Card variant="outlined" style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.ad?.charAt(0) || 'K'}
                {user?.soyad?.charAt(0) || ''}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.ad} {user?.soyad}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>
                  {getKullaniciTipiLabel()}
                </Text>
              </View>
            </View>
          </View>

          {/* Level Bilgisi */}
          {levelDurum && (
            <TouchableOpacity 
              style={styles.levelSection}
              onPress={() => navigation.navigate('Rozetler')}
              activeOpacity={0.8}
            >
              <View style={styles.levelLeft}>
                <View style={styles.levelCircle}>
                  <Text style={styles.levelNumber}>{levelDurum.level}</Text>
                </View>
                <View>
                  <Text style={styles.levelUnvan}>{levelDurum.unvan}</Text>
                  <View style={styles.ligRow}>
                    <Icon 
                      name={getLigInfo(levelDurum.lig).icon} 
                      size={12} 
                      color="#fff"
                    />
                    <Text style={styles.ligText}>
                      {levelDurum.lig} Lig
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.levelRight}>
                <Text style={styles.xpText}>{levelDurum.toplamXP.toLocaleString()} XP</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${levelDurum.ilerlemeYuzdesi}%` }]} />
                </View>
                <Text style={styles.xpRemaining}>
                  {levelDurum.kalanXP.toLocaleString()} XP kaldı
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Card>

        {/* İstatistikler */}
        {istatistikler && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="receipt" size={20} color={colors.primary} />
              <Text style={styles.statValue}>{istatistikler.toplamIslem}</Text>
              <Text style={styles.statLabel}>İşlem</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="bullseye" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{istatistikler.tamamlananHedef}/{istatistikler.toplamHedef}</Text>
              <Text style={styles.statLabel}>Hedef</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="medal" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{rozetSayisi.kazanilan}/{rozetSayisi.toplam}</Text>
              <Text style={styles.statLabel}>Rozet</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="users" size={20} color="#E91E63" />
              <Text style={styles.statValue}>{istatistikler.toplamArkadas}</Text>
              <Text style={styles.statLabel}>Arkadaş</Text>
            </View>
          </View>
        )}

        {/* Günlük Ortalama XP */}
        {istatistikler && (
          <Card variant="outlined" style={styles.dailyCard}>
            <View style={styles.dailyRow}>
              <View style={styles.dailyItem}>
                <Text style={styles.dailyValue}>{istatistikler.gunlukOrtalamaXP}</Text>
                <Text style={styles.dailyLabel}>Günlük Ort. XP</Text>
              </View>
              <View style={styles.dailyDivider} />
              <View style={styles.dailyItem}>
                <Text style={styles.dailyValue}>{istatistikler.uyeGunSayisi}</Text>
                <Text style={styles.dailyLabel}>Gündür Üye</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Menü */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={16} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Icon name="chevronRight" size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Icon name="signOut" size={16} color={colors.error} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>Versiyon 1.0.0</Text>
      </ScrollView>
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
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.onPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  userEmail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  userTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.secondaryContainer,
    alignSelf: 'flex-start',
  },
  userTypeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.secondary,
  },
  levelSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(26, 45, 77)',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  levelUnvan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  ligRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ligText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  xpRemaining: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  dailyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyItem: {
    flex: 1,
    alignItems: 'center',
  },
  dailyValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  dailyLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  dailyDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    flex: 1,
  },
  menuBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: colors.onPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  logoutText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.error,
  },
  version: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
