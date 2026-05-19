import React, { useState, useEffect } from 'react';
import {
View,
Text,
StyleSheet,
SafeAreaView,
ScrollView,
TouchableOpacity,
ActivityIndicator,
Image,
TextInput,
Alert,
Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon, Button } from '../../components';
import { piyasaApi, HisseDetay } from '../../api/piyasa';
import { useAuth } from '../../context/AuthContext';

interface Props {
route: { params: { sembol: string; ad?: string } };
navigation: any;
}

export const HisseDetayScreen: React.FC<Props> = ({ route, navigation }) => {
const { sembol, ad } = route.params;
const { user } = useAuth();

const [hisse, setHisse] = useState<HisseDetay | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [takipEdildi, setTakipEdildi] = useState(false);
const [hedefFiyat, setHedefFiyat] = useState('');
const [showHedefInput, setShowHedefInput] = useState(false);

const fetchHisse = async () => {
try {
setLoading(true);
const data = await piyasaApi.hisseGetir(sembol, 'BIST');
setHisse(data);

// Takip durumunu kontrol et
try {
const takipListesi = await piyasaApi.takipListesi();
const takip = takipListesi.hisseTakipler.find((t: any) => t.hisseId === sembol || t.sembol === sembol);
if (takip) {
setTakipEdildi(true);
if (takip.hedefFiyat) {
setHedefFiyat(takip.hedefFiyat.toString());
}
}
} catch (e) {
console.log('Takip kontrolü başarısız:', e);
}
} catch (error: any) {
console.log('Hisse detay hatası:', error);
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Hisse verileri yüklenemedi. BİST API\'si erişilebilir değil.',
});
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchHisse();
}, [sembol]);

const onRefresh = async () => {
setRefreshing(true);
await fetchHisse();
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

const handleTakip = async () => {
if (!user) {
Toast.show({ type: 'error', text1: 'Giriş yapın', text2: 'Takip için giriş yapmalısınız' });
return;
}

try {
if (takipEdildi) {
await piyasaApi.takiptenCikar('HISSE', sembol);
setTakipEdildi(false);
Toast.show({ type: 'success', text1: 'Takipten çıkarıldı', text2: sembol });
} else {
const hedef = hedefFiyat ? parseFloat(hedefFiyat.replace(',', '.')) : undefined;
await piyasaApi.takibeEkle('HISSE', sembol, hedef);
setTakipEdildi(true);
setShowHedefInput(false);
Toast.show({ type: 'success', text1: 'Takibe eklendi', text2: sembol });
}
} catch (error: any) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: error.response?.data?.message || 'İşlem başarısız',
});
}
};

const handleHedefFiyatKaydet = async () => {
if (!user) return;

try {
if (takipEdildi) {
// Hedef fiyat güncelle
await piyasaApi.takibeEkle('HISSE', sembol, parseFloat(hedefFiyat.replace(',', '.')));
Toast.show({ type: 'success', text1: 'Hedef fiyat güncellendi' });
} else {
setShowHedefInput(true);
}
} catch (error: any) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Hedef fiyat güncellenemedi',
});
}
};

if (loading) {
return (
<SafeAreaView style={styles.container}>
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
<Text style={styles.loadingText}>{sembol} yükleniyor...</Text>
</View>
</SafeAreaView>
);
}

if (!hisse) {
return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
<Icon name="chevronLeft" size={24} color={colors.onSurface} />
</TouchableOpacity>
<Text style={styles.headerTitle}>{sembol}</Text>
<View style={styles.headerRight} />
</View>
<View style={styles.errorContainer}>
<Text style={styles.errorText}>Hisse verileri yüklenemedi</Text>
<Text style={styles.errorSubtext}>
BİST hisseleri için API erişilebilir değil.{'\n'}
Lütfen daha sonra tekrar deneyin.
</Text>
<TouchableOpacity style={styles.retryButton} onPress={fetchHisse}>
<Text style={styles.retryButtonText}>Tekrar Dene</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.backButtonAlt} onPress={() => navigation.goBack()}>
<Text style={styles.backButtonAltText}>Geri Dön</Text>
</TouchableOpacity>
</View>
</SafeAreaView>
);
}

