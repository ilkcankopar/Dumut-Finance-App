import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface Props {
  isLoggedIn?: boolean;
  gunlukHarcama?: number;
  gunlukLimit?: number;
}

export function GunlukHarcamaWidget({ isLoggedIn = false, gunlukHarcama = 0, gunlukLimit = 500 }: Props) {
  if (!isLoggedIn) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#1E293B',
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
            backgroundColor: '#334155',
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <TextWidget text="👛" style={{ fontSize: 28 }} />
        </FlexWidget>
        <TextWidget 
          text="Günlük Harcama" 
          style={{ fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 }} 
        />
        <TextWidget 
          text="Giriş yapmak için dokunun" 
          style={{ fontSize: 12, color: '#94A3B8' }} 
        />
      </FlexWidget>
    );
  }

  const kalan = gunlukLimit - gunlukHarcama;
  const yuzde = gunlukLimit > 0 ? Math.round((gunlukHarcama / gunlukLimit) * 100) : 0;
  const limitAsimi = kalan < 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
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
          <TextWidget text="👛 " style={{ fontSize: 16 }} />
          <TextWidget 
            text="Günlük Harcama" 
            style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} 
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: limitAsimi ? '#FEE2E2' : '#F1F5F9',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <TextWidget 
            text={`%${yuzde}`} 
            style={{ fontSize: 12, fontWeight: '700', color: limitAsimi ? '#EF4444' : '#64748B' }} 
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', marginVertical: 8 }}>
        <TextWidget 
          text={`${gunlukHarcama.toLocaleString('tr-TR')} ₺`} 
          style={{ fontSize: 32, fontWeight: '800', color: '#0F172A' }} 
        />
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent' }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            height: 8,
            backgroundColor: '#E2E8F0',
            borderRadius: 4,
            marginBottom: 8,
            flexDirection: 'row',
          }}
        >
          <FlexWidget
            style={{
              flex: Math.min(yuzde, 100),
              height: 8,
              backgroundColor: limitAsimi ? '#EF4444' : '#10B981',
              borderRadius: 4,
            }}
          />
          <FlexWidget
            style={{
              flex: Math.max(100 - yuzde, 0),
              height: 8,
            }}
          />
        </FlexWidget>

        <TextWidget 
          text={limitAsimi ? `Limit aşımı: ${Math.abs(kalan).toLocaleString('tr-TR')} ₺` : `Kalan: ${kalan.toLocaleString('tr-TR')} ₺`} 
          style={{ fontSize: 13, fontWeight: '600', color: limitAsimi ? '#EF4444' : '#64748B' }} 
        />
      </FlexWidget>
    </FlexWidget>
  );
}

