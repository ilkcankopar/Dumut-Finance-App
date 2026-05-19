import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors, spacing } from '../../theme';
import { Card, SegmentedControl, Icon } from '../../components';
import { raporApi, DetayliRapor } from '../../api/rapor';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;
const ICON_COLOR = '#1a1a1a';
const ICON_COLOR_LIGHT = '#666';

type RaporTab = 'ozet' | 'kategori' | 'hedef' | 'gun';

const CHART_COLORS = ['#1a1a1a', '#4a4a4a', '#7a7a7a', '#9a9a9a', '#bababa', '#dadada'];

export const RaporlarScreen: React.FC = () => {
  const [seciliPeriyot, setSeciliPeriyot] = useState('AYLIK');
  const [seciliTab, setSeciliTab] = useState<RaporTab>('ozet');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rapor, setRapor] = useState<DetayliRapor | null>(null);
  const [aiOneri, setAiOneri] = useState<string | null>(null);
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [oneriModalVisible, setOneriModalVisible] = useState(false);

  const periyotOptions = [
    { value: 'HAFTALIK', label: 'HAFTA' },
    { value: 'AYLIK', label: 'AY' },
    { value: 'YILLIK', label: 'YIL' },
  ];

  const tablar: { key: RaporTab; label: string; icon: string }[] = [
    { key: 'ozet', label: 'Özet', icon: 'chartPie' },
    { key: 'kategori', label: 'Kategori', icon: 'tag' },
    { key: 'hedef', label: 'Hedef', icon: 'bullseye' },
    { key: 'gun', label: 'Gün', icon: 'calendar' },
  ];

  const getDateRange = useCallback(() => {
    const now = new Date();
    const bitis = new Date(now);
    const baslangic = new Date(now);

    switch (seciliPeriyot) {
      case 'HAFTALIK':
        baslangic.setDate(now.getDate() - 7);
        break;
      case 'AYLIK':
        baslangic.setMonth(now.getMonth() - 1);
        break;
      case 'YILLIK':
        baslangic.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { baslangic, bitis };
  }, [seciliPeriyot]);

  const fetchRapor = useCallback(async () => {
    try {
      const { baslangic, bitis } = getDateRange();
      const data = await raporApi.detayliRaporGetir(baslangic, bitis);
      setRapor(data);
      setAiOneri(null);
    } catch (error: any) {
      console.log('Rapor yüklenemedi:', error?.response?.data || error?.message || error);
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Rapor yüklenemedi' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    setLoading(true);
    fetchRapor();
  }, [fetchRapor]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRapor();
  };

  const oneriAl = async () => {
    if (!rapor || aiYukleniyor) return;
    
    setOneriModalVisible(true);
    setAiYukleniyor(true);
    
    try {
      let tip = 'genel';
      let veri: any = rapor.ozet;
      
      switch (seciliTab) {
        case 'kategori':
          tip = 'kategori';
          veri = rapor.kategoriRaporu;
          break;
        case 'hedef':
          tip = 'hedef';
          veri = rapor.hedefRaporu;
          break;
        case 'gun':
          tip = 'gunluk';
          veri = rapor.gunAnalizi;
          break;
      }
      
      const analiz = await raporApi.aiAnaliziGetir(tip, veri);
      setAiOneri(analiz);
    } catch (error) {
      console.log('AI öneri hatası:', error);
      setAiOneri('Öneri alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setAiYukleniyor(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '₺0';
    return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
    labelColor: () => ICON_COLOR_LIGHT,
    style: { borderRadius: 8 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: ICON_COLOR },
  };

  const renderOzet = () => {
    if (!rapor) return null;
    
    return (
      <View>
        {/* Özet Kartları */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Icon name="arrowUp" size={20} color={ICON_COLOR} />
            <Text style={styles.summaryLabel}>GELİR</Text>
            <Text style={styles.summaryValue}>{formatCurrency(rapor.ozet.toplamGelir)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="arrowDown" size={20} color={ICON_COLOR} />
            <Text style={styles.summaryLabel}>GİDER</Text>
            <Text style={styles.summaryValue}>{formatCurrency(rapor.ozet.toplamGider)}</Text>
          </View>
        </View>

        {/* Net Tasarruf */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>NET TASARRUF</Text>
          <Text style={[styles.netValue, rapor.ozet.netTasarruf < 0 && { color: '#1a1a1a' }]}>
            {formatCurrency(rapor.ozet.netTasarruf)}
          </Text>
          <View style={styles.netStats}>
            <View style={styles.netStatItem}>
              <Text style={styles.netStatValue}>{rapor.ozet.islemSayisi}</Text>
              <Text style={styles.netStatLabel}>İşlem</Text>
            </View>
            <View style={styles.netStatDivider} />
            <View style={styles.netStatItem}>
              <Text style={styles.netStatValue}>%{Math.abs(rapor.ozet.tasarrufOrani).toFixed(0)}</Text>
              <Text style={styles.netStatLabel}>Oran</Text>
            </View>
            <View style={styles.netStatDivider} />
            <View style={styles.netStatItem}>
              <Text style={styles.netStatValue}>{formatCurrency(rapor.ozet.ortalamaGunlukHarcama)}</Text>
              <Text style={styles.netStatLabel}>Günlük Ort.</Text>
            </View>
          </View>
        </View>

        {/* Trend Grafiği */}
        {rapor.trendler.gunluk.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Harcama Trendi</Text>
            <View style={styles.chartCard}>
              <LineChart
                data={{
                  labels: rapor.trendler.gunluk.slice(-7).map(g => formatDate(g.tarih)),
                  datasets: [{ 
                    data: rapor.trendler.gunluk.slice(-7).map(g => g.gider || 0).length > 0 
                      ? rapor.trendler.gunluk.slice(-7).map(g => g.gider || 0)
                      : [0],
                    color: () => ICON_COLOR, 
                    strokeWidth: 2 
                  }],
                }}
                width={screenWidth - spacing.containerMargin * 4}
                height={160}
                chartConfig={chartConfig}
                bezier
                withInnerLines={false}
                withOuterLines={false}
              />
            </View>
          </View>
        )}

        {/* Yatırım Önerileri */}
        {rapor.yatirimOnerileri && rapor.yatirimOnerileri.length > 0 && (
          <View style={styles.yatirimSection}>
            <Text style={styles.sectionTitle}>Tasarrufla Alınabilecekler</Text>
            {rapor.yatirimOnerileri.slice(0, 4).map((oneri, i) => (
              <View key={i} style={styles.yatirimItem}>
                <View style={styles.yatirimLeft}>
                  <View style={[styles.yatirimIcon, oneri.tip === 'kripto' && styles.yatirimIconKripto]}>
                    <Icon name={oneri.tip === 'hisse' ? 'chartLine' : 'moneyBillWave'} size={14} color="#fff" />
                  </View>
                  <Text style={styles.yatirimSembol}>{oneri.sembol}</Text>
                </View>
                <Text style={styles.yatirimAdet}>
                  {oneri.tip === 'kripto' ? oneri.alinabilecekAdet.toFixed(4) : oneri.alinabilecekAdet} adet
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderKategori = () => {
    if (!rapor) return null;

    // Pie chart verisi hazırla
    const pieData = rapor.kategoriRaporu.kategoriler.slice(0, 6).map((kat, index) => ({
      name: kat.ad,
      population: kat.toplamGider,
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: ICON_COLOR,
      legendFontSize: 11,
    }));

    // Bar chart verisi hazırla
    const barData = {
      labels: rapor.kategoriRaporu.kategoriler.slice(0, 5).map(k => k.ad.slice(0, 6)),
      datasets: [{
        data: rapor.kategoriRaporu.kategoriler.slice(0, 5).map(k => k.toplamGider || 0),
      }],
    };

    return (
      <View>
        {/* Özet */}
        <View style={styles.kategoriOzet}>
          <View style={styles.kategoriOzetItem}>
            <Text style={styles.kategoriOzetLabel}>En Çok Harcanan</Text>
            <Text style={styles.kategoriOzetValue}>{rapor.kategoriRaporu.enCokHarcanan}</Text>
          </View>
          <View style={styles.kategoriOzetDivider} />
          <View style={styles.kategoriOzetItem}>
            <Text style={styles.kategoriOzetLabel}>En Az Harcanan</Text>
            <Text style={styles.kategoriOzetValue}>{rapor.kategoriRaporu.enAzHarcanan}</Text>
          </View>
        </View>

        {/* Kategori Pasta Grafiği */}
        {pieData.length > 0 && pieData.some(p => p.population > 0) && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Harcama Dağılımı</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={pieData}
                width={screenWidth - spacing.containerMargin * 4}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Kategori Bar Grafiği */}
        {barData.datasets[0].data.some(d => d > 0) && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Kategori Karşılaştırması</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={barData}
                width={screenWidth - spacing.containerMargin * 4}
                height={180}
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.7,
                }}
                yAxisLabel="₺"
                yAxisSuffix=""
                withInnerLines={false}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </View>
        )}

        {/* Kategori Hedefleri */}
        {rapor.kategoriRaporu.kategoriHedefleri && rapor.kategoriRaporu.kategoriHedefleri.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategori Hedefleri</Text>
            {rapor.kategoriRaporu.kategoriHedefleri.map(kh => (
              <View key={kh.id} style={styles.kategoriHedefItem}>
                <View style={styles.kategoriHedefLeft}>
                  <Text style={styles.kategoriHedefAd}>{kh.kategoriAd}</Text>
                  <Text style={styles.kategoriHedefDetay}>
                    Hedef: {formatCurrency(kh.hedefMiktar)} • Harcanan: {formatCurrency(kh.harcanan)}
                  </Text>
                </View>
                <View style={[
                  styles.kategoriHedefBadge,
                  kh.durum === 'altinda' && styles.badgePositive,
                  kh.durum === 'ustunde' && styles.badgeNegative,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    kh.durum === 'altinda' && { color: '#4a4a4a' },
                    kh.durum === 'ustunde' && { color: '#1a1a1a' },
                  ]}>
                    {kh.tasarruf >= 0 ? '+' : ''}{formatCurrency(kh.tasarruf)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Kategori Listesi */}
        {rapor.kategoriRaporu.kategoriler.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tüm Kategoriler</Text>
            {rapor.kategoriRaporu.kategoriler.map((kat, index) => (
              <View key={kat.id} style={styles.kategoriItem}>
                <View style={styles.kategoriItemLeft}>
                  <View style={[styles.kategoriDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                  <View>
                    <Text style={styles.kategoriItemAd}>{kat.ad}</Text>
                    <Text style={styles.kategoriItemSayi}>{kat.islemSayisi} işlem</Text>
                  </View>
                </View>
                <View style={styles.kategoriItemRight}>
                  <Text style={styles.kategoriItemMiktar}>{formatCurrency(kat.toplamGider)}</Text>
                  <Text style={styles.kategoriItemYuzde}>%{kat.giderYuzdesi.toFixed(1)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHedef = () => {
    if (!rapor) return null;

    return (
      <View>
        {/* Hedef İstatistikleri */}
        <View style={styles.hedefStats}>
          <View style={styles.hedefStatItem}>
            <Text style={styles.hedefStatValue}>{rapor.hedefRaporu.toplamHedef}</Text>
            <Text style={styles.hedefStatLabel}>Toplam</Text>
          </View>
          <View style={styles.hedefStatDivider} />
          <View style={styles.hedefStatItem}>
            <Text style={[styles.hedefStatValue, { color: '#4a4a4a' }]}>{rapor.hedefRaporu.tamamlanan}</Text>
            <Text style={styles.hedefStatLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.hedefStatDivider} />
          <View style={styles.hedefStatItem}>
            <Text style={[styles.hedefStatValue, { color: '#666666' }]}>{rapor.hedefRaporu.devamEden}</Text>
            <Text style={styles.hedefStatLabel}>Devam Eden</Text>
          </View>
        </View>

        {/* Başarı Oranı */}
        <View style={styles.basariOrani}>
          <View style={styles.basariOraniHeader}>
            <Text style={styles.basariOraniLabel}>Başarı Oranı</Text>
            <Text style={styles.basariOraniValue}>%{rapor.hedefRaporu.basariOrani.toFixed(0)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(rapor.hedefRaporu.basariOrani, 100)}%` }]} />
          </View>
        </View>

        {/* En Aktif Gün */}
        {rapor.hedefRaporu.enAktifHedefGunu && (
          <View style={styles.aktifGun}>
            <Icon name="star" size={16} color={ICON_COLOR} />
            <Text style={styles.aktifGunText}>
              En aktif gün: <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{rapor.hedefRaporu.enAktifHedefGunu.gun}</Text>
            </Text>
          </View>
        )}

        {/* Hedef Listesi */}
        {rapor.hedefRaporu.hedefler.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hedefler</Text>
            {rapor.hedefRaporu.hedefler.map(hedef => (
              <View key={hedef.id} style={styles.hedefItem}>
                <View style={styles.hedefItemHeader}>
                  <Text style={styles.hedefItemAd}>{hedef.ad}</Text>
                  <View style={[
                    styles.hedefDurumBadge,
                    hedef.durum === 'TAMAMLANDI' && styles.badgePositive,
                    hedef.durum === 'DEVAM_EDIYOR' && styles.badgeInfo,
                  ]}>
                    <Text style={[
                      styles.hedefDurumText,
                      hedef.durum === 'TAMAMLANDI' && { color: '#4a4a4a' },
                      hedef.durum === 'DEVAM_EDIYOR' && { color: '#666666' },
                    ]}>
                      {hedef.durum === 'TAMAMLANDI' ? 'Tamamlandı' : 'Devam Ediyor'}
                    </Text>
                  </View>
                </View>
                <View style={styles.hedefProgress}>
                  <View style={[styles.hedefProgressFill, { width: `${Math.min(hedef.ilerleme, 100)}%` }]} />
                </View>
                <Text style={styles.hedefMiktar}>
                  {formatCurrency(hedef.mevcutMiktar)} / {formatCurrency(hedef.hedefMiktar)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGun = () => {
    if (!rapor) return null;

    return (
      <View>
        {/* En Çok / En Az Harcanan Gün */}
        <View style={styles.gunKartlar}>
          {rapor.gunAnalizi.enCokHarcananGun && (
            <View style={styles.gunKart}>
              <View style={[styles.gunKartIcon, { backgroundColor: '#f0f0f0' }]}>
                <Icon name="arrowUp" size={18} color="#1a1a1a" />
              </View>
              <Text style={styles.gunKartLabel}>En Çok Harcama</Text>
              <Text style={styles.gunKartGun}>{rapor.gunAnalizi.enCokHarcananGun.gun}</Text>
              <Text style={styles.gunKartTarih}>{formatDate(rapor.gunAnalizi.enCokHarcananGun.tarih)}</Text>
              <Text style={[styles.gunKartMiktar, { color: '#1a1a1a' }]}>
                {formatCurrency(rapor.gunAnalizi.enCokHarcananGun.miktar)}
              </Text>
            </View>
          )}
          {rapor.gunAnalizi.enAzHarcananGun && (
            <View style={styles.gunKart}>
              <View style={[styles.gunKartIcon, { backgroundColor: '#e8e8e8' }]}>
                <Icon name="arrowDown" size={18} color="#4a4a4a" />
              </View>
              <Text style={styles.gunKartLabel}>En Az Harcama</Text>
              <Text style={styles.gunKartGun}>{rapor.gunAnalizi.enAzHarcananGun.gun}</Text>
              <Text style={styles.gunKartTarih}>{formatDate(rapor.gunAnalizi.enAzHarcananGun.tarih)}</Text>
              <Text style={[styles.gunKartMiktar, { color: '#4a4a4a' }]}>
                {formatCurrency(rapor.gunAnalizi.enAzHarcananGun.miktar)}
              </Text>
            </View>
          )}
        </View>

        {/* Hafta Günleri Grafiği */}
        {rapor.gunAnalizi.haftaninGunleri.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hafta Günleri Ortalaması</Text>
            <View style={styles.weekDays}>
              {rapor.gunAnalizi.haftaninGunleri.map((g, i) => {
                const maxOrtalama = Math.max(...rapor.gunAnalizi.haftaninGunleri.map(x => x.ortalama));
                const height = maxOrtalama > 0 ? (g.ortalama / maxOrtalama) * 80 : 0;
                return (
                  <View key={i} style={styles.weekDayItem}>
                    <View style={[styles.weekDayBar, { height: Math.max(4, height) }]} />
                    <Text style={styles.weekDayLabel}>{g.gun.slice(0, 2)}</Text>
                    <Text style={styles.weekDayValue}>{formatCurrency(g.ortalama)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (seciliTab) {
      case 'ozet': return renderOzet();
      case 'kategori': return renderKategori();
      case 'hedef': return renderHedef();
      case 'gun': return renderGun();
      default: return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Raporlar</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Raporlar</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Periyot Seçici */}
        <View style={styles.periodSelector}>
          <SegmentedControl
            options={periyotOptions}
            selectedValue={seciliPeriyot}
            onValueChange={setSeciliPeriyot}
          />
        </View>

        {/* Tab Menü */}
        <View style={styles.tabMenu}>
          {tablar.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, seciliTab === tab.key && styles.tabActive]}
              onPress={() => { setSeciliTab(tab.key); setAiOneri(null); }}
              activeOpacity={0.7}
            >
              <Icon 
                name={tab.icon as any} 
                size={18} 
                color={seciliTab === tab.key ? '#fff' : ICON_COLOR_LIGHT} 
              />
              <Text style={[styles.tabText, seciliTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* İçerik */}
        {rapor ? (
          <>
            {renderContent()}

            {/* Öneri Al Butonu */}
            <TouchableOpacity
              style={styles.oneriButton}
              onPress={oneriAl}
              disabled={aiYukleniyor}
              activeOpacity={0.8}
            >
              <Icon name="lightbulb" size={18} color="#fff" />
              <Text style={styles.oneriButtonText}>Öneri</Text>
            </TouchableOpacity>

            {/* Öneri Alt Tarafta Göster */}
            {aiOneri && !oneriModalVisible && (
              <View style={styles.oneriResult}>
                <View style={styles.oneriResultHeader}>
                  <Icon name="lightbulb" size={16} color={ICON_COLOR} />
                  <Text style={styles.oneriResultTitle}>Öneri</Text>
                </View>
                <Text style={styles.oneriResultText}>{aiOneri}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="chartBar" size={48} color={ICON_COLOR_LIGHT} />
            <Text style={styles.emptyTitle}>Henüz veri yok</Text>
            <Text style={styles.emptySubtitle}>İşlem ekleyerek raporlarınızı görüntüleyin.</Text>
          </View>
        )}
      </ScrollView>

      {/* Öneri Popup Modal */}
      <Modal
        visible={oneriModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setOneriModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconWrap}>
                  <Icon name="lightbulb" size={20} color="#fff" />
                </View>
                <Text style={styles.modalTitle}>Öneri</Text>
              </View>
              <TouchableOpacity
                onPress={() => setOneriModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={18} color={ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {aiYukleniyor ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={ICON_COLOR} />
                  <Text style={styles.modalLoadingText}>Öneri hazırlanıyor...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalOneriText}>{aiOneri}</Text>
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setOneriModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Tamam</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: ICON_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.xxl,
  },
  periodSelector: {
    marginBottom: spacing.md,
  },
  tabMenu: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: ICON_COLOR,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: ICON_COLOR_LIGHT,
  },
  tabTextActive: {
    color: '#fff',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: ICON_COLOR_LIGHT,
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: ICON_COLOR,
    marginTop: 2,
  },
  netCard: {
    backgroundColor: ICON_COLOR,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  netLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.7)',
  },
  netValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#fff',
    marginVertical: spacing.xs,
  },
  netStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  netStatItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  netStatValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  netStatLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  netStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
    marginBottom: spacing.sm,
  },
  chartSection: {
    marginBottom: spacing.lg,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  yatirimSection: {
    marginBottom: spacing.lg,
  },
  yatirimItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  yatirimLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  yatirimIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yatirimIconKripto: {
    backgroundColor: '#1a1a1a',
  },
  yatirimSembol: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
  },
  yatirimAdet: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ICON_COLOR_LIGHT,
  },
  kategoriOzet: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  kategoriOzetItem: {
    flex: 1,
    alignItems: 'center',
  },
  kategoriOzetLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: ICON_COLOR_LIGHT,
  },
  kategoriOzetValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
    marginTop: 2,
  },
  kategoriOzetDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  kategoriHedefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  kategoriHedefLeft: {
    flex: 1,
  },
  kategoriHedefAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ICON_COLOR,
  },
  kategoriHedefDetay: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  kategoriHedefBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  badgePositive: {
    backgroundColor: '#e8e8e8',
  },
  badgeNegative: {
    backgroundColor: '#f0f0f0',
  },
  badgeInfo: {
    backgroundColor: '#f5f5f5',
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: ICON_COLOR,
  },
  kategoriItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  kategoriItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kategoriDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  kategoriItemAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ICON_COLOR,
  },
  kategoriItemSayi: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  kategoriItemRight: {
    alignItems: 'flex-end',
  },
  kategoriItemMiktar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: ICON_COLOR,
  },
  kategoriItemYuzde: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  hedefStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hedefStatItem: {
    alignItems: 'center',
  },
  hedefStatValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: ICON_COLOR,
  },
  hedefStatLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: ICON_COLOR_LIGHT,
  },
  hedefStatDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  basariOrani: {
    marginBottom: spacing.md,
  },
  basariOraniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  basariOraniLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ICON_COLOR,
  },
  basariOraniValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: ICON_COLOR,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ICON_COLOR,
    borderRadius: 4,
  },
  aktifGun: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  aktifGunText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: ICON_COLOR,
  },
  hedefItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  hedefItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hedefItemAd: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ICON_COLOR,
    flex: 1,
  },
  hedefDurumBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  hedefDurumText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  hedefProgress: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  hedefProgressFill: {
    height: '100%',
    backgroundColor: ICON_COLOR,
    borderRadius: 2,
  },
  hedefMiktar: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: ICON_COLOR_LIGHT,
  },
  gunKartlar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gunKart: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gunKartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  gunKartLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  gunKartGun: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
  },
  gunKartTarih: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
  },
  gunKartMiktar: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    marginTop: spacing.xs,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: spacing.md,
    height: 140,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayBar: {
    width: 24,
    backgroundColor: ICON_COLOR,
    borderRadius: 4,
    marginBottom: 6,
  },
  weekDayLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: ICON_COLOR,
  },
  weekDayValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
    color: ICON_COLOR_LIGHT,
  },
  oneriButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ICON_COLOR,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  oneriButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  oneriResult: {
    marginTop: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: spacing.md,
  },
  oneriResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  oneriResultTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: ICON_COLOR,
  },
  oneriResultText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: ICON_COLOR,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: ICON_COLOR,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR_LIGHT,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: ICON_COLOR,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    minHeight: 100,
    maxHeight: 300,
  },
  modalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  modalLoadingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: ICON_COLOR_LIGHT,
  },
  modalOneriText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: ICON_COLOR,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
