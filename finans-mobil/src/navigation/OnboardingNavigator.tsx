import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SabitGelirGiderScreen,
  ButceHedefScreen,
  HedefEkleScreen,
} from '../screens/onboarding';

export type OnboardingStackParamList = {
  SabitGelirGider: undefined;
  ButceHedef: undefined;
  HedefEkle: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SabitGelirGider" component={SabitGelirGiderScreen} />
      <Stack.Screen name="ButceHedef" component={ButceHedefScreen} />
      <Stack.Screen name="HedefEkle" component={HedefEkleScreen} />
    </Stack.Navigator>
  );
};
