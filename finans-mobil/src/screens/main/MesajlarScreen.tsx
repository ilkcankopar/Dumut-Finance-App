import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';
import { mesajApi, Konusma } from '../../api/mesaj';
import Toast from 'react-native-toast-message';

const ICON_COLOR = '#1a1a1a';
const ICON_COLOR_LIGHT = '#666';

interface Props {
  navigation: any;
}

export const MesajlarScreen: React.FC<Props> = ({ navigation }) => {
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKonusmalar = useCallback(async () => {
    try {
      const data = await mesajApi.konusmalar();
      setKonusmalar(data);
    } catch (error) {
      console.log('Konuşmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchKonusmalar();
    }, [fetchKonusmalar])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchKonusmalar();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const renderKonusma = ({ item }: { item: Konusma }) => {
    const { kullanici, sonMesaj, okunmamisSayisi } = item;
    const isUnread = okunmamisSayisi > 0;

    return (
      <TouchableOpacity
        style={styles.konusmaItem}
        onPress={() => navigation.navigate('Sohbet', { 
          kullaniciId: kullanici.id,
          kullaniciAd: `${kullanici.ad} ${kullanici.soyad}`,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {kullanici.ad.charAt(0)}{kullanici.soyad.charAt(0)}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{kullanici.level}</Text>
          </View>
        </View>

        <View style={styles.konusmaInfo}>
          <View style={styles.konusmaHeader}>
            <Text style={[styles.kullaniciAd, isUnread && styles.unreadText]}>
              {kullanici.ad} {kullanici.soyad}
            </Text>
            <Text style={styles.zaman}>{formatDate(sonMesaj.olusturuldu)}</Text>
          </View>
          <View style={styles.sonMesajRow}>
            <Text 
              style={[styles.sonMesaj, isUnread && styles.unreadText]} 
              numberOfLines={1}
            >
              {sonMesaj.mesajTipi === 'PAYLASIM' 
                ? (sonMesaj.paylasimTipi === 'HEDEF' ? 'Hedef paylasildi'
                  : sonMesaj.paylasimTipi === 'BUTCE' ? 'Butce paylasildi'
                  : sonMesaj.paylasimTipi === 'ROZET' ? 'Rozet paylasildi'
                  : sonMesaj.icerik)
                : sonMesaj.icerik
              }
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{okunmamisSayisi}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevronLeft" size={20} color={ICON_COLOR} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={ICON_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <View style={{ width: 40 }} />
      </View>

      {konusmalar.length > 0 ? (
        <FlatList
          data={konusmalar}
          keyExtractor={(item) => item.kullanici.id}
          renderItem={renderKonusma}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="paperPlane" size={48} color={ICON_COLOR_LIGHT} />
          <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
          <Text style={styles.emptySubtitle}>
            Arkadaşlarınla mesajlaşmaya başla ve hedeflerini paylaş!
          </Text>
          <TouchableOpacity
            style={styles.arkadasEkleBtn}
            onPress={() => navigation.navigate('Arkadaslar')}
          >
            <Icon name="users" size={16} color="#fff" />
            <Text style={styles.arkadasEkleBtnText}>Arkadaşlara Git</Text>
          </TouchableOpacity>
        </View>
      )}
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
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: ICON_COLOR,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.containerMargin,
  },
  konusmaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgb(26, 45, 77)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#fff',
  },
  konusmaInfo: {
    flex: 1,
  },
  konusmaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kullaniciAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: ICON_COLOR,
  },
  zaman: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: ICON_COLOR_LIGHT,
  },
  sonMesajRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sonMesaj: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: ICON_COLOR_LIGHT,
    flex: 1,
  },
  unreadText: {
    fontFamily: 'Poppins_600SemiBold',
    color: ICON_COLOR,
  },
  unreadBadge: {
    backgroundColor: 'rgb(26, 45, 77)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  unreadCount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: ICON_COLOR,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR_LIGHT,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  arkadasEkleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: ICON_COLOR,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  arkadasEkleBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
