import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PanoScreen } from '../screens/main/PanoScreen';
import { IslemEkleScreen } from '../screens/main/IslemEkleScreen';
import { HedeflerScreen } from '../screens/main/HedeflerScreen';
import { HedefEkleScreen } from '../screens/onboarding/HedefEkleScreen';
import { RaporlarScreen } from '../screens/main/RaporlarScreen';
import { PiyasaScreen } from '../screens/main/PiyasaScreen';
import { HisseDetayScreen } from '../screens/main/HisseDetayScreen';
import { ProfilScreen } from '../screens/main/ProfilScreen';
import { BildirimlerScreen } from '../screens/main/BildirimlerScreen';
import { AsistanScreen } from '../screens/main/AsistanScreen';
import { KategoriScreen } from '../screens/main/KategoriScreen';
import { IslemlerScreen } from '../screens/main/IslemlerScreen';
import { AiOnerilerScreen } from '../screens/main/AiOnerilerScreen';
import { ArkadaslarScreen } from '../screens/main/ArkadaslarScreen';
import { LeaderboardScreen } from '../screens/main/LeaderboardScreen';
import { RozetlerScreen } from '../screens/main/RozetlerScreen';
import { KediScreen } from '../screens/main/KediScreen';
import { HaritaOzetiScreen } from '../screens/main/HaritaOzetiScreen';
import { MesajlarScreen } from '../screens/main/MesajlarScreen';
import { SohbetScreen } from '../screens/main/SohbetScreen';
import { AppTourModal } from '../components/AppTourModal';
import { Icon, IconName } from '../components/Icon';
import { colors, spacing } from '../theme';

export type MainTabParamList = {
  Pano: undefined;
  İşlem: undefined;
  Asistan: undefined;
  Raporlar: undefined;
  Piyasa: undefined;
};

export type MainStackParamList = {
MainTabs: undefined;
Bildirimler: undefined;
Hedefler: undefined;
HedefEkle: undefined;
KategoriYonetimi: undefined;
Islemler: undefined;
IslemEkle: undefined;
AiOneriler: undefined;
Arkadaslar: undefined;
Leaderboard: undefined;
Rozetler: undefined;
Kedi: undefined;
Piyasa: undefined;
HisseDetay: { sembol: string; ad?: string };
Profil: undefined;
HaritaOzeti: undefined;
Mesajlar: undefined;
Sohbet: { kullaniciId: string; kullaniciAd: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: IconName;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, iconName, label }) => {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Icon 
          name={iconName} 
          size={20} 
          color={focused ? colors.onPrimary : colors.onSurfaceVariant} 
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Pano"
        component={PanoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home" label="Ana Sayfa" />
          ),
        }}
      />
      <Tab.Screen
        name="İşlem"
        component={IslemlerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="receipt" label="İşlemler" />
          ),
        }}
      />
      <Tab.Screen
        name="Asistan"
        component={AsistanScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="microphone" label="Asistan" />
          ),
        }}
      />
      <Tab.Screen
      name="Raporlar"
      component={RaporlarScreen}
      options={{
      tabBarIcon: ({ focused }) => (
      <TabIcon focused={focused} iconName="chartPie" label="Raporlar" />
      ),
      }}
      />
      <Tab.Screen
        name="Piyasa"
        component={PiyasaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="chartBar" label="Piyasa" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  const [tourVisible, setTourVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const done = await AsyncStorage.getItem('appTourV1Complete');
        if (!cancelled && done !== 'true') setTourVisible(true);
      } catch {
        if (!cancelled) setTourVisible(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeTour = async () => {
    try {
      await AsyncStorage.setItem('appTourV1Complete', 'true');
    } finally {
      setTourVisible(false);
    }
  };

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="Bildirimler" 
          component={BildirimlerScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
        name="Hedefler"
        component={HedeflerScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
        name="HedefEkle"
        component={HedefEkleScreen}
        options={{
        animation: 'slide_from_bottom',
        }}
        />
        <Stack.Screen 
          name="KategoriYonetimi" 
          component={KategoriScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Islemler" 
          component={IslemlerScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="IslemEkle" 
          component={IslemEkleScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="AiOneriler" 
          component={AiOnerilerScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Arkadaslar" 
          component={ArkadaslarScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Rozetler" 
          component={RozetlerScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
        name="Kedi"
        component={KediScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
        name="Piyasa"
        component={PiyasaScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
        name="HisseDetay"
        component={HisseDetayScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
        name="HaritaOzeti"
        component={HaritaOzetiScreen}
        options={{
        animation: 'slide_from_right',
        }}
        />
        <Stack.Screen
          name="Mesajlar"
          component={MesajlarScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Sohbet"
          component={SohbetScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        </Stack.Navigator>
      <AppTourModal visible={tourVisible} onComplete={completeTour} />
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapperActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
