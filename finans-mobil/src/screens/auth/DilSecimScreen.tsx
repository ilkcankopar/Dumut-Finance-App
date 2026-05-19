import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';
import { languages, changeLanguage, getCurrentLanguage } from '../../i18n';

const AppLogo = require('../../../app.png');

interface Props {
  navigation: any;
}

export const DilSecimScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState(getCurrentLanguage());

  const handleSelectLanguage = async (code: string) => {
    setSelectedLanguage(code);
    await changeLanguage(code);
  };

  const handleContinue = () => {
    navigation.navigate('KullaniciTipiSecim');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{t('onboarding.selectLanguage')}</Text>
        <Text style={styles.subtitle}>
          Uygulamayi hangi dilde kullanmak istiyorsunuz?
        </Text>
      </Animated.View>

      <View style={styles.languageList}>
        {languages.map((lang, index) => (
          <Animated.View
            key={lang.code}
            entering={FadeInDown.delay(100 + index * 80).duration(400)}
          >
            <TouchableOpacity
              style={[
                styles.languageItem,
                selectedLanguage === lang.code && styles.languageItemSelected,
              ]}
              onPress={() => handleSelectLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === lang.code && styles.languageNameSelected,
                  ]}
                >
                  {lang.name}
                </Text>
              </View>
              {selectedLanguage === lang.code && (
                <View style={styles.checkIcon}>
                  <Icon name="check" size={16} color={colors.background} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          <Icon name="chevronRight" size={18} color={colors.background} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.containerMargin,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
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
  languageList: {
    flex: 1,
    marginTop: spacing.lg,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  languageItemSelected: {
    borderColor: colors.onSurface,
    borderWidth: 2,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurface,
  },
  languageNameSelected: {
    fontFamily: 'Poppins_600SemiBold',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: spacing.lg,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onSurface,
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.background,
  },
});
