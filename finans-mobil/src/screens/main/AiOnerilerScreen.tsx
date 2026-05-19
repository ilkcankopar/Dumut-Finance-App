import React, { useCallback, useEffect, useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../../theme';
import { Card, Icon } from '../../components';
import { apiClient } from '../../api/client';
import Toast from 'react-native-toast-message';

interface Oneri {
  id: string;
  tip: 'BUTCE' | 'HEDEF' | 'KATEGORI' | 'GENEL' | 'TASARRUF';
  baslik: string;
  icerik: string;
  kategoriAd?: string;
  oncelik?: 'yuksek' | 'orta' | 'dusuk';
}

interface Props {
  navigation: any;
}

const tipEtiket: Record<Oneri['tip'], string> = {
  BUTCE: 'Butce',
  HEDEF: 'Hedef',
  KATEGORI: 'Kategori',
  GENEL: 'Ipucu',
  TASARRUF: 'Tasarruf',
};

const tipRenk: Record<Oneri['tip'], string> = {
  BUTCE: '#E3F2FD',
  HEDEF: '#E8F5E9',
  KATEGORI: '#FFF3E0',
  GENEL: '#F3E5F5',
  TASARRUF: '#E0F7FA',
};

const tipIkon: Record<Oneri['tip'], string> = {
  BUTCE: 'wallet',
  HEDEF: 'bullseye',
  KATEGORI: 'tag',
  GENEL: 'lightbulb',
  TASARRUF: 'piggyBank',
};

export const AiOnerilerScreen: React.FC<Props> = ({ navigation }) => {
  const [oneriler, setOneriler] = useState<Oneri[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOneriler = useCallback(async () => {
    try {
      const res = await apiClient.get('/butce/oneriler');
      const list = res.data?.data?.oneriler;
      setOneriler(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('Öneriler yüklenemedi:', e);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Öneriler alınamadı',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOneriler();
  }, [fetchOneriler]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOneriler();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevronLeft" size={18} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Akıllı Öneriler</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.intro}>
            Harcama kalıpların, bütçe kalemlerin ve hedeflerine göre oluşturulmuş öneriler.
            Bunlar kural tabanlıdır; zaman içinde daha fazla işlem ekledikçe daha anlamlı hale gelir.
          </Text>

          {oneriler.map((o, index) => (
            <Animated.View
              key={o.id}
              entering={FadeInDown.delay(index * 60).duration(320)}
            >
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: tipRenk[o.tip] }]}>
                    <Icon name={tipIkon[o.tip] as any} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tipEtiket[o.tip]}</Text>
                    </View>
                    {o.oncelik === 'yuksek' && (
                      <View style={[styles.priorityBadge, { backgroundColor: '#FFEBEE' }]}>
                        <Text style={[styles.priorityText, { color: colors.error }]}>Onemli</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.baslik}>{o.baslik}</Text>
                <Text style={styles.icerik}>{o.icerik}</Text>
                {o.kategoriAd && (
                  <View style={styles.kategoriWrap}>
                    <Icon name="tag" size={12} color={colors.onSurfaceVariant} />
                    <Text style={styles.kategoriEtiket}>{o.kategoriAd}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          ))}
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  intro: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  kategoriWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  kategoriEtiket: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  baslik: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  icerik: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
});
