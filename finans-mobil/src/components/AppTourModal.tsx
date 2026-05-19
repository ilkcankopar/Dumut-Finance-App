import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing } from '../theme';
import { Icon } from './Icon';

const STEPS = [
  {
    title: 'Finans uygulamasına hoş geldin',
    body: 'Aşağıdaki sekmelerle bütçeni, işlemlerini ve raporlarını tek yerden yönetirsin. Kısaca nereye ne için gireceğini özetleyelim.',
    icon: 'home' as const,
  },
  {
    title: 'Pano',
    body: 'Özet; kalan bütçe, hedef yüzdeleri ve hızlı aksiyonlar burada. Üstteki arama ile işlem veya kategori tarayabilirsin.',
    icon: 'home' as const,
  },
  {
    title: 'İşlem',
    body: 'Gelir ve gider ekleyebilir, kategori seçebilirsin. Geçmiş işlemler için Panodaki Geçmiş kartına veya Profil menüsünden eriş.',
    icon: 'plus' as const,
  },
  {
    title: 'Asistan',
    body: 'Sesli komutla hızlı işlem akışı burada. Mikrofon üzerinden kayıt eklemeyi kolaylaştırmak için kullanılır.',
    icon: 'microphone' as const,
  },
  {
    title: 'Raporlar ve Profil',
    body: 'Raporlar sekmesinde grafikler ve PDF dışa aktarma var. Profilde kategori yönetimi, hedefler ve akıllı önerilere ulaşırsın.',
    icon: 'chartPie' as const,
  },
];

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export const AppTourModal: React.FC<Props> = ({ visible, onComplete }) => {
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setStep(0);
      onComplete();
    }
  };

  const handleSkip = () => {
    setStep(0);
    onComplete();
  };

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { maxWidth: Math.min(width - spacing.containerMargin * 2, 400) }]}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.iconWrap}>
            <Icon name={current.icon} size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          <View style={styles.stepDots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Atla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.85}>
              <Text style={styles.nextText}>
                {step === STEPS.length - 1 ? 'Başla' : 'İleri'}
              </Text>
              <Icon name="chevronRight" size={16} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 30, 61, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.containerMargin,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outline,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  nextText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onPrimary,
  },
});
