import React, { useState, useEffect, useCallback } from 'react';
import {
View,
Text,
StyleSheet,
SafeAreaView,
ScrollView,
TouchableOpacity,
RefreshControl,
TextInput,
ActivityIndicator,
Image,
} from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon } from '../../components';
import { piyasaApi, BistHisse, KriptoVeri, DovizKur, YatirimOnerisiResponse } from '../../api/piyasa';

type TabType = 'bist' | 'kripto' | 'doviz' | 'altin';

// Animated TouchableOpacity wrapper
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PiyasaScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
const [activeTab, setActiveTab] = useState<TabType>('bist');
const [refreshing, setRefreshing] = useState(false);
const [loading, setLoading] = useState(true);

// Data states
const [bistHisseler, setBistHisseler] = useState<BistHisse[]>([]);
const [kriptoListesi, setKriptoListesi] = useState<KriptoVeri[]>([]);
const [dovizKurlari, setDovizKurlari] = useState<DovizKur[]>([]);
const [altinFiyatlari, setAltinFiyatlari] = useState<any[]>([]);
const [oneriler, setOneriler] = useState<YatirimOnerisiResponse | null>(null);

// Takip states
const [takipEdilenHisseler, setTakipEdilenHisseler] = useState<Set<string>>(new Set());
const [takipEdilenKriptolar, setTakipEdilenKriptolar] = useState<Set<string>>(new Set());
const [takipEdilenDovizler, setTakipEdilenDovizler] = useState<Set<string>>(new Set());
const [takipEdilenAltinlar, setTakipEdilenAltinlar] = useState<Set<string>>(new Set());

// Döviz takip toggle
const toggleDovizTakip = (kod: string) => {
  setTakipEdilenDovizler(prev => {
    const yeni = new Set(prev);
    if (yeni.has(kod)) {
      yeni.delete(kod);
      Toast.show({ type: 'info', text1: `${kod} takipten çıkarıldı` });
    } else {
      yeni.add(kod);
      Toast.show({ type: 'success', text1: `${kod} takibe eklendi` });
    }
    return yeni;
  });
};

// Altın takip toggle
const toggleAltinTakip = (ad: string) => {
  setTakipEdilenAltinlar(prev => {
    const yeni = new Set(prev);
    if (yeni.has(ad)) {
      yeni.delete(ad);
      Toast.show({ type: 'info', text1: `${ad} takipten çıkarıldı` });
    } else {
      yeni.add(ad);
      Toast.show({ type: 'success', text1: `${ad} takibe eklendi` });
    }
    return yeni;
  });
};

// Search
const [bistSearch, setBistSearch] = useState('');
const [kriptoSearch, setKriptoSearch] = useState('');

// Cache info
const [cacheInfo, setCacheInfo] = useState<{ [key: string]: string }>({});

const fetchData = useCallback(async () => {
try {
setLoading(true);
const promises: Promise<any>[] = [];

if (activeTab === 'bist') {
promises.push(
piyasaApi.bist100().then(res => {
setBistHisseler(res.veri);
setCacheInfo(prev => ({ ...prev, bist: res.kaynaktan }));
})
);
}

if (activeTab === 'kripto') {
promises.push(
piyasaApi.kriptoListesi(20).then(res => {
setKriptoListesi(res.veri);
setCacheInfo(prev => ({ ...prev, kripto: res.kaynaktan }));
})
);
}

if (activeTab === 'doviz') {
promises.push(
piyasaApi.doviz().then(res => {
setDovizKurlari(res.veri);
setCacheInfo(prev => ({ ...prev, doviz: res.kaynaktan }));
})
);
}

if (activeTab === 'altin') {
promises.push(
piyasaApi.altin().then(res => {
setAltinFiyatlari(res.veri);
setCacheInfo(prev => ({ ...prev, altin: res.kaynaktan }));
}).catch(() => setAltinFiyatlari([]))
);
}

// Takip listesini de çek
try {
const takipListesi = await piyasaApi.takipListesi();
setTakipEdilenHisseler(new Set(takipListesi.hisseTakipler.map((t: any) => t.sembol)));
setTakipEdilenKriptolar(new Set(takipListesi.kriptoTakipler.map((t: any) => t.geckoId || t.sembol)));
} catch (e) {
console.log('Takip listesi alınamadı:', e);
}

await Promise.all(promises);
} catch (error: any) {
console.log('Piyasa fetch error:', error.response?.data || error);
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Piyasa verileri yüklenemedi',
});
} finally {
setLoading(false);
}
}, [activeTab]);

