import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface Props {
  isLoggedIn?: boolean;
  hedefAdi?: string;
  mevcutMiktar?: number;
  hedefMiktar?: number;
}

export function HedefWidget({ 
  isLoggedIn = false, 
  hedefAdi = 'Hedef', 
  mevcutMiktar = 0, 
  hedefMiktar = 1000 
}: Props) {
  if (!isLoggedIn) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 24,
          padding: 20,
        }}
        clickAction="OPEN_APP"
      >
        <FlexWidget
          style={{
            width: 56,
            height: 56,
            backgroundColor: '#262626',
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <TextWidget text="◎" style={{ fontSize: 24, color: '#FFFFFF', fontWeight: '800' }} />
        </FlexWidget>
        <TextWidget 
          text="HEDEF TAKİBİ" 
          style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }} 
        />
        <TextWidget 
          text="Giriş yapmak için dokunun" 
          style={{ fontSize: 11, color: '#A3A3A3' }} 
        />
      </FlexWidget>
    );
  }

  const yuzde = hedefMiktar > 0 ? Math.round((mevcutMiktar / hedefMiktar) * 100) : 0;
  const kalan = hedefMiktar - mevcutMiktar;
  const hedefUlasildi = kalan <= 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#000000',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="◎ " style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '900' }} />
          <TextWidget 
            text={hedefAdi.toUpperCase()} 
            style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }} 
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: '#262626',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <TextWidget 
            text={`%${Math.min(yuzde, 100)}`} 
            style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }} 
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', marginVertical: 8 }}>
        <TextWidget 
          text={`${mevcutMiktar.toLocaleString('tr-TR')} ₺`} 
          style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF' }} 
        />
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent' }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            height: 6,
            backgroundColor: '#262626',
            borderRadius: 3,
            marginBottom: 8,
            flexDirection: 'row',
          }}
        >
          <FlexWidget
            style={{
              flex: Math.min(yuzde, 100),
              height: 6,
              backgroundColor: hedefUlasildi ? '#10B981' : '#FFFFFF',
              borderRadius: 3,
            }}
          />
          <FlexWidget
            style={{
              flex: Math.max(100 - yuzde, 0),
              height: 6,
            }}
          />
        </FlexWidget>

        <TextWidget 
          text={hedefUlasildi ? `Hedefe ulaşıldı! ✓` : `Hedefe: ${kalan.toLocaleString('tr-TR')} ₺ kaldı`} 
          style={{ fontSize: 12, fontWeight: '700', color: hedefUlasildi ? '#10B981' : '#A3A3A3' }} 
        />
      </FlexWidget>
    </FlexWidget>
  );
}
