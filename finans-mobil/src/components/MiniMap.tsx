import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../theme';

interface MiniMapProps {
  haritaVerisi: any[];
  height?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({ haritaVerisi = [], height = 300 }) => {
  const defaultCenter = {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const initialRegion = haritaVerisi.length > 0 && haritaVerisi[0].enlem && haritaVerisi[0].boylam
    ? {
        latitude: haritaVerisi[0].enlem,
        longitude: haritaVerisi[0].boylam,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : defaultCenter;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {haritaVerisi.map((loc: any, idx: number) => {
          if (!loc.enlem || !loc.boylam) return null;
          return (
            <Marker
              key={idx}
              coordinate={{ latitude: loc.enlem, longitude: loc.boylam }}
              title={loc.konumAd}
              description={`${loc.toplamGider.toLocaleString('tr-TR')} TL (${loc.islemSayisi} işlem)`}
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight || '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
