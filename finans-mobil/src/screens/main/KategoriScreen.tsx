import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon, Button } from '../../components';
import { apiClient } from '../../api/client';
import { IconName } from '../../components/Icon';

const AppLogo = require('../../../app.png');

interface Kategori {
  id: string;
  ad: string;
  tip: 'GIDER' | 'GELIR' | 'HER_IKISI';
  renk: string;
  ikon: string;
  sistemKategorisi: boolean;
  aylikHedef?: number;
  harcanan?: number;
}

interface Props {
  navigation: any;
}

const kategoriRenkleri = [
  '#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#5a5a5a',
  '#6a6a6a', '#7a7a7a', '#8a8a8a', '#9a9a9a', '#aaaaaa',
  '#bababa', '#cacaca', '#dadada', '#eaeaea', '#fafafa',
];

const kategoriIkonlari: IconName[] = [
  'home', 'car', 'utensils', 'shoppingCart', 'coffee',
  'heart', 'gamepad', 'music', 'film', 'book',
  'dumbbell', 'plane', 'gift', 'piggyBank', 'creditCard',
  'wifi', 'mobile', 'laptop', 'pills', 'baby',
];

export const KategoriScreen: React.FC<Props> = ({ navigation }) => {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [seciliSekme, setSeciliSekme] = useState<'TUMU' | 'GIDER' | 'GELIR'>('TUMU');

  const [yeniKategori, setYeniKategori] = useState({
    ad: '',
    tip: 'GIDER' as 'GIDER' | 'GELIR' | 'HER_IKISI',
    renk: '#6366F1',
    ikon: 'tag',
    aylikHedef: '0',
  });

  useEffect(() => {
    fetchKategoriler();
  }, []);

  const fetchKategoriler = async () => {
    try {
      const response = await apiClient.get('/kategori');
      if (response.data?.data) {
        setKategoriler(response.data.data);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Kategoriler yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (kat: Kategori) => {
    setDuzenlenenId(kat.id);
    setYeniKategori({
      ad: kat.ad,
      tip: kat.tip,
      renk: kat.renk,
      ikon: kat.ikon,
      aylikHedef: String(kat.aylikHedef || 0),
    });
    setModalVisible(true);
  };

  const handleKategoriEkle = async () => {
    if (!yeniKategori.ad.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Kategori adı girin',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ad: yeniKategori.ad,
        tip: yeniKategori.tip,
        renk: yeniKategori.renk,
        ikon: yeniKategori.ikon,
        aylikHedef: parseFloat(yeniKategori.aylikHedef) || 0,
      };

      if (duzenlenenId) {
        await apiClient.patch(`/kategori/${duzenlenenId}`, payload);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Kategori güncellendi',
        });
      } else {
        await apiClient.post('/kategori', payload);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Kategori eklendi',
        });
      }
      setModalVisible(false);
      setDuzenlenenId(null);
      setYeniKategori({
        ad: '',
        tip: 'GIDER',
        renk: '#6366F1',
        ikon: 'tag',
        aylikHedef: '0',
      });
      fetchKategoriler();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.response?.data?.message || 'İşlem başarısız',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTipLabel = (tip: string) => {
    switch (tip) {
      case 'GIDER': return 'Gider';
      case 'GELIR': return 'Gelir';
      case 'HER_IKISI': return 'Her İkisi';
      default: return tip;
    }
  };

  const ICON_COLOR = '#1a1a1a';
  const ICON_BG = '#f5f5f5';

  const renderKategoriList = (liste: Kategori[], baslik: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{baslik}</Text>
      {liste.map((kat) => {
        const isGelir = kat.tip === 'GELIR';
        const harcanan = kat.harcanan || 0;
        const hedef = kat.aylikHedef || 0;
        const isOver = hedef > 0 && harcanan > hedef;

        return (
          <TouchableOpacity key={kat.id} activeOpacity={0.8} onPress={() => handleEdit(kat)}>
            <Card variant="outlined" style={[styles.kategoriCard, isOver && { borderColor: '#1a1a1a50', backgroundColor: '#1a1a1a05' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.kategoriIcon, { backgroundColor: ICON_BG }]}>
                  <Icon name={(kat.ikon as IconName) || 'tag'} size={18} color={ICON_COLOR} />
                </View>
                <View style={styles.kategoriInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={styles.kategoriAd}>{kat.ad}</Text>
                    {!isGelir && hedef > 0 && !isOver && (
                      <View style={{ backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="checkCircle" size={10} color="#10B981" />
                        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#10B981' }}>Hedefte</Text>
                      </View>
                    )}
                    {isOver && (
                      <View style={{ backgroundColor: '#1a1a1a15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="exclamation" size={10} color="#1a1a1a" />
                        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#1a1a1a' }}>Asildi</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.kategoriTip}>{getTipLabel(kat.tip)}</Text>
                </View>
                {kat.sistemKategorisi ? (
                  <View style={styles.sistemBadge}>
                    <Text style={styles.sistemBadgeText}>Sistem</Text>
                  </View>
                ) : (
                  <View style={[styles.renkDot, { backgroundColor: kat.renk || ICON_COLOR }]} />
                )}
              </View>

              {/* Bütçe Hedefi Progress Grafiği */}
              {!isGelir && hedef > 0 ? (() => {
                const bugun = new Date();
                const ayinSonGunu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).getDate();
                const kalanGun = Math.max(1, ayinSonGunu - bugun.getDate() + 1);
                const kalanButce = Math.max(0, hedef - harcanan);
                const gunlukLimit = Math.floor(kalanButce / kalanGun);

                return (
                  <View style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.onSurfaceVariant }}>
                        Harcanan: ₺{harcanan.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: isOver ? colors.error : colors.primary }}>
                        Hedef: ₺{hedef.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                      <View 
                        style={{ 
                          height: '100%', 
                          width: `${Math.min(100, (harcanan / (hedef || 1)) * 100)}%`, 
                          backgroundColor: isOver ? colors.error : colors.primary 
                        }} 
                      />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryContainer + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: colors.primary }}>
                        Günlük Bütçe: ₺{gunlukLimit.toLocaleString('tr-TR')}
                      </Text>
                      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 10, color: colors.onSurfaceVariant }}>
                        Kalan: ₺{kalanButce.toLocaleString('tr-TR')} ({kalanGun} gün)
                      </Text>
                    </View>
                  </View>
                );
              })() : null}
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const butceliKategoriler = kategoriler.filter(k => k.tip !== 'GELIR' && (k.aylikHedef || 0) > 0);
  const basariliKategoriler = butceliKategoriler.filter(k => (k.harcanan || 0) <= (k.aylikHedef || 0));

  const filteredKategoriler = kategoriler.filter(k => {
    if (seciliSekme === 'GIDER') return k.tip === 'GIDER' || k.tip === 'HER_IKISI';
    if (seciliSekme === 'GELIR') return k.tip === 'GELIR' || k.tip === 'HER_IKISI';
    return true;
  });

  const sistemKategorileri = filteredKategoriler.filter(k => k.sistemKategorisi);
  const kullaniciKategorileri = filteredKategoriler.filter(k => !k.sistemKategorisi);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevronLeft" size={18} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kategori & Bütçe Yönetimi</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setDuzenlenenId(null);
            setYeniKategori({ ad: '', tip: 'GIDER', renk: '#6366F1', ikon: 'tag', aylikHedef: '0' });
            setModalVisible(true);
          }}
        >
          <Icon name="plus" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageSubtitle}>
          Kategorilerinize bütçe limiti belirleyin ve harcamalarınızı takip edin. Düzenlemek için karta tıklayın.
        </Text>

        {/* Başarı Özet Kartı */}
        {butceliKategoriler.length > 0 && (
          <Card variant="featured" style={{ backgroundColor: colors.surfaceContainer, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={basariliKategoriler.length === butceliKategoriler.length ? 'trophy' : 'chartPie'} size={22} color="#1a1a1a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.onSurface }}>
                  {basariliKategoriler.length} / {butceliKategoriler.length} Hedef Başarıyla Korunuyor
                </Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.onSurfaceVariant }}>
                  {basariliKategoriler.length === butceliKategoriler.length ? "Harika! Hicbir butcenizi asmadiniz" : "Aylik harcama hedeflerinizi takip etmeye devam edin."}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Sekmeler / Pagination */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, padding: 4, borderRadius: 16, marginBottom: 20 }}>
          {(['TUMU', 'GIDER', 'GELIR'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: seciliSekme === tab ? colors.surface : 'transparent', alignItems: 'center', shadowColor: seciliSekme === tab ? '#000' : 'transparent', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: seciliSekme === tab ? 2 : 0 }}
              onPress={() => setSeciliSekme(tab)}
            >
              <Text style={{ fontFamily: seciliSekme === tab ? 'Poppins_600SemiBold' : 'Poppins_500Medium', fontSize: 13, color: seciliSekme === tab ? colors.primary : colors.onSurfaceVariant }}>
                {tab === 'TUMU' ? 'Tümü' : tab === 'GIDER' ? 'Giderler' : 'Gelirler'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {kullaniciKategorileri.length > 0 && renderKategoriList(kullaniciKategorileri, 'Benim Kategorilerim')}
            {sistemKategorileri.length > 0 && renderKategoriList(sistemKategorileri, 'Sistem Kategorileri')}

            {filteredKategoriler.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="tag" size={48} color={colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>Bu sekmede kategori bulunamadı</Text>
                <Button
                  title="Kategori Ekle"
                  onPress={() => {
                    setDuzenlenenId(null);
                    setYeniKategori({ ad: '', tip: seciliSekme === 'GELIR' ? 'GELIR' : 'GIDER', renk: '#6366F1', ikon: 'tag', aylikHedef: '0' });
                    setModalVisible(true);
                  }}
                  style={styles.emptyButton}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Kategori Ekleme / Düzenleme Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{duzenlenenId ? 'Kategori Düzenle' : 'Yeni Kategori'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="times" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Kategori Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. Eğlence, Spor"
                placeholderTextColor={colors.onSurfaceVariant}
                value={yeniKategori.ad}
                onChangeText={(text) => setYeniKategori(prev => ({ ...prev, ad: text }))}
              />

              <Text style={styles.inputLabel}>Aylık Harcama Hedefi / Bütçe Limiti (TL)</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. 3000"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="decimal-pad"
                value={yeniKategori.aylikHedef}
                onChangeText={(text) => setYeniKategori(prev => ({ ...prev, aylikHedef: text }))}
              />

              <Text style={styles.inputLabel}>Tür</Text>
              <View style={styles.tipContainer}>
                {(['GIDER', 'GELIR', 'HER_IKISI'] as const).map((tip) => (
                  <TouchableOpacity
                    key={tip}
                    style={[
                      styles.tipButton,
                      yeniKategori.tip === tip && styles.tipButtonActive,
                    ]}
                    onPress={() => setYeniKategori(prev => ({ ...prev, tip }))}
                  >
                    <Text style={[
                      styles.tipButtonText,
                      yeniKategori.tip === tip && styles.tipButtonTextActive,
                    ]}>
                      {getTipLabel(tip)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Renk</Text>
              <View style={styles.renkContainer}>
                {kategoriRenkleri.map((renk) => (
                  <TouchableOpacity
                    key={renk}
                    style={[
                      styles.renkButton,
                      { backgroundColor: renk },
                      yeniKategori.renk === renk && styles.renkButtonActive,
                    ]}
                    onPress={() => setYeniKategori(prev => ({ ...prev, renk }))}
                  >
                    {yeniKategori.renk === renk && (
                      <Icon name="check" size={12} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>İkon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.ikonContainer}>
                  {kategoriIkonlari.map((ikon) => (
                    <TouchableOpacity
                      key={ikon}
                      style={[
                        styles.ikonButton,
                        yeniKategori.ikon === ikon && styles.ikonButtonActive,
                      ]}
                      onPress={() => setYeniKategori(prev => ({ ...prev, ikon }))}
                    >
                      <Icon
                        name={ikon}
                        size={18}
                        color={yeniKategori.ikon === ikon ? colors.primary : colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="İptal"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Kaydet"
                onPress={handleKategoriEkle}
                loading={saving}
                style={styles.modalButton}
              />
            </View>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
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
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  kategoriCard: {
    flexDirection: 'column',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  kategoriIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  kategoriInfo: {
    flex: 1,
  },
  kategoriAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  kategoriTip: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  renkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sistemBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surfaceContainerHigh,
  },
  sistemBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
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
  modalBody: {
    padding: spacing.containerMargin,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  tipButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryContainer,
  },
  tipButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  tipButtonTextActive: {
    color: colors.primary,
  },
  renkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  renkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renkButtonActive: {
    borderWidth: 3,
    borderColor: colors.onSurface,
  },
  ikonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ikonButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikonButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryContainer,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.containerMargin,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalButton: {
    flex: 1,
  },
});