useEffect(() => {
fetchData();
}, [fetchData]);

const onRefresh = async () => {
setRefreshing(true);
await fetchData();
setRefreshing(false);
};

const formatCurrency = (value: number, decimals = 2) => {
return value.toLocaleString('tr-TR', {
minimumFractionDigits: decimals,
maximumFractionDigits: decimals,
});
};

const formatBuyukSayi = (value: number) => {
if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)} T`;
if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} B`;
if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
return value.toLocaleString('tr-TR');
};

const getRenk = (deger: number) => {
if (deger > 0) return colors.positive;
if (deger < 0) return colors.negative;
return colors.onSurfaceVariant;
};

const getIsaret = (deger: number) => {
if (deger > 0) return '+';
return '';
};

const filteredBist = bistHisseler.filter(hisse =>
hisse.sembol.toLowerCase().includes(bistSearch.toLowerCase()) ||
(hisse.ad && hisse.ad.toLowerCase().includes(bistSearch.toLowerCase()))
);

const filteredKripto = kriptoListesi.filter(k =>
k.sembol.toLowerCase().includes(kriptoSearch.toLowerCase()) ||
k.ad.toLowerCase().includes(kriptoSearch.toLowerCase())
);

const getRiskRengi = (risk: string) => {
switch (risk) {
case 'DUSUK': return colors.positive;
case 'ORTA': return '#fb8c00';
case 'YUKSEK': return colors.negative;
default: return colors.onSurfaceVariant;
}
};

// BİST hisseleri için placeholder renkleri
const BIST_RENKLERI = [
'#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
'#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
'#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
'#F44336', '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
];

const getHisseRengi = (sembol: string) => {
const index = sembol.charCodeAt(0) % BIST_RENKLERI.length;
return BIST_RENKLERI[index];
};

const renderTabs = () => (
<View style={styles.tabContainer}>
{[
{ key: 'bist', label: 'BİST' },
{ key: 'kripto', label: 'Kripto' },
{ key: 'doviz', label: 'Döviz' },
{ key: 'altin', label: 'Altın' },
].map(tab => (
<TouchableOpacity
key={tab.key}
style={[styles.tab, activeTab === tab.key && styles.tabActive]}
onPress={() => setActiveTab(tab.key as TabType)}
>
<Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
{tab.label}
</Text>
</TouchableOpacity>
))}
</View>
);

const TakipButton: React.FC<{
takipEdildi: boolean;
onPress: () => void;
type: 'hisse' | 'kripto';
}> = ({ takipEdildi, onPress, type }) => {
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
transform: [{ scale: scale.value }],
}));

const handlePressIn = () => {
scale.value = withSpring(0.9);
};

const handlePressOut = () => {
scale.value = withSpring(1);
};

return (
<AnimatedTouchable
style={[styles.takipButton, animatedStyle, takipEdildi && styles.takipButtonActive]}
onPress={onPress}
onPressIn={handlePressIn}
onPressOut={handlePressOut}
activeOpacity={1}
>
<Icon
name="star"
size={16}
color={takipEdildi ? '#FFD700' : colors.onSurfaceVariant}
/>
</AnimatedTouchable>
);
};

