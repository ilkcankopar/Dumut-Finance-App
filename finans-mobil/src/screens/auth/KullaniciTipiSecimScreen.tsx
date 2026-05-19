import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors, spacing } from '../../theme';
import { Icon, AnimatedBox } from '../../components';
import { KullaniciTipi } from '../../types';

const AppLogo = require('../../../app.png');

interface KullaniciTipiOption {
  value: KullaniciTipi;
  baslik: string;
  aciklama: string;
  icon: 'graduationCap' | 'lightbulb' | 'briefcase';
}

const kullaniciTipleri: KullaniciTipiOption[] = [
  {
    value: 'OGRENCI',
    baslik: 'Öğrenci',
    aciklama: 'Harçlık yönetimi, yarı zamanlı gelir ve eğitim masraflarının net takibi.',
    icon: 'graduationCap',
  },
  {
    value: 'GIRISIMCI',
    baslik: 'Girişimci',
    aciklama: 'Düzensiz gelir akışları, erken aşama yatırımlar ve büyüme metriklerine odaklanma.',
    icon: 'lightbulb',
  },
  {
    value: 'BUSINESS',
    baslik: 'Çalışan',
    aciklama: 'Maaş yönetimi, düzenli gelir akışı, aylık birikim ve kişisel harcama takibi.',
    icon: 'briefcase',
  },
];

interface Props {
  navigation: any;
}

export const KullaniciTipiSecimScreen: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState<KullaniciTipi | null>(null);

  const handleContinue = () => {
    if (selected) {
      navigation.navigate('SabitGelirGider', { kullaniciTipi: selected });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Yolunuzu Seçin</Text>
          <Text style={styles.subtitle}>
            Finansal odağınıza en uygun profili seçin. Bu, veri yoğunluğunu ve araçları ihtiyaçlarınıza göre özelleştirmemize yardımcı olur.
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {kullaniciTipleri.map((tip, index) => (
            <AnimatedBox
              key={tip.value}
              variant={selected === tip.value ? 'featured' : 'outlined'}
              delay={100 + index * 100}
              onPress={() => setSelected(tip.value)}
              selected={selected === tip.value}
              style={styles.optionCard}
            >
              <View style={styles.iconContainer}>
                <Icon 
                  name={tip.icon} 
                  size={26} 
                  color={selected === tip.value ? colors.primary : colors.onSurfaceVariant} 
                />
              </View>
              <Text style={[
                styles.optionTitle,
                selected === tip.value && styles.optionTitleSelected
              ]}>
                {tip.baslik}
              </Text>
              <Text style={styles.optionDescription}>{tip.aciklama}</Text>
            </AnimatedBox>
          ))}
        </View>

        {selected && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.bottomActions}
          >
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>DEVAM ET</Text>
              <Icon name="chevronRight" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeIn.delay(600).duration(500)}
          style={styles.loginPrompt}
        >
          <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Giris')}>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingTop: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionCard: {
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  bottomActions: {
    marginTop: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  loginText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  loginLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    textDecorationLine: 'underline',
  },
});
