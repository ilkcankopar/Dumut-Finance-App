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
          clickAction="OPEN_APP"
        >
          <TextWidget text="AI" style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '900' }} />
        </FlexWidget>
        <TextWidget 
          text="SESLİ ASİSTAN" 
          style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }} 
        />
        <TextWidget 
          text="Giriş yapmak için dokunun" 
          style={{ fontSize: 11, color: '#A3A3A3' }} 
        />
      </FlexWidget>
    );
  }

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
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'finans://asistan?voice=true' }}
    >
      <FlexWidget
        style={{
          width: 64,
          height: 64,
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'finans://asistan?voice=true' }}
      >
        <TextWidget text="AI" style={{ fontSize: 22, color: '#000000', fontWeight: '900' }} />
      </FlexWidget>

      <TextWidget 
        text="SESLİ ASİSTAN" 
        style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }} 
      />
      <TextWidget 
        text="Konuşmak için dokunun" 
        style={{ fontSize: 11, color: '#A3A3A3' }} 
      />
    </FlexWidget>
  );
}
