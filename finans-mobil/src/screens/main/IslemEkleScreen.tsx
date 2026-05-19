import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Button, Icon } from '../../components';
import { apiClient } from '../../api/client';
import { IslemTipi, Periyot } from '../../types';
import { IconName } from '../../components/Icon';

const AppLogo = require('../../../app.png');

interface Kategori {
  id: string;
  ad: string;
  tip: string;
  ikon: string;
  renk: string;
  sistemKategorisi: boolean;
}

interface Props {
  navigation: any;
  route?: {
    params?: {
      tip?: IslemTipi;
      sabitMi?: boolean;
    };
  };
}

export const IslemEkleScreen: React.FC<Props> = ({ navigation, route }) => {
  const gelenTip = route?.params?.tip as IslemTipi | undefined;
  const gelenSabit = route?.params?.sabitMi !== undefined ? route.params.sabitMi : true;
  
  const [isSabit, setIsSabit] = useState<boolean>(gelenSabit);
  const [formData, setFormData] = useState({
    baslik: '',
    miktar: '',
    tip: gelenTip || 'GIDER' as IslemTipi,
    periyot: 'AYLIK' as Periyot,
    kategoriId: '',
    odemeGunu: 0 as number,
    fisUrl: '',
    ocrText: '',
    enlem: undefined as number | undefined,
    boylam: undefined as number | undefined,
    konumAd: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loadingKategoriler, setLoadingKategoriler] = useState(true);
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<Kategori | null>(null);

  useEffect(() => {
    fetchKategoriler();
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      let konumAd = undefined;
      if (geocode && geocode.length > 0) {
        // e.g. "Kadıköy" or "Beşiktaş" or city
        konumAd = geocode[0].subregion || geocode[0].city || geocode[0].region || undefined;
      }

      setFormData(prev => ({
        ...prev,
        enlem: location.coords.latitude,
        boylam: location.coords.longitude,
        konumAd
      }));
      
      console.log('📍 [Harita] GPS Konumu Alındı:', {
        enlem: location.coords.latitude,
        boylam: location.coords.longitude,
        konumAd: konumAd || 'Adres Çözümlenemedi'
      });
    } catch (error) {
      console.log('Location fetch error:', error);
    }
  };

  useEffect(() => {
    if (route?.params?.tip) {
      setFormData(prev => ({ ...prev, tip: route.params!.tip as IslemTipi }));
    }
    if (route?.params?.sabitMi !== undefined) {
      setIsSabit(route.params.sabitMi);
    }
  }, [route?.params]);

  const fetchKategoriler = async () => {
    setLoadingKategoriler(true);
    try {
      const response = await apiClient.get('/kategori');
      if (response.data?.data) {
        setKategoriler(response.data.data);
      }
    } catch (error: any) {
      console.log('Kategoriler yüklenemedi:', error.response?.data || error.message);
    } finally {
      setLoadingKategoriler(false);
    }
  };

  const navigateToBildirimler = () => {
    navigation.navigate('Bildirimler');
  };

  const handleKategoriSelect = (kategori: Kategori) => {
    setSelectedKategori(kategori);
    setFormData(prev => ({ ...prev, kategoriId: kategori.id }));
    setShowKategoriModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.baslik.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'İşlem adı girin',
      });
      return;
    }

    if (!formData.miktar || parseFloat(formData.miktar) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Geçerli bir miktar girin',
      });
      return;
    }

    if (!formData.kategoriId) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Kategori seçin',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        baslik: formData.baslik.trim(),
        miktar: parseFloat(formData.miktar),
        tip: formData.tip,
        kategoriId: formData.kategoriId,
        periyot: isSabit ? formData.periyot : 'AYLIK',
        sabitMi: isSabit,
        tarih: new Date().toISOString(),
        ...(formData.fisUrl && { fisUrl: formData.fisUrl }),
        ...(formData.ocrText && { ocrText: formData.ocrText }),
        ...(formData.enlem !== undefined && { enlem: formData.enlem }),
        ...(formData.boylam !== undefined && { boylam: formData.boylam }),
        ...(formData.konumAd && { konumAd: formData.konumAd }),
      };
      if (isSabit && formData.odemeGunu > 0) {
        payload.odemeGunu = formData.odemeGunu;
      }
      
      await apiClient.post('/islem', payload);

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'İşlem kaydedildi',
      });

      setFormData(prev => ({
        ...prev,
        baslik: '',
        miktar: '',
        tip: 'GIDER',
        periyot: 'AYLIK',
        kategoriId: '',
        odemeGunu: 0,
        fisUrl: '',
        ocrText: '',
      }));
      setSelectedKategori(null);
    } catch (error: any) {
      console.log('İşlem hatası:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.response?.data?.message || 'İşlem kaydedilemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFisTara = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Hata', text2: 'Galeri erişim izni gerekiyor' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setScanning(true);
        const asset = result.assets[0];
        
        const formDataPayload = new FormData();
        formDataPayload.append('fisGorseli', {
          uri: asset.uri,
          name: 'fis.jpg',
          type: 'image/jpeg',
        } as any);

        const res = await apiClient.post('/islem/ocr-tara', formDataPayload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = res.data.data;
        if (data) {
          setFormData(prev => ({
            ...prev,
            baslik: data.baslik || prev.baslik,
            miktar: data.miktar ? String(data.miktar) : prev.miktar,
            kategoriId: data.kategoriId || prev.kategoriId,
            ocrText: data.ocrText || '',
          }));

          if (data.kategoriId) {
            const matchedKategori = kategoriler.find(k => k.id === data.kategoriId);
            if (matchedKategori) setSelectedKategori(matchedKategori);
          }

          Toast.show({
            type: 'success',
            text1: 'Fiş Tarandı',
            text2: 'Bilgiler otomatik dolduruldu',
          });
        }
      }
    } catch (error: any) {
      console.log('OCR hatası:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Fiş taranamadı. Lütfen tekrar deneyin.',
      });
    } finally {
      setScanning(false);
    }
  };

  const filteredKategoriler = kategoriler.filter(k => 
    formData.tip === 'GELIR' 
      ? k.tip === 'GELIR' || k.tip === 'HER_IKISI'
      : k.tip === 'GIDER' || k.tip === 'HER_IKISI'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.headerIcon} onPress={navigateToBildirimler}>
          <Icon name="bell" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.pageTitle}>Yeni İşlem</Text>
          <Text style={styles.pageSubtitle}>Gelir veya gider ekleyin</Text>
        </Animated.View>

        {/* Fiş Tarama Butonu */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.ocrContainer}>
          <TouchableOpacity 
            style={styles.ocrButton} 
            onPress={handleFisTara}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Icon name="camera" size={20} color={colors.primary} />
            )}
            <Text style={styles.ocrButtonText}>
              {scanning ? 'Fiş Taranıyor...' : 'Fiş veya Fatura Tara (AI)'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tip Seçimi */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tipContainer}>
          <TouchableOpacity
            style={[styles.tipButton, formData.tip === 'GELIR' && styles.tipButtonGelir]}
            onPress={() => {
              setFormData(prev => ({ ...prev, tip: 'GELIR', kategoriId: '' }));
              setSelectedKategori(null);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.tipIconWrapper, formData.tip === 'GELIR' && styles.tipIconWrapperGelir]}>
              <Icon name="arrowUp" size={20} color={formData.tip === 'GELIR' ? '#fff' : colors.success} />
            </View>
            <Text style={[styles.tipText, formData.tip === 'GELIR' && styles.tipTextActive]}>Gelir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tipButton, formData.tip === 'GIDER' && styles.tipButtonGider]}
            onPress={() => {
              setFormData(prev => ({ ...prev, tip: 'GIDER', kategoriId: '' }));
              setSelectedKategori(null);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.tipIconWrapper, formData.tip === 'GIDER' && styles.tipIconWrapperGider]}>
              <Icon name="arrowDown" size={20} color={formData.tip === 'GIDER' ? '#fff' : colors.error} />
            </View>
            <Text style={[styles.tipText, formData.tip === 'GIDER' && styles.tipTextActive]}>Gider</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* İşlem Düzenliliği (Tek Seferlik / Sabit) */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, !isSabit && styles.tabButtonActive]}
            onPress={() => setIsSabit(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isSabit && styles.tabTextActive]}>Tek Seferlik</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, isSabit && styles.tabButtonActive]}
            onPress={() => setIsSabit(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isSabit && styles.tabTextActive]}>Düzenli (Sabit)</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Miktar Input - Büyük ve Modern */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.miktarContainer}>
          <Text style={styles.miktarPrefix}>₺</Text>
          <TextInput
            style={styles.miktarInput}
            placeholder="0"
            placeholderTextColor={colors.onSurfaceVariant}
            value={formData.miktar}
            onChangeText={(value) => setFormData(prev => ({ ...prev, miktar: value }))}
            keyboardType="decimal-pad"
          />
        </Animated.View>

        {/* İşlem Adı */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>İşlem Adı</Text>
          <View style={styles.inputWrapper}>
            <Icon name="fileInvoice" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.input}
              placeholder="örn. Netflix, Kira, Maaş"
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.baslik}
              onChangeText={(value) => setFormData(prev => ({ ...prev, baslik: value }))}
            />
          </View>
        </Animated.View>

        {/* Hızlı Kategori Seçimi */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.inputGroup}>
          <View style={styles.kategoriHeader}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <TouchableOpacity onPress={() => setShowKategoriModal(true)}>
              <Text style={styles.tumunuGorText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {/* Hızlı Seçim Grid */}
          <View style={styles.hizliKategoriGrid}>
            {filteredKategoriler.slice(0, 8).map((kategori) => (
              <TouchableOpacity
                key={kategori.id}
                style={[
                  styles.hizliKategoriItem,
                  selectedKategori?.id === kategori.id && styles.hizliKategoriItemActive,
                ]}
                onPress={() => handleKategoriSelect(kategori)}
                activeOpacity={0.7}
              >
                <Icon 
                  name={(kategori.ikon as IconName) || 'tag'} 
                  size={18} 
                  color={selectedKategori?.id === kategori.id ? colors.primary : colors.onSurfaceVariant} 
                />
                <Text 
                  style={[
                    styles.hizliKategoriText,
                    selectedKategori?.id === kategori.id && styles.hizliKategoriTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {kategori.ad}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Periyot Seçimi */}
        {isSabit && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tekrar</Text>
            <View style={styles.periyotContainer}>
              {(['HAFTALIK', 'AYLIK', 'YILLIK'] as const).map((periyot) => (
                <TouchableOpacity
                  key={periyot}
                  style={[
                    styles.periyotButton,
                    formData.periyot === periyot && styles.periyotButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, periyot }))}
                >
                  <Text style={[
                    styles.periyotText,
                    formData.periyot === periyot && styles.periyotTextActive,
                  ]}>
                    {periyot === 'HAFTALIK' ? 'Haftalık' : periyot === 'AYLIK' ? 'Aylık' : 'Yıllık'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Ödeme Günü Seçimi - Sadece Aylık ve Yıllık için */}
        {isSabit && (formData.periyot === 'AYLIK' || formData.periyot === 'YILLIK') && (
          <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ödeme Günü</Text>
            <Text style={styles.inputHint}>Her ayın kaçıncı günü ödenecek?</Text>
            <View style={styles.odemeGunuContainer}>
              {[1, 5, 10, 15, 17, 20, 25, 28].map((gun) => (
                <TouchableOpacity
                  key={gun}
                  style={[
                    styles.odemeGunuButton,
                    formData.odemeGunu === gun && styles.odemeGunuButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, odemeGunu: gun }))}
                >
                  <Text style={[
                    styles.odemeGunuText,
                    formData.odemeGunu === gun && styles.odemeGunuTextActive,
                  ]}>
                    {gun}.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Kaydet Butonu */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Button
            title="KAYDET"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>

      {/* Kategori Modal */}
      <Modal
        visible={showKategoriModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowKategoriModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Seç</Text>
              <TouchableOpacity onPress={() => setShowKategoriModal(false)}>
                <Icon name="times" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {loadingKategoriler ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.kategoriGrid}>
                  {filteredKategoriler.map((kategori) => (
                    <TouchableOpacity
                      key={kategori.id}
                      style={[
                        styles.kategoriCard,
                        selectedKategori?.id === kategori.id && styles.kategoriCardActive,
                      ]}
                      onPress={() => handleKategoriSelect(kategori)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.kategoriIcon}>
                        <Icon 
                          name={(kategori.ikon as IconName) || 'tag'} 
                          size={20} 
                          color={selectedKategori?.id === kategori.id ? colors.primary : colors.onSurfaceVariant} 
                        />
                      </View>
                      <Text 
                        style={[
                          styles.kategoriText,
                          selectedKategori?.id === kategori.id && styles.kategoriTextActive,
                        ]} 
                        numberOfLines={1}
                      >
                        {kategori.ad}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  ocrContainer: {
    marginBottom: spacing.lg,
  },
  ocrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  ocrButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 12,
  },
  tipButtonGelir: {
    borderColor: colors.success,
    backgroundColor: '#e8f5e9',
  },
  tipButtonGider: {
    borderColor: colors.error,
    backgroundColor: '#ffebee',
  },
  tipIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconWrapperGelir: {
    backgroundColor: colors.success,
  },
  tipIconWrapperGider: {
    backgroundColor: colors.error,
  },
  tipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  tipTextActive: {
    color: colors.onSurface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  miktarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  miktarPrefix: {
    fontFamily: 'Poppins_300Light',
    fontSize: 48,
    color: colors.onSurfaceVariant,
  },
  miktarInput: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 56,
    color: colors.onSurface,
    minWidth: 100,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  kategoriHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tumunuGorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  hizliKategoriGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hizliKategoriItem: {
    width: '23%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hizliKategoriItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryContainer,
  },
  hizliKategoriText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  hizliKategoriTextActive: {
    color: colors.primary,
  },
  periyotContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periyotButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    alignItems: 'center',
  },
  periyotButtonActive: {
    backgroundColor: colors.primary,
  },
  periyotText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  periyotTextActive: {
  color: colors.onPrimary,
  },
  odemeGunuContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  },
  odemeGunuButton: {
  width: 50,
  height: 44,
  borderRadius: 8,
  backgroundColor: colors.surfaceContainerHigh,
  alignItems: 'center',
  justifyContent: 'center',
  },
  odemeGunuButtonActive: {
  backgroundColor: colors.primary,
  },
  odemeGunuText: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 14,
  color: colors.onSurfaceVariant,
  },
  odemeGunuTextActive: {
  color: colors.onPrimary,
  },
  inputHint: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 12,
  color: colors.onSurfaceVariant,
  marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.containerMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  modalLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  modalScroll: {
    padding: spacing.containerMargin,
  },
  kategoriGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  kategoriCard: {
    width: '31%',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  kategoriCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryContainer,
  },
  kategoriIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kategoriText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurface,
    textAlign: 'center',
  },
  kategoriTextActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