const handleTakip = async (type: 'hisse' | 'kripto', id: string, sembol: string) => {
try {
if (type === 'hisse') {
const takipEdildi = takipEdilenHisseler.has(sembol);
if (takipEdildi) {
await piyasaApi.takiptenCikar('HISSE', sembol);
setTakipEdilenHisseler(prev => {
const next = new Set(prev);
next.delete(sembol);
return next;
});
Toast.show({ type: 'success', text1: 'Takipten çıkarıldı', text2: sembol });
} else {
await piyasaApi.takibeEkle('HISSE', sembol);
setTakipEdilenHisseler(prev => new Set([...prev, sembol]));
Toast.show({ type: 'success', text1: 'Takibe eklendi', text2: sembol });
}
} else {
const takipEdildi = takipEdilenKriptolar.has(id);
if (takipEdildi) {
await piyasaApi.takiptenCikar('KRIPTO', id);
setTakipEdilenKriptolar(prev => {
const next = new Set(prev);
next.delete(id);
return next;
});
Toast.show({ type: 'success', text1: 'Takipten çıkarıldı', text2: sembol });
} else {
await piyasaApi.takibeEkle('KRIPTO', id);
setTakipEdilenKriptolar(prev => new Set([...prev, id]));
Toast.show({ type: 'success', text1: 'Takibe eklendi', text2: sembol });
}
}
} catch (error: any) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: error.response?.data?.message || 'İşlem başarısız',
});
}
};

const renderBist = () => (
<View>
<View style={styles.searchContainer}>
<TextInput
style={styles.searchInput}
placeholder="Hisse ara (sembol veya ad)..."
placeholderTextColor={colors.onSurfaceVariant}
value={bistSearch}
onChangeText={setBistSearch}
/>
</View>

{cacheInfo.bist && (
<View style={styles.cacheBadge}>
<Icon name="info" size={12} color={colors.onSurfaceVariant} />
<Text style={styles.cacheText}>
{cacheInfo.bist === 'cache' ? 'Cache' : 'Canlı'}
</Text>
</View>
)}

{loading ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
</View>
) : filteredBist.map((hisse: BistHisse, index: number) => {
const takipEdildi = takipEdilenHisseler.has(hisse.sembol);
return (
<Animated.View
key={hisse.sembol}
entering={FadeInDown.delay(index * 20).duration(300)}
>
<TouchableOpacity
style={styles.cardTouchable}
onPress={() => navigation?.navigate('HisseDetay', { sembol: hisse.sembol, ad: hisse.ad })}
activeOpacity={0.7}
>
<Card variant="default" style={styles.card}>
<View style={styles.cardHeader}>
<View style={styles.cardLeft}>
{hisse.icon ? (
<Image source={{ uri: hisse.icon }} style={styles.hisseIcon} resizeMode="contain" />
) : (
<View style={[styles.iconPlaceholder, { backgroundColor: getHisseRengi(hisse.sembol) }]}>
<Text style={styles.iconPlaceholderText}>{hisse.sembol.slice(0, 2)}</Text>
</View>
)}
<View style={styles.cardLeftText}>
<Text style={styles.sembol}>{hisse.sembol}</Text>
<Text style={styles.ad} numberOfLines={1}>{hisse.ad}</Text>
</View>
</View>
<View style={styles.fiyatContainer}>
<Text style={styles.fiyat}>₺{formatCurrency(hisse.satisFiyati)}</Text>
<Text style={[styles.degisim, { color: getRenk(hisse.degisimYuzde) }]}>
{getIsaret(hisse.degisimYuzde)}{formatCurrency(hisse.degisimYuzde)}%
</Text>
</View>
<TakipButton
takipEdildi={takipEdildi}
onPress={() => handleTakip('hisse', hisse.sembol, hisse.sembol)}
type="hisse"
/>
</View>
</Card>
</TouchableOpacity>
</Animated.View>
);
})}
</View>
);

