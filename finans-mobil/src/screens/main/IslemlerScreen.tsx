import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../../theme';
import { Card, Icon, Button, SegmentedControl } from '../../components';
import { apiClient } from '../../api/client';
import Toast from 'react-native-toast-message';
import { IconName } from '../../components/Icon';

interface Islem {
  id: string;
  baslik: string;
  miktar: number;
  tip: 'GELIR' | 'GIDER';
  tarih: string;
  kategori: {
    id: string;
    ad: string;
    renk: string;
    ikon: string;
  };
  sabitMi: boolean;
  periyot?: string;
  notlar?: string;
}

interface Props {
  navigation: any;
}

type DatePreset = 'TUMU' | 'BUGUN' | 'HAFTA' | 'AY' | 'UC_AY';
type SabitFilter = 'HEPSI' | 'SABIT' | 'TEK';

function normalizeIslemListPayload(res: any): Islem[] {
  const raw = res?.data?.data;
  if (Array.isArray(raw)) return raw;
  if (raw?.islemler && Array.isArray(raw.islemler)) return raw.islemler;
  return [];
}

function getDateRangeForPreset(preset: DatePreset): { baslangic?: Date; bitis?: Date } {
  const bitis = new Date();
  bitis.setHours(23, 59, 59, 999);

  if (preset === 'TUMU') return {};

  const baslangic = new Date();

  switch (preset) {
    case 'BUGUN':
      baslangic.setHours(0, 0, 0, 0);
      return { baslangic, bitis };
    case 'HAFTA':
      baslangic.setDate(baslangic.getDate() - 7);
      baslangic.setHours(0, 0, 0, 0);
      return { baslangic, bitis };
    case 'AY':
      baslangic.setDate(1);
      baslangic.setHours(0, 0, 0, 0);
      return { baslangic, bitis };
    case 'UC_AY':
      baslangic.setMonth(baslangic.getMonth() - 3);
      baslangic.setHours(0, 0, 0, 0);
      return { baslangic, bitis };
    default:
      return {};
  }
}

const ICON_COLOR = '#1a1a1a';
const ICON_BG = '#f5f5f5';

const getIslemIconInfo = (baslik: string, tip: string, kategoriIkon?: string, kategoriRenk?: string) => {
  const lower = baslik.toLowerCase();
  if (lower.includes('netflix')) return { name: 'netflix' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('spotify')) return { name: 'spotify' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('youtube')) return { name: 'youtube' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('amazon')) return { name: 'amazon' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('apple')) return { name: 'apple' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('google')) return { name: 'google' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('steam')) return { name: 'steam' as const, color: ICON_COLOR, bg: ICON_BG };
  if (lower.includes('playstation') || lower.includes('psn')) return { name: 'playstation' as const, color: ICON_COLOR, bg: ICON_BG };

  if (kategoriIkon) {
    return { 
      name: (kategoriIkon as any) || 'tag', 
      color: ICON_COLOR,
      bg: ICON_BG
    };
  }

  return { 
    name: (tip === 'GELIR' ? 'arrowUp' : 'arrowDown') as any, 
    color: ICON_COLOR,
    bg: ICON_BG
  };
};

