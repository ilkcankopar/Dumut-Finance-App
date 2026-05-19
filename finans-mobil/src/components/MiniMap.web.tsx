import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

// Import leaflet stuff for web only
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in leaflet with webpack/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MiniMapProps {
  haritaVerisi: any[];
  height?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({ haritaVerisi = [], height = 300 }) => {
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
      link.onload = () => setCssLoaded(true);
      document.head.appendChild(link);
    }
  }, []);

  const defaultCenter = [41.0082, 28.9784]; // Istanbul
  const initialCenter = haritaVerisi.length > 0 && haritaVerisi[0].enlem && haritaVerisi[0].boylam
    ? [haritaVerisi[0].enlem, haritaVerisi[0].boylam]
    : defaultCenter;

  if (!cssLoaded) {
    return (
      <View style={[styles.center, { height }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <div style={{ height: `${height}px`, width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      <MapContainer 
        center={initialCenter as [number, number]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {haritaVerisi.map((loc: any, idx: number) => {
          if (!loc.enlem || !loc.boylam) return null;
          return (
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
          );
        })}
      </MapContainer>
    </div>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  }
});
