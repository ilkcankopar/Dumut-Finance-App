import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Button, Input, AnimatedBox, SegmentedControl } from '../../components';
import { Periyot, IslemTipi } from '../../types';
import apiClient from '../../api/client';

interface SabitIslem {
  id: string;
  baslik: string;
  miktar: string;
  tip: IslemTipi;
  periyot: Periyot;
  odemeGunu: string;
}

interface Props {
  navigation: any;
  route: {
    params?: {
      kullaniciTipi?: string;
    };
  };
}

export const SabitGelirGiderScreen: React.FC<Props> = ({ navigation, route }) => {
  const [sabitIslemler, setSabitIslemler] = useState<SabitIslem[]>([]);
  const [formData, setFormData] = useState({
    baslik: '',
    miktar: '',
    tip: 'GELIR' as IslemTipi,
    periyot: 'AYLIK' as Periyot,
    odemeGunu: '1',
  });
  const [loading, setLoading] = useState(true);
  const [popularAbonelikler, setPopularAbonelikler] = useState<{baslik: string}[]>([]);
  const [popularGiderler, setPopularGiderler] = useState<{baslik: string}[]>([]);
  const [sorular, setSorular] = useState<any[]>([]);

  const [selectedAbonelik, setSelectedAbonelik] = useState<{baslik: string} | null>(null);
  const [abonelikMiktar, setAbonelikMiktar] = useState('');

  useEffect(() => {
    fetchKurulumVerileri();
  }, []);

  const fetchKurulumVerileri = async () => {
    try {
      const response = await apiClient.get(`/onboarding/kurulum-verileri?tip=${route.params?.kullaniciTipi || 'BUSINESS'}`);
      if (response.data.success) {
        setPopularAbonelikler(response.data.data.popularGelirler || []);
        setPopularGiderler(response.data.data.popularGiderler || []);
        setSorular(response.data.data.sorular || []);
      }
    } catch (error) {
      console.log('Kurulum verileri cekilemedi', error);
    } finally {
      setLoading(false);
    }
  };

  const tipOptions = [
    { value: 'GELIR', label: 'GELİR' },
    { value: 'GIDER', label: 'GİDER' },
  ];

  const periyotOptions = [
    { value: 'HAFTALIK', label: 'HAFTALIK' },
    { value: 'AYLIK', label: 'AYLIK' },
    { value: 'YILLIK', label: 'YILLIK' },
  ];

  const addSabitIslem = () => {
    if (!formData.baslik.trim() || !formData.miktar) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen isim ve miktar giriniz',
      });
      return;
    }

    const yeniIslem: SabitIslem = {
      id: Date.now().toString(),
      baslik: formData.baslik,
      miktar: formData.miktar,
      tip: formData.tip,
      periyot: formData.periyot,
      odemeGunu: formData.odemeGunu || '1',
    };

    setSabitIslemler([...sabitIslemler, yeniIslem]);
    setFormData({
      baslik: '',
      miktar: '',
      tip: 'GELIR',
      periyot: 'AYLIK',
      odemeGunu: '1',
    });

    Toast.show({
      type: 'success',
      text1: 'Eklendi',
      text2: `${yeniIslem.baslik} listeye eklendi`,
    });
  };

  const selectAbonelik = (abonelik: typeof popularAbonelikler[0]) => {
    setSelectedAbonelik(abonelik);
    setAbonelikMiktar('');
  };

  const addAbonelik = () => {
    if (!selectedAbonelik) return;
    
    if (!abonelikMiktar || parseFloat(abonelikMiktar) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen miktar giriniz',
      });
      return;
    }

    const yeniIslem: SabitIslem = {
      id: Date.now().toString(),
      baslik: selectedAbonelik.baslik,
      miktar: abonelikMiktar,
      tip: 'GELIR',
      periyot: 'AYLIK',
      odemeGunu: '1',
    };

    setSabitIslemler([...sabitIslemler, yeniIslem]);
    Toast.show({
      type: 'success',
      text1: 'Eklendi',
      text2: `${selectedAbonelik.baslik} geliri eklendi`,
    });
    setSelectedAbonelik(null);
    setAbonelikMiktar('');
  };

  const removeSabitIslem = (id: string) => {
    setSabitIslemler(sabitIslemler.filter((i) => i.id !== id));
  };

  const handleContinue = () => {
    const toplamGelir = sabitIslemler
      .filter((i) => i.tip === 'GELIR')
      .reduce((acc, i) => acc + parseFloat(i.miktar || '0'), 0);

    navigation.navigate('ButceHedef', { 
      sabitIslemler,
      tahminiGelir: toplamGelir,
      sorular,
      kullaniciTipi: route.params?.kullaniciTipi || 'BUSINESS',
    });
  };

  const handleSkip = () => {
    navigation.navigate('ButceHedef', { 
      sabitIslemler: [],
      tahminiGelir: 0,
      sorular,
      kullaniciTipi: route.params?.kullaniciTipi || 'BUSINESS',
    });
  };

  const formatCurrency = (value: string) => {
    return `₺${parseFloat(value).toLocaleString('tr-TR')}`;
  };

  const toplamGelir = sabitIslemler
    .filter((i) => i.tip === 'GELIR')
    .reduce((acc, i) => acc + parseFloat(i.miktar || '0'), 0);

  const toplamGider = sabitIslemler
    .filter((i) => i.tip === 'GIDER')
    .reduce((acc, i) => acc + parseFloat(i.miktar || '0'), 0);

  const getPeriyotLabel = (periyot: Periyot) => {
    switch (periyot) {
      case 'HAFTALIK': return 'Haftalık';
      case 'AYLIK': return 'Aylık';
      case 'YILLIK': return 'Yıllık';
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
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Text style={styles.stepLabel}>ADIM 1/3</Text>
            <Text style={styles.title}>Sabit Gelir ve Giderler</Text>
            <Text style={styles.subtitle}>
              Düzenli olarak aldığınız maaş, kira, fatura gibi sabit gelir ve giderlerinizi ekleyin.
            </Text>
          </Animated.View>

          {/* Popüler Gelirler */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Popüler Gelirler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
          {popularAbonelikler
          .filter((a) => !sabitIslemler.some((i) => i.baslik === a.baslik))
          .map((abonelik) => (
          <TouchableOpacity
          key={abonelik.baslik}
          style={[
          styles.abonelikCard,
          selectedAbonelik?.baslik === abonelik.baslik && styles.abonelikCardSelected,
          ]}
          onPress={() => selectAbonelik(abonelik)}
          activeOpacity={0.7}
          >
          <Text style={[styles.abonelikBaslik, selectedAbonelik?.baslik === abonelik.baslik && styles.abonelikBaslikSelected]}>{abonelik.baslik}</Text>
          </TouchableOpacity>
          ))}
          </ScrollView>

            {selectedAbonelik && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.abonelikMiktarContainer}>
            <Text style={styles.abonelikMiktarLabel}>
            {selectedAbonelik.baslik} Geliri
            </Text>
            <Text style={styles.abonelikMiktarSubtext}>Aylık tutarı giriniz</Text>
            <View style={styles.abonelikMiktarRow}>
            <View style={styles.abonelikMiktarInput}>
            <Text style={styles.inputPrefix}>₺</Text>
            <TextInput
            style={styles.miktarInput}
            placeholder="0"
            placeholderTextColor={colors.onSurfaceVariant}
            value={abonelikMiktar}
            onChangeText={setAbonelikMiktar}
            keyboardType="decimal-pad"
            />
            </View>
            <TouchableOpacity style={styles.abonelikEkleButton} onPress={addAbonelik}>
            <Text style={styles.abonelikEkleBtnText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.abonelikIptalButton} onPress={() => setSelectedAbonelik(null)}>
            <Text style={styles.abonelikIptalBtnText}>×</Text>
            </TouchableOpacity>
            </View>
            </Animated.View>
            )}
            </Animated.View>

          {/* Popüler Sabit Giderler */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Sabit Giderler</Text>
          <View style={styles.giderGrid}>
          {popularGiderler
          .filter((g) => !sabitIslemler.some((i) => i.baslik === g.baslik))
          .map((gider) => (
          <TouchableOpacity
          key={gider.baslik}
          style={styles.giderCard}
          onPress={() => {
          setFormData(prev => ({ ...prev, baslik: gider.baslik, tip: 'GIDER' }));
          }}
          activeOpacity={0.7}
          >
          <Text style={styles.giderBaslik}>{gider.baslik}</Text>
          </TouchableOpacity>
          ))}
          </View>
          </Animated.View>

          {/* Manuel Ekleme Formu */}
          <AnimatedBox variant="elevated" delay={100} style={styles.formCard}>
            <Text style={styles.formTitle}>Manuel Ekle</Text>
            
            <Input
              label="İSİM"
              placeholder="örn. Maaş, Kira, Abonelik"
              value={formData.baslik}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, baslik: value }))}
            />

            <Input
              label="MİKTAR"
              placeholder="0"
              prefix="₺"
              value={formData.miktar}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, miktar: value }))}
              keyboardType="decimal-pad"
            />

            <Input
              label="ÖDEME GÜNÜ (1-31)"
              placeholder="Örn: 15"
              value={formData.odemeGunu}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, odemeGunu: value }))}
              keyboardType="number-pad"
              maxLength={2}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TÜR</Text>
              <SegmentedControl
                options={tipOptions}
                selectedValue={formData.tip}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tip: value as IslemTipi }))}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PERİYOT</Text>
              <SegmentedControl
                options={periyotOptions}
                selectedValue={formData.periyot}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, periyot: value as Periyot }))}
              />
            </View>

            <Button title="EKLE" onPress={addSabitIslem} variant="secondary" fullWidth />
          </AnimatedBox>

          {sabitIslemler.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
          <Text style={styles.listSectionTitle}>Eklenen İşlemler</Text>
          
          {/* Özet Kartı */}
          <View style={styles.summaryCard}>
          <View style={styles.summaryValuesRow}>
          <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.success }]}>Gelir</Text>
          <Text style={[styles.summaryValue, styles.summaryGelir]}>
          +₺{toplamGelir.toLocaleString('tr-TR')}
          </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.error }]}>Gider</Text>
          <Text style={[styles.summaryValue, styles.summaryGider]}>
          -₺{toplamGider.toLocaleString('tr-TR')}
          </Text>
          </View>
          </View>
          </View>
          
          {sabitIslemler.map((islem, index) => (
          <Animated.View
          key={islem.id}
          entering={FadeInDown.delay(index * 50).duration(300)}
          style={styles.islemItem}
          >
          <View style={styles.islemLeft}>
          <View
          style={[
          styles.islemIndicator,
          { backgroundColor: islem.tip === 'GELIR' ? colors.success : colors.error },
          ]}
          />
          <View>
          <Text style={styles.islemBaslik}>{islem.baslik}</Text>
          <Text style={styles.islemPeriyot}>{getPeriyotLabel(islem.periyot)} • Ayın {islem.odemeGunu}. günü</Text>
          </View>
          </View>
          <View style={styles.islemRight}>
          <Text
          style={[
          styles.islemMiktar,
          islem.tip === 'GELIR' ? styles.miktarGelir : styles.miktarGider,
          ]}
          >
          {islem.tip === 'GELIR' ? '+' : '-'}
          {formatCurrency(islem.miktar)}
          </Text>
          <TouchableOpacity
          onPress={() => removeSabitIslem(islem.id)}
          style={styles.removeButton}
          >
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.error }}>×</Text>
          </TouchableOpacity>
          </View>
          </Animated.View>
          ))}
          </Animated.View>
          )}

          <View style={styles.bottomActions}>
            <Button
              title="DEVAM ET"
              onPress={handleContinue}
              fullWidth
            />
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Şimdilik Atla</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: spacing.xxl,
  },
  progressBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  progressStep: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surfaceContainerHigh,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  header: {
    marginBottom: spacing.lg,
  },
  stepLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  horizontalScroll: {
  marginHorizontal: -spacing.containerMargin,
  paddingHorizontal: spacing.containerMargin,
  },
  horizontalScrollContent: {
  paddingRight: spacing.containerMargin,
  },
  abonelikCard: {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderWidth: 1.5,
  borderColor: colors.borderLight,
  borderRadius: 20,
  marginRight: spacing.sm,
  alignItems: 'center',
  },
  abonelikBaslik: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 11,
  color: colors.onSurface,
  textAlign: 'center',
  },
  abonelikBaslikSelected: {
  color: colors.primary,
  },
  abonelikCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryContainer,
  },
  abonelikMiktarContainer: {
  marginTop: spacing.md,
  padding: spacing.lg,
  borderWidth: 1.5,
  borderColor: colors.primary,
  backgroundColor: colors.surface,
  borderRadius: 12,
  },
  abonelikMiktarLabel: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 16,
  color: colors.onSurface,
  marginBottom: spacing.xs,
  },
  abonelikMiktarSubtext: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 12,
  color: colors.onSurfaceVariant,
  marginBottom: spacing.md,
  },
  abonelikMiktarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  abonelikMiktarInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginRight: spacing.xs,
  },
  miktarInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: spacing.sm,
  },
  abonelikEkleButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abonelikEkleBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onPrimary,
  },
  abonelikIptalButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abonelikIptalBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.error,
  },
  giderGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  },
  giderCard: {
  width: '31%',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  borderWidth: 1.5,
  borderColor: colors.borderLight,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  },
  giderBaslik: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 12,
  color: colors.onSurface,
  textAlign: 'center',
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  listSection: {
  marginTop: spacing.md,
  },
  listSectionTitle: {
  fontFamily: 'Poppins_600SemiBold',
  fontSize: 16,
  color: colors.onSurface,
  marginBottom: spacing.md,
  },
  summaryCard: {
  backgroundColor: colors.surfaceContainerHigh,
  padding: spacing.lg,
  borderRadius: 12,
  marginBottom: spacing.md,
  },
  summaryItem: {
  flex: 1,
  alignItems: 'center',
  },
  summaryLabel: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 12,
  marginBottom: 4,
  },
  summaryValuesRow: {
  flexDirection: 'row',
  alignItems: 'center',
  },
  summaryDivider: {
  width: 1,
  height: 40,
  backgroundColor: colors.borderLight,
  marginHorizontal: spacing.md,
  },
  summaryValue: {
  fontFamily: 'Poppins_700Bold',
  fontSize: 18,
  },
  summaryGelir: {
  color: colors.success,
  },
  summaryGider: {
  color: colors.error,
  },
  islemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  islemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  islemIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  islemBaslik: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  islemPeriyot: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  islemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  islemMiktar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  miktarGelir: {
    color: colors.success,
  },
  miktarGider: {
    color: colors.error,
  },
  removeButton: {
    padding: spacing.xs,
  },
  bottomActions: {
    marginTop: spacing.xl,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});
