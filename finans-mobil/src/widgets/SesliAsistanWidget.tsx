import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface Props {
  isLoggedIn?: boolean;
}

export function SesliAsistanWidget({ isLoggedIn = false }: Props) {
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
          <TextWidget text="🎙️" style={{ fontSize: 28 }} />
        </FlexWidget>
        <TextWidget 
          text="Sesli Asistan" 
          style={{ fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 }} 
        />
        <TextWidget 
          text="Giriş yapmak için dokunun" 
          style={{ fontSize: 12, color: '#94A3B8' }} 
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        padding: 20,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          width: 64,
          height: 64,
          backgroundColor: '#38BDF8',
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <TextWidget text="🎙️" style={{ fontSize: 32 }} />
      </FlexWidget>

      <TextWidget 
        text="Sesli Asistan" 
        style={{ fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 }} 
      />
      <TextWidget 
        text="Konuşmak için dokunun" 
        style={{ fontSize: 12, color: '#94A3B8' }} 
      />
    </FlexWidget>
  );
}

