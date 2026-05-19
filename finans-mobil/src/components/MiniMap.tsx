import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

interface MiniMapProps {
  haritaVerisi: any[];
  height?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({ haritaVerisi = [], height = 300 }) => {
  const firstWithCoords = haritaVerisi.find(loc => loc.enlem && loc.boylam);
  const initialLat = firstWithCoords?.enlem || 41.0082;
  const initialLon = firstWithCoords?.boylam || 28.9784;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        body { margin: 0; padding: 0; background-color: #ffffff; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 2px;
          background: #ffffff;
        }
        .leaflet-popup-content h5 {
          margin: 0 0 2px 0;
          font-size: 11px;
          color: #0f172a;
        }
        .leaflet-popup-content p {
          margin: 0;
          font-size: 12px;
          color: #3b82f6;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { 
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false
        }).setView([${initialLat}, ${initialLon}], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        const markerData = ${JSON.stringify(haritaVerisi)};
        markerData.forEach(loc => {
          if (!loc.enlem || !loc.boylam) return;
          const marker = L.marker([loc.enlem, loc.boylam]).addTo(map);
          marker.bindPopup(\`
            <div>
              <h5>\${loc.konumAd}</h5>
              <p>\${loc.toplamGider.toLocaleString('tr-TR')} ₺</p>
            </div>
          \`);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />
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
