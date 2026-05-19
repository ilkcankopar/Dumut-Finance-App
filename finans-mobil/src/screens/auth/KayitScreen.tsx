import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Button, Input, Icon, AnimatedBox } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { KullaniciTipi } from '../../types';

interface Props {
  navigation?: any;
  route?: any;
}

export const KayitScreen = ({ navigation, route }: Props) => {
  const { kullaniciTipi } = route.params;
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    sifre: '',
    sifreTekrar: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ad.trim()) {
      newErrors.ad = 'Ad zorunludur';
    } else if (formData.ad.trim().length < 2) {
      newErrors.ad = 'Ad en az 2 karakter olmalı';
    }
    
    if (!formData.soyad.trim()) {
      newErrors.soyad = 'Soyad zorunludur';
    } else if (formData.soyad.trim().length < 2) {
      newErrors.soyad = 'Soyad en az 2 karakter olmalı';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz';
    }
    
    if (!formData.sifre) {
      newErrors.sifre = 'Şifre zorunludur';
    } else if (formData.sifre.length < 8) {
      newErrors.sifre = 'Şifre en az 8 karakter olmalı';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.sifre)) {
      newErrors.sifre = 'Büyük harf, küçük harf ve rakam içermeli';
    }
    
    if (!formData.sifreTekrar) {
      newErrors.sifreTekrar = 'Şifre tekrarı zorunludur';
    } else if (formData.sifre !== formData.sifreTekrar) {
      newErrors.sifreTekrar = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Toast.show({
        type: 'error',
        text1: 'Form Hatası',
        text2: 'Lütfen tüm alanları doğru şekilde doldurun',
      });
      return;
    }

    setLoading(true);
    try {
      const { kullaniciTipi, onboardingData } = route.params;
      await register({
        ...formData,
        kullaniciTipi,
        dilKodu: 'tr',
      }, onboardingData);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Hesabınız oluşturuldu',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kayıt sırasında bir hata oluştu';
      Toast.show({
        type: 'error',
        text1: 'Kayıt Başarısız',
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
              onPress={() => navigation.goBack()}
            >
              <Icon name="chevronLeft" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.header}
          >
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              Finansal yolculuğunuza başlamak için bilgilerinizi girin.
            </Text>
          </Animated.View>

          <AnimatedBox variant="elevated" delay={200} style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="AD"
                  placeholder="Adınız"
                  value={formData.ad}
                  onChangeText={(value) => updateField('ad', value)}
                  error={errors.ad}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="SOYAD"
                  placeholder="Soyadınız"
                  value={formData.soyad}
                  onChangeText={(value) => updateField('soyad', value)}
                  error={errors.soyad}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                  placeholder="En az 8 karakter"
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

            <Input
              label="ŞİFRE TEKRAR"
              placeholder="Şifrenizi tekrar girin"
              value={formData.sifreTekrar}
              onChangeText={(value) => updateField('sifreTekrar', value)}
              error={errors.sifreTekrar}
              secureTextEntry={!showPassword}
            />
          </AnimatedBox>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Button
              title="KAYIT OL"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(500).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Giris')}>
              <Text style={styles.footerLink}>Giriş Yap</Text>
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
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
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
  submitButton: {
    marginTop: spacing.md,
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
