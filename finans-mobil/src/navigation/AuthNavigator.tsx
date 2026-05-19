import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KullaniciTipiSecimScreen } from '../screens/auth/KullaniciTipiSecimScreen';
import { KayitScreen } from '../screens/auth/KayitScreen';
import { GirisScreen } from '../screens/auth/GirisScreen';
import {
  SabitGelirGiderScreen,
  ButceHedefScreen,
  HedefEkleScreen,
} from '../screens/onboarding';

export type AuthStackParamList = {
  KullaniciTipiSecim: undefined;
  SabitGelirGider: { kullaniciTipi: string };
  ButceHedef: {
    kullaniciTipi: string;
    sabitIslemler?: any[];
    tahminiGelir?: number;
    sorular?: any[];
  };
  HedefEkle: {
    kullaniciTipi: string;
    sabitIslemler: any[];
    tahminiGelir: number;
    butceProfili: any;
  };
  Kayit: {
    kullaniciTipi: string;
    onboardingData?: any; // We will pass all collected data here
  };
  Giris: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="KullaniciTipiSecim"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f9f9f9' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="KullaniciTipiSecim" component={KullaniciTipiSecimScreen} />
      <Stack.Screen name="SabitGelirGider" component={SabitGelirGiderScreen} />
      <Stack.Screen name="ButceHedef" component={ButceHedefScreen} />
      <Stack.Screen name="HedefEkle" component={HedefEkleScreen} />
      <Stack.Screen name="Kayit" component={KayitScreen} />
      <Stack.Screen name="Giris" component={GirisScreen} />
    </Stack.Navigator>
  );
};
