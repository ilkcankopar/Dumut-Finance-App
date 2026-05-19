import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Button, Input, AnimatedBox } from '../../components';

interface Props {
  navigation: any;
  route: {
    params?: {
      sabitIslemler?: any[];
      tahminiGelir?: number;
      sorular?: any[];
      kullaniciTipi?: string;
    };
  };
}

export const ButceHedefScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sabitIslemler = [], tahminiGelir = 0, sorular = [], kullaniciTipi = 'BUSINESS' } = route.params || {};

  // Sabit giderleri hesapla
  const sabitGiderler = sabitIslemler
    .filter((i: any) => i.tip === 'GIDER')
    .reduce((acc: number, i: any) => acc + parseFloat(i.miktar || '0'), 0);

  // Önerilen harcama = Gelir - Sabit Giderler
  const oneriHarcama = Math.max(tahminiGelir - sabitGiderler, 0);

  const [formData, setFormData] = useState({
    aylikGelir: tahminiGelir > 0 ? tahminiGelir.toString() : '',
    aylikHarcamaHedefi: oneriHarcama > 0 ? oneriHarcama.toString() : '',
  });

  const getKategoriler = () => {
    if (kullaniciTipi === 'OGRENCI') return [
      { id: 'k1', ad: 'Eğitim', yuzde: 15 }, 
      { id: 'k2', ad: 'Ulaşım', yuzde: 10 }, 
      { id: 'k3', ad: 'Yurt/Kira', yuzde: 40 }, 
      { id: 'k4', ad: 'Yemek', yuzde: 25 },
      { id: 'k5', ad: 'Eğlence', yuzde: 10 }
    ];
    if (kullaniciTipi === 'GIRISIMCI') return [
      { id: 'k1', ad: 'Yazılım', yuzde: 20 }, 
      { id: 'k2', ad: 'Pazarlama', yuzde: 30 }, 
      { id: 'k3', ad: 'Ofis', yuzde: 20 }, 
      { id: 'k4', ad: 'Vergi', yuzde: 30 }
    ];
    return [
      { id: 'k1', ad: 'Market', yuzde: 30 }, 
      { id: 'k2', ad: 'Kira/Fatura', yuzde: 40 }, 
      { id: 'k3', ad: 'Ulaşım', yuzde: 15 },
      { id: 'k4', ad: 'Diğer', yuzde: 15 }
    ];
  };

  const [kategoriLimitleri, setKategoriLimitleri] = useState<Record<string, string>>({});
  const [ozelKategoriler, setOzelKategoriler] = useState<{ id: string; ad: string }[]>([]);
  const [yeniKategoriAdi, setYeniKategoriAdi] = useState('');
  const [kategoriModalVisible, setKategoriModalVisible] = useState(false);

  const tumKategoriler = [...getKategoriler(), ...ozelKategoriler.map(k => ({ ...k, yuzde: 0 }))];

  const toplamKategoriLimiti = Object.values(kategoriLimitleri)
    .reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

  const handleKategoriEkle = () => {
    if (!yeniKategoriAdi.trim()) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Kategori adı giriniz' });
      return;
    }
    if (tumKategoriler.some(k => k.ad.toLowerCase() === yeniKategoriAdi.toLowerCase())) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Bu kategori zaten mevcut' });
      return;
    }
    setOzelKategoriler(prev => [...prev, { id: `ozel_${Date.now()}`, ad: yeniKategoriAdi.trim() }]);
    setYeniKategoriAdi('');
    setKategoriModalVisible(false);
    Toast.show({ type: 'success', text1: 'Eklendi', text2: `${yeniKategoriAdi} kategorisi eklendi` });
  };

  const handleKategoriSil = (kategoriAd: string) => {
    setOzelKategoriler(prev => prev.filter(k => k.ad !== kategoriAd));
    setKategoriLimitleri(prev => {
      const yeni = { ...prev };
      delete yeni[kategoriAd];
      return yeni;
    });
  };

  const gelir = parseFloat(formData.aylikGelir) || 0;
  const netKalan = gelir - sabitGiderler - toplamKategoriLimiti;

  const handleContinue = () => {
    const hedef = parseFloat(formData.aylikHarcamaHedefi) || 0;

    const limitlerData = tumKategoriler.map(k => ({
      ad: k.ad,
      limit: parseFloat(kategoriLimitleri[k.ad]) || 0
    })).filter(k => k.limit > 0);

    const ozelKategoriData = ozelKategoriler.map(k => ({
      ad: k.ad,
      tip: 'GIDER',
      renk: '#9E9E9E',
      ikon: 'wallet'
    }));

    if (netKalan <= 0) {
      Toast.show({
        type: 'warning',
        text1: 'Dikkat!',
        text2: 'Sabit giderleriniz gelirinizden fazla. Bu ay tasarruf yapamıyorsunuz.',
      });
    }

    navigation.navigate('HedefEkle', {
      kullaniciTipi,
      sabitIslemler,
      butceProfili: {
        aylikToplamGelir: gelir,
        aylikHedefHarcama: hedef,
        kategoriLimitleri: limitlerData,
        ozelKategoriler: ozelKategoriData
      },
    });
  };

  const handleSkip = () => {
    navigation.navigate('HedefEkle', {
      kullaniciTipi,
      sabitIslemler,
      butceProfili: null,
    });
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={styles.progressStep} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.stepLabel}>ADIM 2/3</Text>
          <Text style={styles.title}>Bütçe Hedefleriniz</Text>
          <Text style={styles.subtitle}>
          {sabitGiderler > 0 ? `Sabit giderleriniz ₺${sabitGiderler.toLocaleString('tr-TR')} olarak hesaplandı. Dışarıda harcayabileceğiniz para:` : 'Aylık gelirinizi ve harcama hedefinizi belirleyin.'}
          </Text>
          </Animated.View>

          <AnimatedBox variant="elevated" delay={100} style={styles.formCard}>
            <Input
              label="AYLIK TOPLAM GELİR"
              placeholder="0"
              prefix="₺"
              value={formData.aylikGelir}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, aylikGelir: value }))}
              keyboardType="decimal-pad"
            />

            {tahminiGelir > 0 && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  Sabit gelirlerinizden ₺{tahminiGelir.toLocaleString('tr-TR')} hesaplandı
                </Text>
              </View>
            )}

            <Input
              label="AYLIK HARCAMA HEDEFİ"
              placeholder="0"
              prefix="₺"
              value={formData.aylikHarcamaHedefi}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, aylikHarcamaHedefi: value }))
              }
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.helperText}>
              Yeme, içme, market, ulaşım gibi dışarıda harcadığın para
            </Text>

          </AnimatedBox>

          {/* Kategori Bütçe Sınırları - Ayrı Bölüm */}
          <View style={styles.kategoriSection}>
            <View style={styles.kategoriHeader}>
              <View>
                <Text style={styles.kategoriTitle}>Kategori Bütçe Sınırları</Text>
                <Text style={styles.kategoriSubtitle}>İsteğe bağlı - Her kategoriye limit koy</Text>
              </View>
              <TouchableOpacity 
                style={styles.kategoriEkleBtn}
                onPress={() => setKategoriModalVisible(true)}
              >
                <Text style={styles.kategoriEkleBtnText}>+ Yeni</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.kategoriList}>
              {tumKategoriler.map((kat, index) => {
                const tavsiyeEdilenTutar = gelir > 0 && kat.yuzde > 0 ? (gelir * kat.yuzde) / 100 : 0;
                const isOzel = ozelKategoriler.some(k => k.ad === kat.ad);
                const limitDeger = kategoriLimitleri[kat.ad] || '';
                
                return (
                  <Animated.View 
                    key={kat.id} 
                    entering={FadeInDown.delay(index * 50).duration(300)}
                    style={styles.kategoriItem}
                  >
                    <View style={styles.kategoriItemHeader}>
                      <Text style={styles.kategoriItemAd}>{kat.ad}</Text>
                      {isOzel && (
                        <TouchableOpacity 
                          onPress={() => handleKategoriSil(kat.ad)}
                          style={styles.kategoriSilBtn}
                        >
                          <Text style={styles.kategoriSilBtnText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.kategoriInputRow}>
                      <Text style={styles.kategoriPrefix}>₺</Text>
                      <TextInput
                        style={styles.kategoriInput}
                        placeholder="Limit belirle"
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={limitDeger}
                        onChangeText={(val) => setKategoriLimitleri(prev => ({ ...prev, [kat.ad]: val }))}
                        keyboardType="decimal-pad"
                      />
                      {tavsiyeEdilenTutar > 0 && (
                        <TouchableOpacity 
                          style={styles.tavsiyeBtn}
                          onPress={() => setKategoriLimitleri(prev => ({ 
                            ...prev, 
                            [kat.ad]: Math.round(tavsiyeEdilenTutar).toString() 
                          }))}
                        >
                          <Text style={styles.tavsiyeBtnText}>
                            Tavsiye: ₺{Math.round(tavsiyeEdilenTutar).toLocaleString('tr-TR')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            {toplamKategoriLimiti > 0 && (
              <View style={styles.kategoriToplam}>
                <Text style={styles.kategoriToplamLabel}>Toplam Limit:</Text>
                <Text style={styles.kategoriToplamDeger}>₺{toplamKategoriLimiti.toLocaleString('tr-TR')}</Text>
              </View>
            )}
          </View>

          {/* Yeni Kategori Modal */}
          <Modal
            visible={kategoriModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setKategoriModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View entering={FadeIn.duration(200)} style={styles.modalContent}>
                <Text style={styles.modalTitle}>Yeni Kategori Ekle</Text>
                <Text style={styles.modalSubtitle}>Kendi harcama kategorini oluştur</Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Kategori adı (örn: Hobi, Spor)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={yeniKategoriAdi}
                  onChangeText={setYeniKategoriAdi}
                  autoFocus
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      setKategoriModalVisible(false);
                      setYeniKategoriAdi('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalAddBtn}
                    onPress={handleKategoriEkle}
                  >
                    <Text style={styles.modalAddText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>

          {gelir > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Net Kalan</Text>
            <Text style={[styles.summaryValue, { color: netKalan >= 0 ? '#4a4a4a' : colors.error }]}>
              ₺{netKalan.toLocaleString('tr-TR')}
            </Text>
            
            <View style={styles.summaryDetails}>
              <View style={styles.summaryDetailItem}>
                <Text style={[styles.summaryDetailText, { color: '#4a4a4a' }]}>
                  + ₺{gelir.toLocaleString('tr-TR')} gelir
                </Text>
              </View>
              <View style={styles.summaryDetailItem}>
                <Text style={[styles.summaryDetailText, { color: colors.error }]}>
                  - ₺{sabitGiderler.toLocaleString('tr-TR')} sabit
                </Text>
              </View>
              {toplamKategoriLimiti > 0 && (
              <View style={styles.summaryDetailItem}>
                <Text style={[styles.summaryDetailText, { color: colors.secondary }]}>
                  - ₺{toplamKategoriLimiti.toLocaleString('tr-TR')} limit
                </Text>
              </View>
              )}
            </View>
            
            {netKalan <= 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Giderleriniz gelirinizi aşıyor!
              </Text>
            </View>
            )}
          </View>
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
  backButton: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
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
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  hintBox: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  hintText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  helperText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: -spacing.sm,
  },
  
  // Kategori Bölümü Stilleri
  kategoriSection: {
    marginBottom: spacing.lg,
  },
  kategoriHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  kategoriTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  kategoriSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  kategoriEkleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  kategoriEkleBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.onPrimary,
  },
  kategoriList: {
    gap: spacing.sm,
  },
  kategoriItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kategoriItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  kategoriItemAd: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  kategoriSilBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kategoriSilBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.error,
    marginTop: -2,
  },
  kategoriInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kategoriPrefix: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  kategoriInput: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tavsiyeBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tavsiyeBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#1a1a1a',
  },
  kategoriToplam: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  kategoriToplamLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  kategoriToplamDeger: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.primary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    marginBottom: spacing.md,
  },
  summaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  summaryDetailItem: {
  },
  summaryDetailText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  warningBox: {
    backgroundColor: '#f0f0f0',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  warningText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },

  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalAddText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onPrimary,
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
