import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

const linking = {
  prefixes: ['finans://'],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Asistan: {
            path: 'asistan',
          },
          Pano: {
            path: 'pano',
          }
        }
      }
    }
  }
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }
    return <MainNavigator />;
  };

  return (
    <NavigationContainer linking={linking}>
      {getNavigator()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
