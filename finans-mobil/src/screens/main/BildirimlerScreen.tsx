import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tip: 'info' | 'warning' | 'success';
  okundu: boolean;
  tarih: string;
}

interface Props {
  navigation: any;
}

export const BildirimlerScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getIconForTip = (tip: Bildirim['tip']) => {
    switch (tip) {
      case 'success':
        return { name: 'checkCircle' as const, color: colors.success };
      case 'warning':
        return { name: 'exclamation' as const, color: '#f59e0b' };
      default:
        return { name: 'info' as const, color: colors.primary };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bildirimler.length > 0 ? (
          bildirimler.map((bildirim, index) => {
            const iconConfig = getIconForTip(bildirim.tip);
            return (
              <Animated.View
                key={bildirim.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <TouchableOpacity
                  style={[
                    styles.bildirimItem,
                    !bildirim.okundu && styles.bildirimUnread,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bildirimIcon, { backgroundColor: `${iconConfig.color}15` }]}>
                    <Icon name={iconConfig.name} size={18} color={iconConfig.color} />
                  </View>
                  <View style={styles.bildirimContent}>
                    <Text style={styles.bildirimBaslik}>{bildirim.baslik}</Text>
                    <Text style={styles.bildirimMesaj} numberOfLines={2}>
                      {bildirim.mesaj}
                    </Text>
                    <Text style={styles.bildirimTarih}>{bildirim.tarih}</Text>
                  </View>
                  {!bildirim.okundu && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="bell" size={48} color={colors.outline} />
            </View>
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptySubtitle}>
              Yeni bildirimleriniz burada görünecek.
            </Text>
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  bildirimItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingHorizontal: spacing.containerMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bildirimUnread: {
    backgroundColor: colors.surfaceContainerLow,
  },
  bildirimIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bildirimContent: {
    flex: 1,
  },
  bildirimBaslik: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 2,
  },
  bildirimMesaj: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  bildirimTarih: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.outline,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