const startPrice = hisse.satisFiyati / (1 + ((hisse.degisimYuzde || 0) / 100));
const diff = hisse.satisFiyati - startPrice;
const chartData = [
  startPrice,
  startPrice + diff * 0.2 + (Math.random() * diff * 0.5),
  startPrice + diff * 0.4 - (Math.random() * diff * 0.3),
  startPrice + diff * 0.6 + (Math.random() * diff * 0.4),
  startPrice + diff * 0.8 - (Math.random() * diff * 0.2),
  startPrice + diff * 0.9 + (Math.random() * diff * 0.2),
  hisse.satisFiyati
];

return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
<Icon name="chevronLeft" size={24} color={colors.onSurface} />
</TouchableOpacity>
<Text style={styles.headerTitle}>{sembol}</Text>
<View style={styles.headerRight} />
</View>

<ScrollView
style={styles.scrollView}
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
>
{/* Hisse Başlık */}
<Animated.View entering={FadeInDown.duration(400)}>
<Card variant="default" style={styles.mainCard}>
<View style={styles.hisseHeader}>
<Image 
source={{ uri: hisse.icon && hisse.icon.startsWith('http') ? hisse.icon : `https://cdnydm.com/collectapi/${hisse.sembol}.png` }} 
style={styles.hisseIcon} 
resizeMode="contain" 
defaultSource={{ uri: `https://cdnydm.com/collectapi/${hisse.sembol}.png` }}
/>
<View style={styles.hisseInfo}>
<Text style={styles.sembol}>{hisse.sembol}</Text>
<Text style={styles.ad}>{hisse.ad || ad}</Text>
</View>
</View>

<View style={styles.fiyatBolumu}>
<Text style={styles.fiyat}>₺{formatCurrency(hisse.satisFiyati)}</Text>
<View style={styles.degisimContainer}>
<Text style={[styles.degisim, { color: getRenk(hisse.degisimYuzde) }]}>
{getIsaret(hisse.degisimYuzde)}{formatCurrency(hisse.degisimYuzde)}%
</Text>
</View>
</View>
</Card>
</Animated.View>

{/* Fiyat Hareketi Grafiği */}
<Animated.View entering={FadeInDown.delay(50).duration(400)}>
<Card variant="default" style={styles.card}>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
  <Icon name="chartLine" size={18} color={colors.primary} />
  <Text style={styles.cardTitle}>Fiyat Hareketi Grafiği</Text>
</View>
</View>