export const IslemlerScreen: React.FC<Props> = ({ navigation }) => {
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [toplamKayit, setToplamKayit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTip, setFilterTip] = useState<'TUMU' | 'GELIR' | 'GIDER'>('TUMU');
  const [datePreset, setDatePreset] = useState<DatePreset>('AY');
  const [sabitFilter, setSabitFilter] = useState<SabitFilter>('HEPSI');
  const [selectedIslem, setSelectedIslem] = useState<Islem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ baslik: '', miktar: '', notlar: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const filterOptions = [
    { value: 'TUMU', label: 'Tümü' },
    { value: 'GELIR', label: 'Gelir' },
    { value: 'GIDER', label: 'Gider' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const fetchIslemler = useCallback(async () => {
    try {
      const params: Record<string, string | number | boolean> = {
        sayfaBasinaKayit: 100,
        sayfa: 1,
      };
      if (filterTip !== 'TUMU') params.tip = filterTip;
      if (debouncedSearch) params.aramaMetni = debouncedSearch;

      const range = getDateRangeForPreset(datePreset);
      if (range.baslangic) params.baslangic = range.baslangic.toISOString();
      if (range.bitis) params.bitis = range.bitis.toISOString();

      if (sabitFilter === 'SABIT') params.sabitMi = true;
      if (sabitFilter === 'TEK') params.sabitMi = false;

      const response = await apiClient.get('/islem', { params });
      setIslemler(normalizeIslemListPayload(response));
      const meta = response.data?.meta;
      if (meta?.toplam !== undefined) setToplamKayit(meta.toplam);
      else setToplamKayit(normalizeIslemListPayload(response).length);
    } catch (error) {
      console.log('İşlemler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [filterTip, debouncedSearch, datePreset, sabitFilter]);

  // Her odaklanıldığında yenile
  useFocusEffect(
    useCallback(() => {
      fetchIslemler();
    }, [fetchIslemler])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIslemler();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const openDetail = (islem: Islem) => {
    setSelectedIslem(islem);
    setEditData({
      baslik: islem.baslik,
      miktar: islem.miktar.toString(),
      notlar: islem.notlar || '',
    });
    setEditMode(false);
    setDetailModalVisible(true);
  };

  const handleDelete = () => {
    if (!selectedIslem) return;

    Alert.alert(
      'İşlemi Sil',
      'Bu işlemi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/islem/${selectedIslem.id}`);
              Toast.show({ type: 'success', text1: 'Başarılı', text2: 'İşlem silindi' });
              setDetailModalVisible(false);
              fetchIslemler();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem silinemedi' });
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!selectedIslem) return;
    if (!editData.baslik.trim()) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Başlık zorunludur' });
      return;
    }
    if (!editData.miktar || parseFloat(editData.miktar) <= 0) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Geçerli bir miktar giriniz' });
      return;
    }

    setSavingEdit(true);
    try {
      await apiClient.patch(`/islem/${selectedIslem.id}`, {
        baslik: editData.baslik.trim(),
        miktar: parseFloat(editData.miktar),
        notlar: editData.notlar.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'İşlem güncellendi' });
      setDetailModalVisible(false);
      fetchIslemler();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Güncelleme başarısız' });
    } finally {
      setSavingEdit(false);
    }
  };

  const renderIslem = ({ item, index }: { item: Islem; index: number }) => {
    const iconInfo = getIslemIconInfo(item.baslik, item.tip, item.kategori.ikon, item.kategori.renk);
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity onPress={() => openDetail(item)} activeOpacity={0.7}>
          <Card variant="outlined" style={styles.islemCard}>
            <View style={styles.islemRow}>
              <View style={[styles.islemIcon, { backgroundColor: iconInfo.bg }]}>
                <Icon
                  name={iconInfo.name}
                  size={18}
                  color={iconInfo.color}
                />
              </View>
            <View style={styles.islemInfo}>
              <Text style={styles.islemBaslik} numberOfLines={1}>
                {item.baslik}
              </Text>
              <View style={styles.islemMeta}>
                <Text style={styles.islemKategori}>{item.kategori.ad}</Text>
                {item.sabitMi && (
                  <View style={styles.sabitBadge}>
                    <Text style={styles.sabitBadgeText}>Sabit</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.islemRight}>
              <Text
                style={[
                  styles.islemMiktar,
                  item.tip === 'GELIR' ? styles.gelirText : styles.giderText,
                ]}
              >
                {item.tip === 'GELIR' ? '+' : '-'}{formatCurrency(item.miktar)}
              </Text>
              <Text style={styles.islemTarih}>{formatDate(item.tarih)}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
    );
  };

  const datePresetOptions: { key: DatePreset; label: string }[] = [
    { key: 'BUGUN', label: 'Bugün' },
    { key: 'HAFTA', label: '7 gün' },
    { key: 'AY', label: 'Bu ay' },
    { key: 'UC_AY', label: '3 ay' },
    { key: 'TUMU', label: 'Tümü' },
  ];

  const sabitOptions: { key: SabitFilter; label: string }[] = [
    { key: 'HEPSI', label: 'Tümü' },
    { key: 'SABIT', label: 'Sabit' },
    { key: 'TEK', label: 'Tek sefer' },
  ];

  return (
  <SafeAreaView style={styles.container}>
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.headerTitle}>İşlemler</Text>
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={[styles.quickAddButton, { backgroundColor: '#f0f0f0', borderColor: '#1a1a1a' }]}
        onPress={() => navigation.navigate('IslemEkle', { tip: 'GIDER', sabitMi: false } as never)}
      >
        <Icon name="plus" size={14} color="#1a1a1a" />
        <Text style={[styles.quickAddText, { color: '#1a1a1a' }]}>Tek Seferlik</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quickAddButton, { backgroundColor: '#f0f0f0', borderColor: '#1a1a1a' }]}
        onPress={() => navigation.navigate('IslemEkle', { tip: 'GELIR', sabitMi: true } as never)}
      >
        <Icon name="arrowUp" size={14} color="#1a1a1a" />
        <Text style={[styles.quickAddText, { color: '#1a1a1a' }]}>Gelir</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quickAddButton, { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' }]}
        onPress={() => navigation.navigate('IslemEkle', { tip: 'GIDER', sabitMi: true } as never)}
      >
        <Icon name="arrowDown" size={14} color="#ffffff" />
        <Text style={[styles.quickAddText, { color: '#ffffff' }]}>Gider</Text>
      </TouchableOpacity>
    </View>
  </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşlem ara..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="times" size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={islemler}
          renderItem={renderIslem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.md }}>
              <View style={styles.filterContainer}>
                <SegmentedControl
                  options={filterOptions}
                  selectedValue={filterTip}
                  onValueChange={(val) => setFilterTip(val as any)}
                />
              </View>

              <Text style={styles.filterSectionLabel}>Tarih aralığı</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {datePresetOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, datePreset === opt.key && styles.chipActive]}
                    onPress={() => setDatePreset(opt.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, datePreset === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionLabel}>Kayıt tipi</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {sabitOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, sabitFilter === opt.key && styles.chipActive]}
                    onPress={() => setSabitFilter(opt.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, sabitFilter === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {!loading && toplamKayit > 0 && (
                <Text style={styles.metaText}>
                  {islemler.length} kayıt listeleniyor (toplam {toplamKayit})
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color={colors.outline} />
              <Text style={styles.emptyTitle}>İşlem bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                {debouncedSearch || datePreset !== 'TUMU' || filterTip !== 'TUMU' || sabitFilter !== 'HEPSI'
                  ? 'Filtre veya arama kriterlerine uygun işlem yok'
                  : 'Henüz işlem eklenmemiş'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Action Button for Tek Seferlik İşlem Ekle */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('IslemEkle')}
        activeOpacity={0.9}
      >
        <Icon name="plus" size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Detail/Edit Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'İşlemi Düzenle' : 'İşlem Detayı'}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="times" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {selectedIslem && (
              <View style={styles.modalBody}>
                {editMode ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Başlık</Text>
                      <TextInput
                        style={styles.input}
                        value={editData.baslik}
                        onChangeText={(val) => setEditData({ ...editData, baslik: val })}
                        placeholder="İşlem başlığı"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Miktar</Text>
                      <TextInput
                        style={styles.input}
                        value={editData.miktar}
                        onChangeText={(val) => setEditData({ ...editData, miktar: val })}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Not</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editData.notlar}
                        onChangeText={(val) => setEditData({ ...editData, notlar: val })}
                        placeholder="Opsiyonel not..."
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      {(() => {
                        const iconInfo = getIslemIconInfo(selectedIslem.baslik, selectedIslem.tip, selectedIslem.kategori.ikon, selectedIslem.kategori.renk);
                        return (
                          <View style={[styles.detailIcon, { backgroundColor: iconInfo.bg }]}>
                            <Icon name={iconInfo.name} size={24} color={iconInfo.color} />
                          </View>
                        );
                      })()}
                      <View>
                        <Text style={styles.detailBaslik}>{selectedIslem.baslik}</Text>
                        <Text style={styles.detailKategori}>{selectedIslem.kategori.ad}</Text>
                      </View>
                    </View>

                    <View style={styles.detailAmount}>
                      <Text
                        style={[
                          styles.detailMiktar,
                          selectedIslem.tip === 'GELIR' ? styles.gelirText : styles.giderText,
                        ]}
                      >
                        {selectedIslem.tip === 'GELIR' ? '+' : '-'}
                        {formatCurrency(selectedIslem.miktar)}
                      </Text>
                      <View
                        style={[
                          styles.tipBadge,
                          selectedIslem.tip === 'GELIR' ? styles.gelirBadge : styles.giderBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tipBadgeText,
                            selectedIslem.tip === 'GELIR'
                              ? styles.gelirBadgeText
                              : styles.giderBadgeText,
                          ]}
                        >
                          {selectedIslem.tip === 'GELIR' ? 'Gelir' : 'Gider'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailInfo}>
                      <View style={styles.detailInfoRow}>
                        <Icon name="calendar" size={16} color={colors.onSurfaceVariant} />
                        <Text style={styles.detailInfoText}>
                          {formatDate(selectedIslem.tarih)}
                        </Text>
                      </View>
                      {selectedIslem.sabitMi && (
                        <View style={styles.detailInfoRow}>
                          <Icon name="repeat" size={16} color={colors.onSurfaceVariant} />
                          <Text style={styles.detailInfoText}>
                            Sabit {selectedIslem.periyot === 'AYLIK' ? 'Aylık' : selectedIslem.periyot === 'HAFTALIK' ? 'Haftalık' : 'Yıllık'}
                          </Text>
                        </View>
                      )}
                      {selectedIslem.notlar && (
                        <View style={styles.detailInfoRow}>
                          <Icon name="edit" size={16} color={colors.onSurfaceVariant} />
                          <Text style={styles.detailInfoText}>{selectedIslem.notlar}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              {editMode ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <Button
                    title="Kaydet"
                    onPress={handleSaveEdit}
                    loading={savingEdit}
                    style={{ flex: 1 }}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Icon name="trash" size={18} color={colors.error} />
                    <Text style={styles.deleteButtonText}>Sil</Text>
                  </TouchableOpacity>
                  <Button
                    title="Düzenle"
                    onPress={() => setEditMode(true)}
                    style={{ flex: 1 }}
                  />
                </>
              )}
            </View>
          </Animated.View>
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
    paddingTop: 50,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
  },
  headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  },
  quickAddButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 6,
  borderWidth: 1,
  },
  gelirButton: {
  backgroundColor: '#e8f5e9',
  borderColor: colors.success,
  },
  giderButton: {
  backgroundColor: '#ffebee',
  borderColor: colors.error,
  },
  quickAddText: {
  fontFamily: 'Poppins_500Medium',
  fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: 4,
  },
  filterContainer: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sm,
  },
  filterSectionLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.containerMargin,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  metaText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  islemCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  islemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  islemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  islemInfo: {
    flex: 1,
  },
  islemBaslik: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 2,
  },
  islemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  islemKategori: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  sabitBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sabitBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.primary,
  },
  islemRight: {
    alignItems: 'flex-end',
  },
  islemMiktar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  gelirText: {
    color: colors.success,
  },
  giderText: {
    color: colors.error,
  },
  islemTarih: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  modalBody: {
    paddingHorizontal: spacing.containerMargin,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailBaslik: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  detailKategori: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  detailAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailMiktar: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
  },
  tipBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  gelirBadge: {
    backgroundColor: '#e8e8e8',
  },
  giderBadge: {
    backgroundColor: '#f0f0f0',
  },
  tipBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  gelirBadgeText: {
    color: colors.success,
  },
  giderBadgeText: {
    color: colors.error,
  },
  detailInfo: {
    gap: spacing.sm,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailInfoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.containerMargin,
    marginTop: spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.error,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
});
