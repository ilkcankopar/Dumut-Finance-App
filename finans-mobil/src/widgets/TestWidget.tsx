import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface TestWidgetProps {
  isLoggedIn?: boolean;
  gunlukHarcama?: number;
  gunlukLimit?: number;
}

export function TestWidget({ isLoggedIn = false, gunlukHarcama = 0, gunlukLimit = 500 }: TestWidgetProps) {
  // Giriş yapılmamışsa
  if (!isLoggedIn) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#1a1a1a',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <TextWidget 
          text="Finans" 
          style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 }} 
        />
        <TextWidget 
          text="Giriş yapın" 
          style={{ fontSize: 14, color: '#888888' }} 
        />
      </FlexWidget>
    );
  }

  // Giriş yapılmışsa
  const kalan = gunlukLimit - gunlukHarcama;
  const yuzde = Math.round((gunlukHarcama / gunlukLimit) * 100);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginBottom: 12,
        }}
      >
        <TextWidget 
          text="Finans" 
          style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }} 
        />
        <TextWidget 
          text={`%${yuzde}`} 
          style={{ fontSize: 14, color: '#666666' }} 
        />
      </FlexWidget>

      {/* Günlük Harcama */}
      <FlexWidget style={{ width: 'match_parent', marginBottom: 8 }}>
        <TextWidget 
          text="Günlük Harcama" 
          style={{ fontSize: 12, color: '#666666', marginBottom: 4 }} 
        />
        <TextWidget 
          text={`${gunlukHarcama} TL`} 
          style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }} 
        />
      </FlexWidget>

      {/* Kalan Limit */}
      <FlexWidget style={{ width: 'match_parent' }}>
        <TextWidget 
          text={`Kalan: ${kalan} TL`} 
          style={{ fontSize: 14, color: kalan > 0 ? '#333333' : '#cc0000' }} 
        />
      </FlexWidget>
    </FlexWidget>
  );
}
