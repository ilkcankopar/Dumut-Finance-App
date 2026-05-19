import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '../../components';

export const HaritaOzetiScreen = ({ navigation }: any) => {
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

  const initialLat = enCokHarcanan?.enlem || 41.0082;
  const initialLon = enCokHarcanan?.boylam || 28.9784;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        body { margin: 0; padding: 0; background-color: #0f172a; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 6px;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #0f172a;
          font-weight: 700;
        }
        .leaflet-popup-content p {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #3b82f6;
          font-weight: 800;
        }
        .leaflet-popup-content span {
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLon}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const markerData = ${JSON.stringify(haritaVerisi)};
        markerData.forEach(loc => {
          if (!loc.enlem || !loc.boylam) return;
          const marker = L.marker([loc.enlem, loc.boylam]).addTo(map);
          marker.bindPopup(\`
            <div>
              <h4>\${loc.konumAd}</h4>
              <p>\${loc.toplamGider.toLocaleString('tr-TR')} ₺</p>
              <span>\${loc.islemSayisi} işlem yapıldı</span>
            </div>
          \`);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Harcama Coğrafyası</Text>
          <Text style={styles.subtitle}>Harita üzerindeki harcamalarınız</Text>
        </View>
      </View>

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
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
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
    zIndex: 10,
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
    zIndex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