const renderKripto = () => (
<View>
<View style={styles.searchContainer}>
<TextInput
style={styles.searchInput}
placeholder="Kripto ara..."
placeholderTextColor={colors.onSurfaceVariant}
value={kriptoSearch}
onChangeText={setKriptoSearch}
/>
</View>

{cacheInfo.kripto && (
<View style={styles.cacheBadge}>
<Icon name="info" size={12} color={colors.onSurfaceVariant} />
<Text style={styles.cacheText}>
{cacheInfo.kripto === 'cache' ? 'Cache' : 'Canlı'}
</Text>
</View>
)}

{loading ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
</View>
) : filteredKripto.map((kripto: KriptoVeri, index: number) => {
const takipEdildi = takipEdilenKriptolar.has(kripto.geckoId);
return (
<Animated.View
key={kripto.geckoId}
entering={FadeInDown.delay(index * 20).duration(300)}
>
<Card variant="default" style={styles.card}>
<View style={styles.cardHeader}>
<View style={styles.kriptoLeft}>
{kripto.ikon ? (
<Image source={{ uri: kripto.ikon }} style={styles.kriptoIcon} resizeMode="contain" />
) : (
<View style={styles.ikonContainer}>
<Text style={styles.ikonEmoji}>₿</Text>
</View>
)}
<View>
<Text style={styles.sembol}>{kripto.sembol}</Text>
<Text style={styles.ad}>{kripto.ad}</Text>
</View>
</View>
<View style={styles.fiyatContainer}>
<Text style={styles.fiyat}>${formatCurrency(kripto.usdFiyat, kripto.usdFiyat < 1 ? 6 : 2)}</Text>
<Text style={[styles.degisim, { color: getRenk(kripto.degisim24s || 0) }]}>
{getIsaret(kripto.degisim24s || 0)}{formatCurrency(kripto.degisim24s || 0)}%
</Text>
</View>
<TakipButton
takipEdildi={takipEdildi}
onPress={() => handleTakip('kripto', kripto.geckoId, kripto.sembol)}
type="kripto"
/>
</View>
<View style={styles.kriptoFooter}>
<Text style={styles.marketCap}>
MCap: ${formatBuyukSayi(kripto.piyasaDegeri || 0)}
</Text>
<Text style={styles.hacim}>
24s: ${formatBuyukSayi(kripto.hacim24s || 0)}
</Text>
</View>
</Card>
</Animated.View>
);
})}
</View>
);

const renderDoviz = () => (
<View>
{loading ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color="#1a1a1a" />
</View>
) : (
<>
{dovizKurlari.map((kur: DovizKur, index: number) => (
<Animated.View
key={kur.kod}
entering={FadeInDown.delay(index * 20).duration(250)}
style={{ marginBottom: 10 }}
>
<View style={styles.kurCard}>
<View style={styles.kurIconBox}>
<Icon name="globe" size={20} color="#1a1a1a" />
</View>
<View style={styles.kurBilgi}>
<Text style={styles.kurKod}>{kur.kod}</Text>
<Text style={styles.kurAd}>{kur.ad?.replace(kur.kod + ' ', '')}</Text>
</View>
<View style={styles.kurFiyatBox}>
<Text style={styles.kurFiyatLabel}>Alış: <Text style={styles.kurFiyat}>₺{formatCurrency(kur.alisKuru)}</Text></Text>
<Text style={styles.kurFiyatLabel}>Satış: <Text style={styles.kurFiyat}>₺{formatCurrency(kur.satisKuru)}</Text></Text>
</View>
<TouchableOpacity onPress={() => toggleDovizTakip(kur.kod)} style={styles.kurTakip}>
<Icon name="heart" size={16} color={takipEdilenDovizler.has(kur.kod) ? '#1a1a1a' : '#ccc'} />
</TouchableOpacity>
</View>
</Animated.View>
))}
</>
)}
</View>
);

