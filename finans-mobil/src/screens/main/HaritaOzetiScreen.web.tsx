import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon } from '../../components';

// Import leaflet stuff
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in leaflet with webpack/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const HaritaOzetiScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    // Dynamic injecting of Leaflet CSS to prevent tile tearing
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    let link: HTMLLinkElement | null = null;
    
    if (existingLink) {
      setCssLoaded(true);
    } else {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      link.onload = () => setCssLoaded(true);
      document.head.appendChild(link);
    }

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

    return () => {
      if (link && document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
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
  
  const initialCenter = enCokHarcanan ? [enCokHarcanan.enlem, enCokHarcanan.boylam] : [41.0082, 28.9784];

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
        {/* React Leaflet works smoothly on Web only when CSS stylesheet is loaded */}
        {cssLoaded ? (
          <MapContainer 
            center={initialCenter as [number, number]} 
            zoom={12} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {haritaVerisi.map((loc: any, idx: number) => (
              <Marker key={idx} position={[loc.enlem, loc.boylam]}>
                <Popup maxWidth={280}>
                  <div style={{
                    fontFamily: 'Poppins, sans-serif',
                    padding: '6px 4px',
                    color: '#1a1a1a',
                    minWidth: '240px'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '2px solid #f0f0f0',
                      paddingBottom: '8px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: colors.primary }}>{loc.konumAd}</h4>
                        <span style={{ fontSize: '11px', color: '#666' }}>{loc.islemSayisi} işlem yapıldı</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: colors.error }}>-{loc.toplamGider.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>

                    {/* Transaction List (Ekstre) */}
                    <div style={{ maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
                      {loc.islemler && loc.islemler.map((islem: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: i === loc.islemler.length - 1 ? 'none' : '1px dashed #eee'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: (islem.kategori?.renk || '#FF3B30') + '15',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '11px'
                            }}>
                              💸
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: '#333' }}>{islem.baslik}</div>
                              <div style={{ fontSize: '9px', color: '#888' }}>
                                {new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#222' }}>
                            -{islem.miktar.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
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
});
