import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Kullanici, ButceProfili } from '../types';
import { authApi, KayitDto, GirisDto, GoogleGirisDto } from '../api/auth';
import { apiClient } from '../api/client';
import { saveWidgetData, clearWidgetData } from '../services/widgetService';

interface AuthContextType {
  user: Kullanici | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  login: (data: GirisDto) => Promise<void>;
  loginWithGoogle: (data: GoogleGirisDto) => Promise<void>;
  register: (data: KayitDto, onboardingData?: any) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Kullanici | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      const onboardingDone = await AsyncStorage.getItem('onboardingComplete');
      
      if (userJson && token) {
        setUser(JSON.parse(userJson));
        saveWidgetData({});
        
        if (onboardingDone === 'true') {
          setIsOnboardingComplete(true);
        } else {
          try {
            const response = await apiClient.get('/butce-profili');
            if (response.data?.data?.kurulumTamamlandi) {
              setIsOnboardingComplete(true);
              await AsyncStorage.setItem('onboardingComplete', 'true');
            } else {
              setIsOnboardingComplete(false);
            }
          } catch (error) {
            setIsOnboardingComplete(false);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: GirisDto) => {
    const response = await authApi.girisYap(data);
    const { kullanici, accessToken, refreshToken } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(kullanici));
    
    setUser(kullanici);
    saveWidgetData({});

    try {
      const profilResponse = await apiClient.get('/butce-profili');
      if (profilResponse.data?.data?.kurulumTamamlandi) {
        setIsOnboardingComplete(true);
        await AsyncStorage.setItem('onboardingComplete', 'true');
      } else {
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      setIsOnboardingComplete(false);
    }
  };

  const loginWithGoogle = async (data: GoogleGirisDto) => {
    const response = await authApi.googleIleGiris(data);
    const { kullanici, accessToken, refreshToken } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(kullanici));
    
    setUser(kullanici);
    saveWidgetData({});

    try {
      const profilResponse = await apiClient.get('/butce-profili');
      if (profilResponse.data?.data?.kurulumTamamlandi) {
        setIsOnboardingComplete(true);
        await AsyncStorage.setItem('onboardingComplete', 'true');
      } else {
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      setIsOnboardingComplete(false);
    }
  };

  const register = async (data: KayitDto, onboardingData?: any) => {
    const response = await authApi.kayitOl(data);
    const { kullanici, accessToken, refreshToken } = response.data;
    
    // Temporarily set tokens to make API calls
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);

    if (onboardingData) {
      try {
        await apiClient.post('/onboarding/kurulum-tamamla', {
          butceProfili: onboardingData.butceProfili,
          sabitIslemler: onboardingData.sabitIslemler
        });

        if (onboardingData.hedefler && onboardingData.hedefler.length > 0) {
          for (const hedef of onboardingData.hedefler) {
            try {
              const payload: any = {
                baslik: hedef.baslik,
                hedefMiktar: parseFloat(hedef.hedefMiktar),
                oncelik: hedef.oncelik,
                herkesGorsun: hedef.herkesGorsun,
                renk: hedef.renk,
                varlikSembol: hedef.varlikSembol,
                varlikAdet: hedef.varlikAdet ? parseFloat(hedef.varlikAdet) : undefined,
                varlikTip: hedef.varlikTip,
              };

              if (hedef.aciklama) payload.aciklama = hedef.aciklama;
              if (hedef.hedefTarihi) payload.hedefTarihi = hedef.hedefTarihi;

              await apiClient.post('/hedef', payload);
            } catch (hedefError) {
              console.log('Hedef kaydetme hatası:', hedefError);
            }
          }
        }
      } catch (err) {
        console.error('Onboarding verileri kaydedilemedi:', err);
      }
    }
    
    await AsyncStorage.setItem('user', JSON.stringify(kullanici));
    setUser(kullanici);
    saveWidgetData({});
    
    setIsOnboardingComplete(true);
    await AsyncStorage.setItem('onboardingComplete', 'true');
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('onboardingComplete');
      clearWidgetData();
    } catch (error) {
      console.log('AsyncStorage temizleme hatası:', error);
    }
    setUser(null);
    setIsOnboardingComplete(true);
  };

  const completeOnboarding = async () => {
    setIsOnboardingComplete(true);
    await AsyncStorage.setItem('onboardingComplete', 'true');
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOnboardingComplete,
        login,
        loginWithGoogle,
        register,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