const renderAltin = () => (
<View>
{loading ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color="#1a1a1a" />
</View>
) : (
<>
{/* Altın */}
<View style={styles.sectionHeader}>
<Icon name="coins" size={16} color="#1a1a1a" />
<Text style={styles.sectionTitle}>Altın Fiyatları</Text>
</View>
{altinFiyatlari.filter((a: any) => !a.ad?.toLowerCase().includes('gümüş')).map((altin: any, index: number) => (
<Animated.View
key={altin.ad + index}
entering={FadeInDown.delay(index * 20).duration(250)}
style={{ marginBottom: 10 }}
>
<View style={[styles.kurCard, { borderLeftWidth: 3, borderLeftColor: '#1a1a1a' }]}>
<View style={styles.kurIconBox}>
<Icon name="coins" size={20} color="#1a1a1a" />
</View>
<View style={styles.kurBilgi}>
<Text style={styles.kurKod}>{altin.ad}</Text>
<Text style={[styles.kurAd, { color: altin.degisimYuzde >= 0 ? '#333' : '#888' }]}>
{altin.degisimYuzde > 0 ? '+' : ''}{altin.degisimYuzde?.toFixed(2)}%
</Text>
</View>
<View style={styles.kurFiyatBox}>
<Text style={styles.kurFiyatLabel}>Alış: <Text style={styles.kurFiyat}>₺{formatCurrency(altin.alisFiyati)}</Text></Text>
<Text style={styles.kurFiyatLabel}>Satış: <Text style={styles.kurFiyat}>₺{formatCurrency(altin.satisFiyati)}</Text></Text>
</View>
<TouchableOpacity onPress={() => toggleAltinTakip(altin.ad)} style={styles.kurTakip}>
<Icon name="heart" size={16} color={takipEdilenAltinlar.has(altin.ad) ? '#1a1a1a' : '#ccc'} />
</TouchableOpacity>
</View>
</Animated.View>
))}

{/* Gümüş */}
{altinFiyatlari.some((a: any) => a.ad?.toLowerCase().includes('gümüş')) && (
<>
<View style={[styles.sectionHeader, { marginTop: 16 }]}>
<Icon name="gem" size={16} color="#666" />
<Text style={styles.sectionTitle}>Gümüş Fiyatları</Text>
</View>
{altinFiyatlari.filter((a: any) => a.ad?.toLowerCase().includes('gümüş')).map((gumus: any, index: number) => (
<Animated.View
key={gumus.ad + index}
entering={FadeInDown.delay(index * 20).duration(250)}
style={{ marginBottom: 10 }}
>
<View style={[styles.kurCard, { borderLeftWidth: 3, borderLeftColor: '#888' }]}>
<View style={styles.kurIconBox}>
<Icon name="gem" size={20} color="#666" />
</View>
<View style={styles.kurBilgi}>
<Text style={styles.kurKod}>{gumus.ad}</Text>
<Text style={styles.kurAd}>
{gumus.degisimYuzde > 0 ? '+' : ''}{gumus.degisimYuzde?.toFixed(2)}%
</Text>
</View>
<View style={styles.kurFiyatBox}>
<Text style={styles.kurFiyatLabel}>Alış: <Text style={styles.kurFiyat}>₺{formatCurrency(gumus.alisFiyati)}</Text></Text>
<Text style={styles.kurFiyatLabel}>Satış: <Text style={styles.kurFiyat}>₺{formatCurrency(gumus.satisFiyati)}</Text></Text>
</View>
<TouchableOpacity onPress={() => toggleAltinTakip(gumus.ad)} style={styles.kurTakip}>
<Icon name="heart" size={16} color={takipEdilenAltinlar.has(gumus.ad) ? '#1a1a1a' : '#ccc'} />
</TouchableOpacity>
</View>
</Animated.View>
))}
</>
)}
</>
)}
</View>
);

const renderOneriler = () => {
if (loading) {
return (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
</View>
);
}

return (
<View>
{oneriler?.aylikTasarruf !== undefined && (
<Card variant="featured" style={styles.tasarrufCard}>
<View style={styles.tasarrufHeader}>
<Icon name="wallet" size={24} color={colors.primary} />
<Text style={styles.tasarrufTitle}>Aylık Tasarruf Potansiyelin</Text>
</View>
<Text style={styles.tasarrufMiktar}>
₺{formatCurrency(oneriler?.aylikTasarruf || 0)}
</Text>
</Card>
)}

{oneriler?.mesaj && (
<Card variant="default" style={styles.uyariCard}>
<Text style={styles.uyariText}>{oneriler.mesaj}</Text>
</Card>
)}

{oneriler?.oneriler && (oneriler.oneriler as any[]).map((oneri: any, index: number) => {
return (
<Animated.View
key={oneri.baslik + index}
entering={FadeInDown.delay(index * 100).duration(400)}
>
<Card variant="default" style={[styles.oneriCard, { borderLeftWidth: 4, borderLeftColor: getRiskRengi(oneri.risk) }]}>
<View style={styles.oneriHeader}>
<View style={styles.oneriInfo}>
<Text style={styles.oneriBaslik}>{oneri.baslik}</Text>
<Text style={styles.oneriAciklama}>{oneri.aciklama}</Text>
</View>
<View style={[styles.riskBadge, { backgroundColor: getRiskRengi(oneri.risk) + '20' }]}>
<Text style={[styles.riskText, { color: getRiskRengi(oneri.risk) }]}>
{oneri.risk === 'DUSUK' ? 'Düşük Risk' : oneri.risk === 'ORTA' ? 'Orta Risk' : 'Yüksek Risk'}
</Text>
</View>
</View>

{oneri.miktar && (
<View style={styles.oneriMiktarRow}>
<Text style={styles.oneriMiktarLabel}>Alabileceğin Miktar:</Text>
<Text style={styles.oneriMiktarDeger}>
{oneri.miktar} {oneri.birim}
</Text>
</View>
)}

{oneri.guncelFiyat && (
<View style={styles.oneriFiyatRow}>
<Text style={styles.oneriFiyatLabel}>Güncel Fiyat:</Text>
<Text style={styles.oneriFiyatDeger}>
{oneri.birim === 'USD' ? '$' : '₺'}{formatCurrency(oneri.guncelFiyat)}
</Text>
</View>
)}
</Card>
</Animated.View>
);
})}
</View>
);
};