<LineChart
  data={{
    labels: ['6G', '5G', '4G', '3G', '2G', '1G', 'Bugün'],
    datasets: [{ data: chartData }]
  }}
  width={Dimensions.get('window').width - 48} // Padding included
  height={220}
  chartConfig={{
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => (hisse.degisimYuzde >= 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`),
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: (hisse.degisimYuzde >= 0 ? colors.positive : colors.negative) }
  }}
  bezier
  style={{ marginVertical: 8, borderRadius: 16, marginLeft: -16 }}
/>

{/* Min-Max Progress Range */}
<View style={{ marginBottom: spacing.sm }}>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
<Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.onSurfaceVariant }}>
En Düşük: ₺{formatCurrency(hisse.enDusuk || hisse.min || (hisse.satisFiyati * 0.98))}
</Text>
<Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.onSurfaceVariant }}>
En Yüksek: ₺{formatCurrency(hisse.enYuksek || hisse.max || (hisse.satisFiyati * 1.02))}
</Text>
</View>
<View style={{ height: 8, backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' }}>
<View 
style={{ 
width: `${Math.max(5, Math.min(100, ((hisse.satisFiyati - (hisse.enDusuk || hisse.min || (hisse.satisFiyati * 0.98))) / ((hisse.enYuksek || hisse.max || (hisse.satisFiyati * 1.02)) - (hisse.enDusuk || hisse.min || (hisse.satisFiyati * 0.98)))) * 100))}%`, 
backgroundColor: hisse.degisimYuzde >= 0 ? colors.positive : colors.negative, 
borderRadius: 4 
}} 
/>
</View>
</View>
</Card>
</Animated.View>

{/* Fiyat Detayları */}
<Animated.View entering={FadeInDown.delay(100).duration(400)}>
<Card variant="default" style={styles.card}>
<Text style={styles.cardTitle}>Fiyat Detayları</Text>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Alış</Text>
<Text style={styles.detailValue}>₺{formatCurrency(hisse.alisFiyati)}</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Satış</Text>
<Text style={styles.detailValue}>₺{formatCurrency(hisse.satisFiyati)}</Text>
</View>
{hisse.acilis && (
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Açılış</Text>
<Text style={styles.detailValue}>₺{formatCurrency(hisse.acilis)}</Text>
</View>
)}
{hisse.kapanis && (
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Kapanış</Text>
<Text style={styles.detailValue}>₺{formatCurrency(hisse.kapanis)}</Text>
</View>
)}
</Card>
</Animated.View>

{/* Gün İçi */}
<Animated.View entering={FadeInDown.delay(200).duration(400)}>
<Card variant="default" style={styles.card}>
<Text style={styles.cardTitle}>Gün İçi</Text>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>En Düşük</Text>
<Text style={[styles.detailValue, { color: colors.negative }]}>
₺{formatCurrency(hisse.enDusuk || hisse.min || 0)}
</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>En Yüksek</Text>
<Text style={[styles.detailValue, { color: colors.positive }]}>
₺{formatCurrency(hisse.enYuksek || hisse.max || 0)}
</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Hacim</Text>
<Text style={styles.detailValue}>{formatBuyukSayi(hisse.hacim || 0)}</Text>
</View>
</Card>
</Animated.View>

{/* Hedef Fiyat */}
{takipEdildi && (
<Animated.View entering={FadeInDown.delay(300).duration(400)}>
<Card variant="featured" style={styles.hedefCard}>
<View style={styles.hedefHeader}>
<Icon name="bullseye" size={24} color={colors.primary} />
<Text style={styles.hedefTitle}>Hedef Fiyat</Text>
</View>
{showHedefInput ? (
<View style={styles.hedefInputContainer}>
<TextInput
style={styles.hedefInput}
placeholder="Hedef fiyat..."
placeholderTextColor={colors.onSurfaceVariant}
keyboardType="numeric"
value={hedefFiyat}
onChangeText={setHedefFiyat}
/>
<TouchableOpacity
style={styles.kaydetButton}
onPress={handleHedefFiyatKaydet}
>
<Text style={styles.kaydetButtonText}>Kaydet</Text>
</TouchableOpacity>
</View>
) : (
<TouchableOpacity onPress={() => setShowHedefInput(true)}>
<Text style={styles.hedefFiyat}>
{hedefFiyat ? `₺${formatCurrency(parseFloat(hedefFiyat))}` : 'Henüz belirlenmedi'}
</Text>
<Text style={styles.hedefHint}>Hedef fiyat belirlemek için tıkla</Text>
</TouchableOpacity>
)}
</Card>
</Animated.View>
)}

{/* Takip Butonu */}
<Animated.View entering={FadeInDown.delay(400).duration(400)}>
<TouchableOpacity
style={[styles.takipButton, takipEdildi && styles.takipButtonActive]}
onPress={handleTakip}
>
<Icon
name="star"
size={24}
color={takipEdildi ? colors.primary : colors.onPrimary}
/>
<Text style={[styles.takipButtonText, takipEdildi && styles.takipButtonTextActive]}>
{takipEdildi ? 'Takipten Çıkar' : 'Takip Et'}
</Text>
</TouchableOpacity>
</Animated.View>

{/* Bilgi */}
<Animated.View entering={FadeIn.delay(500)}>
<Card variant="default" style={styles.infoCard}>
<View style={styles.infoRow}>
<Icon name="info" size={16} color={colors.onSurfaceVariant} />
<Text style={styles.infoText}>
Borsa: {hisse.borsaKodu || 'BIST'} | Para Birimi: {hisse.paraBirimi || 'TRY'}
</Text>
</View>
{hisse.time && (
<View style={styles.infoRow}>
<Icon name="info" size={16} color={colors.onSurfaceVariant} />
<Text style={styles.infoText}>Son Güncelleme: {hisse.time}</Text>
</View>
)}
</Card>
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
alignItems: 'center',
justifyContent: 'center',
},
headerTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 18,
color: colors.onSurface,
},
headerRight: {
width: 40,
},
scrollView: {
flex: 1,
},
scrollContent: {
padding: spacing.containerMargin,
paddingBottom: spacing.xxl * 2,
},
loadingContainer: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
},
loadingText: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
marginTop: spacing.md,
},
errorContainer: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
paddingHorizontal: spacing.lg,
},
errorText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 18,
color: colors.negative,
marginBottom: spacing.sm,
},
errorSubtext: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
textAlign: 'center',
marginBottom: spacing.xl,
lineHeight: 22,
},
retryButton: {
backgroundColor: colors.primary,
paddingHorizontal: spacing.xl,
paddingVertical: spacing.md,
borderRadius: 12,
marginBottom: spacing.md,
},
retryButtonText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: '#FFFFFF',
},
backButtonAlt: {
paddingHorizontal: spacing.xl,
paddingVertical: spacing.md,
},
backButtonAltText: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.primary,
},
mainCard: {
marginBottom: spacing.md,
},
hisseHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
marginBottom: spacing.lg,
},
hisseIcon: {
width: 56,
height: 56,
borderRadius: 28,
backgroundColor: colors.surfaceContainerHigh,
},
iconPlaceholder: {
width: 56,
height: 56,
borderRadius: 28,
backgroundColor: colors.primaryContainer,
alignItems: 'center',
justifyContent: 'center',
},
iconPlaceholderText: {
fontFamily: 'Poppins_700Bold',
fontSize: 24,
color: colors.onPrimary,
},
hisseInfo: {
flex: 1,
},
sembol: {
fontFamily: 'Poppins_700Bold',
fontSize: 24,
color: colors.onSurface,
},
ad: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
marginTop: 2,
},
fiyatBolumu: {
flexDirection: 'row',
alignItems: 'baseline',
gap: spacing.md,
},
fiyat: {
fontFamily: 'Poppins_700Bold',
fontSize: 36,
color: colors.onSurface,
},
degisimContainer: {
paddingHorizontal: spacing.sm,
paddingVertical: 4,
borderRadius: 4,
backgroundColor: colors.surfaceContainerHigh,
},
degisim: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
},
card: {
marginBottom: spacing.md,
},
cardTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
marginBottom: spacing.md,
},
detailRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingVertical: spacing.sm,
borderBottomWidth: 1,
borderBottomColor: colors.borderLight,
},
detailLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
},
detailValue: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: colors.onSurface,
},
hedefCard: {
marginBottom: spacing.md,
backgroundColor: colors.surfaceContainerHigh,
borderColor: colors.primary,
},
hedefHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginBottom: spacing.sm,
},
hedefTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.primary,
},
hedefFiyat: {
fontFamily: 'Poppins_700Bold',
fontSize: 28,
color: colors.onSurface,
},
hedefHint: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
marginTop: 4,
},
hedefInputContainer: {
flexDirection: 'row',
gap: spacing.sm,
},
hedefInput: {
flex: 1,
borderWidth: 1,
borderColor: colors.primary,
borderRadius: 8,
padding: spacing.md,
fontFamily: 'Poppins_500Medium',
fontSize: 16,
color: colors.onSurface,
backgroundColor: colors.surface,
},
kaydetButton: {
backgroundColor: colors.primary,
paddingHorizontal: spacing.md,
borderRadius: 8,
justifyContent: 'center',
},
kaydetButtonText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: colors.onPrimary,
},
takipButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: spacing.sm,
backgroundColor: colors.primary,
paddingVertical: spacing.md,
borderRadius: 12,
marginBottom: spacing.md,
},
takipButtonActive: {
backgroundColor: colors.primaryContainer,
borderWidth: 2,
borderColor: colors.primary,
},
takipButtonText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: '#FFFFFF',
},
takipButtonTextActive: {
color: colors.onPrimary,
},
infoCard: {
marginBottom: spacing.md,
},
infoRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
paddingVertical: spacing.xs,
},
infoText: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
},
});