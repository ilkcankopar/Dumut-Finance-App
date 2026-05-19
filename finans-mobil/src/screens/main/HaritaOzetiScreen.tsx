import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '../../components';

export const HaritaOzetiScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/islem/harita-ozeti');
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (error) {
        console.log("Harita özeti hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enCokHarcanan = data?.enCokHarcananKonum;
  const haritaVerisi = data?.haritaVerisi || [];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>Harcama Coğrafyası</Text>
        <Text style={styles.subtitle}>Harita üzerindeki harcamalarınız</Text>
      </Animated.View>

      {enCokHarcanan && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.summaryCard}>
          <Icon name="mapMarkerAlt" size={24} color={colors.primary} />
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Bu hafta en çok {enCokHarcanan.konumAd} bölgesinde harcadınız</Text>
            <Text style={styles.summaryAmount}>{enCokHarcanan.toplamGider.toLocaleString('tr-TR')} TL</Text>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: enCokHarcanan?.enlem || 41.0082,
            longitude: enCokHarcanan?.boylam || 28.9784,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {haritaVerisi.map((loc: any, idx: number) => (
            <Marker
              key={idx}
              coordinate={{ latitude: loc.enlem, longitude: loc.boylam }}
              title={loc.konumAd}
              description={`${loc.toplamGider.toLocaleString('tr-TR')} TL (${loc.islemSayisi} işlem)`}
            />
          ))}
        </MapView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  summaryCard: {
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  summaryAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.primary,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.containerMargin,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