return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<Text style={styles.headerTitle}>Piyasa</Text>
<TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
<Icon name="repeat" size={20} color={colors.primary} />
</TouchableOpacity>
</View>

{renderTabs()}

<ScrollView
style={styles.scrollView}
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
>
{activeTab === 'bist' && renderBist()}
{activeTab === 'kripto' && renderKripto()}
{activeTab === 'doviz' && renderDoviz()}
{activeTab === 'altin' && renderAltin()}
</ScrollView>
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
headerTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 20,
color: colors.onSurface,
},
refreshButton: {
width: 40,
height: 40,
alignItems: 'center',
justifyContent: 'center',
},
tabContainer: {
flexDirection: 'row',
paddingHorizontal: spacing.containerMargin,
paddingVertical: spacing.sm,
borderBottomWidth: 1,
borderBottomColor: colors.borderLight,
},
tab: {
flex: 1,
paddingVertical: spacing.sm,
alignItems: 'center',
borderRadius: 8,
},
tabActive: {
backgroundColor: colors.primaryContainer,
},
tabText: {
fontFamily: 'Poppins_500Medium',
fontSize: 13,
color: colors.onSurfaceVariant,
},
tabTextActive: {
color: colors.onPrimary,
fontFamily: 'Poppins_600SemiBold',
},
scrollView: {
flex: 1,
},
scrollContent: {
padding: spacing.containerMargin,
paddingBottom: spacing.xxl,
},
searchContainer: {
marginBottom: spacing.md,
},
searchInput: {
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: 8,
padding: spacing.md,
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurface,
backgroundColor: colors.surfaceContainerLowest,
},
cacheBadge: {
flexDirection: 'row',
alignItems: 'center',
gap: 4,
marginBottom: spacing.sm,
},
cacheText: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: colors.onSurfaceVariant,
},
loadingContainer: {
alignItems: 'center',
paddingVertical: spacing.xxl * 2,
},
card: {
marginBottom: spacing.sm,
},
cardTouchable: {
marginBottom: spacing.sm,
},
cardHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
cardLeft: {
flexDirection: 'row',
alignItems: 'center',
flex: 1,
gap: spacing.sm,
},
cardLeftText: {
flex: 1,
},
sembol: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 15,
color: colors.onSurface,
},
ad: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
maxWidth: 150,
},
fiyatContainer: {
alignItems: 'flex-end',
marginRight: spacing.sm,
},
fiyat: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
},
degisim: {
fontFamily: 'Poppins_500Medium',
fontSize: 13,
},
takipButtonActive: {
backgroundColor: 'rgba(255,215,0,0.2)',
},
hisseIcon: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: colors.surfaceContainerHigh,
},
kriptoIcon: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: colors.surfaceContainerHigh,
},
iconPlaceholder: {
width: 40,
height: 40,
borderRadius: 20,
alignItems: 'center',
justifyContent: 'center',
},
iconPlaceholderText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: colors.surface,
fontWeight: '700',
},
kriptoLeft: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
},
ikonContainer: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: colors.surfaceContainerHigh,
alignItems: 'center',
justifyContent: 'center',
},
ikonEmoji: {
fontSize: 20,
},
kriptoFooter: {
flexDirection: 'row',
justifyContent: 'space-between',
marginTop: spacing.sm,
paddingTop: spacing.sm,
borderTopWidth: 1,
borderTopColor: colors.borderLight,
},
marketCap: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: colors.onSurfaceVariant,
},
hacim: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: colors.onSurfaceVariant,
},
dovizFiyatContainer: {
alignItems: 'flex-end',
},
dovizFiyatRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.xs,
},
dovizLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
},
dovizFiyat: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.onSurface,
},
tasarrufCard: {
marginBottom: spacing.md,
backgroundColor: colors.primaryContainer,
},
tasarrufHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginBottom: spacing.sm,
},
tasarrufTitle: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: '#e0e0e0',
},
tasarrufMiktar: {
fontFamily: 'Poppins_700Bold',
fontSize: 32,
color: colors.onPrimary,
},
uyariCard: {
marginBottom: spacing.md,
backgroundColor: colors.errorContainer,
},
uyariText: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onErrorContainer,
textAlign: 'center',
},
oneriCard: {
marginBottom: spacing.md,
},
oneriHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'flex-start',
},
oneriInfo: {
flex: 1,
paddingLeft: spacing.xs,
},
oneriBaslik: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
},
oneriAciklama: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
marginTop: 2,
},
riskBadge: {
paddingHorizontal: spacing.sm,
paddingVertical: 4,
borderRadius: 4,
},
riskText: {
fontFamily: 'Poppins_500Medium',
fontSize: 10,
},
oneriMiktarRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginTop: spacing.md,
paddingTop: spacing.sm,
borderTopWidth: 1,
borderTopColor: colors.borderLight,
},
oneriMiktarLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 13,
color: colors.onSurfaceVariant,
},
oneriMiktarDeger: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 18,
color: colors.primary,
},
oneriFiyatRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginTop: spacing.xs,
},
oneriFiyatLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
},
oneriFiyatDeger: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.onSurface,
},
sectionTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
marginLeft: spacing.xs,
},
sectionHeader: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: spacing.md,
marginTop: spacing.xs,
gap: spacing.xs,
},
dovizCard: {
marginBottom: 12,
padding: 0,
},
dovizCardContent: {
flexDirection: 'row',
alignItems: 'center',
paddingVertical: 12,
paddingHorizontal: 12,
},
dovizIconContainer: {
width: 40,
height: 40,
borderRadius: 10,
backgroundColor: '#f0f0f0',
alignItems: 'center',
justifyContent: 'center',
marginRight: 12,
},
dovizInfo: {
flex: 1,
marginRight: 8,
},
dovizKod: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: '#1a1a1a',
},
dovizAd: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: '#666666',
marginTop: 2,
},
dovizFiyatlar: {
flexDirection: 'column',
alignItems: 'flex-end',
marginRight: 8,
},
dovizFiyatItem: {
flexDirection: 'row',
alignItems: 'center',
},
dovizFiyatLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 10,
color: '#888888',
marginRight: 4,
},
dovizFiyatValue: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 13,
color: '#1a1a1a',
},
takipButton: {
width: 32,
height: 32,
borderRadius: 16,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#f5f5f5',
},
kurCard: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#ffffff',
borderRadius: 12,
padding: 14,
borderWidth: 1,
borderColor: '#e5e5e5',
},
kurIconBox: {
width: 40,
height: 40,
borderRadius: 10,
backgroundColor: '#f5f5f5',
alignItems: 'center',
justifyContent: 'center',
marginRight: 12,
},
kurBilgi: {
flex: 1,
},
kurKod: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: '#1a1a1a',
},
kurAd: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: '#888',
marginTop: 2,
},
kurFiyatBox: {
marginRight: 10,
},
kurFiyatLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: '#888',
textAlign: 'right',
},
kurFiyat: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 12,
color: '#1a1a1a',
},
kurTakip: {
width: 32,
height: 32,
borderRadius: 16,
backgroundColor: '#f5f5f5',
alignItems: 'center',
justifyContent: 'center',
},
});