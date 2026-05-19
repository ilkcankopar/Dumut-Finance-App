import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing } from '../../theme';
import { Button, Input, Icon, AnimatedBox } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config';

WebBrowser.maybeCompleteAuthSession();

const AppLogo = require('../../../app.png');

interface Props {
  navigation: any;
}

export const GirisScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    sifre: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: config.googleClientId,
    iosClientId: config.googleIosClientId,
    androidClientId: config.googleAndroidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.params.id_token);
    } else if (response?.type === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Google Giriş Hatası',
        text2: 'Bir sorun oluştu, tekrar deneyin',
      });
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle({ idToken });
      Toast.show({
        type: 'success',
        text1: 'Giriş Başarılı',
        text2: 'Google ile giriş yapıldı!',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google ile giriş başarısız';
      Toast.show({
        type: 'error',
        text1: 'Giriş Başarısız',
        text2: message,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Google Giriş Hatası',
        text2: 'Bir sorun oluştu',
      });
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz';
    }
    
    if (!formData.sifre) {
      newErrors.sifre = 'Şifre zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Toast.show({
        type: 'error',
        text1: 'Form Hatası',
        text2: 'Lütfen e-posta ve şifrenizi girin',
      });
      return;
    }

    setLoading(true);
    try {
      await login(formData);
      Toast.show({
        type: 'success',
        text1: 'Giriş Başarılı',
        text2: 'Hoş geldiniz!',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'E-posta veya şifre hatalı';
      Toast.show({
        type: 'error',
        text1: 'Giriş Başarısız',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInLeft.duration(300)}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('KullaniciTipiSecim')}
            >
              <Icon name="chevronLeft" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.header}
          >
            <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Tekrar Hoş Geldiniz</Text>
            <Text style={styles.subtitle}>
              Hesabınıza giriş yaparak devam edin.
            </Text>
          </Animated.View>

          <AnimatedBox variant="elevated" delay={200} style={styles.formCard}>
            <Input
              label="E-POSTA"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value.toLowerCase())}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordRow}>
              <View style={styles.passwordInput}>
                <Input
                  label="ŞİFRE"
                  placeholder="Şifrenizi girin"
                  value={formData.sifre}
                  onChangeText={(value) => updateField('sifre', value)}
                  error={errors.sifre}
                  secureTextEntry={!showPassword}
                />
              </View>
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? 'eyeSlash' : 'eye'} 
                  size={18} 
                  color={colors.onSurfaceVariant} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
            </TouchableOpacity>
          </AnimatedBox>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Button
              title="GİRİŞ YAP"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || !request}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.onSurface} />
              ) : (
                <>
                  <Icon name="google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Google ile Giriş</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('KullaniciTipiSecim')}>
              <Text style={styles.footerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outline,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  googleButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    textDecorationLine: 'underline',
  },
});
