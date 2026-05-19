import React, { useState, useEffect, useCallback } from 'react';
import {
View,
Text,
StyleSheet,
SafeAreaView,
ScrollView,
TouchableOpacity,
RefreshControl,
Modal,
TextInput,
Alert,
ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon, ProgressBar, Button } from '../../components';
import { hedefApi, Hedef, HedefKatkiDto } from '../../api/hedef';
import { piyasaApi, BistHisse, KriptoVeri } from '../../api/piyasa';

interface YatirimHedefFiyat {
  sembol: string;
  guncelFiyat: number;
  alisFiyati?: number;
  degisimYuzde: number;
}

interface Props {
navigation?: any;
}

export const HedeflerScreen: React.FC<Props> = ({ navigation }) => {
const [refreshing, setRefreshing] = useState(false);
const [hedefler, setHedefler] = useState<Hedef[]>([]);
const [loading, setLoading] = useState(true);
const [katkiModalVisible, setKatkiModalVisible] = useState(false);
const [selectedHedef, setSelectedHedef] = useState<Hedef | null>(null);
const [katkiMiktar, setKatkiMiktar] = useState('');
const [katkiNot, setKatkiNot] = useState('');
const [savingKatkı, setSavingKatkı] = useState(false);
const [yatirimFiyatlar, setYatirimFiyatlar] = useState<Map<string, YatirimHedefFiyat>>(new Map());
const [fiyatYukleniyor, setFiyatYukleniyor] = useState(false);

// Yatırım hedefleri için güncel fiyatları getir
const fetchYatirimFiyatlari = useCallback(async (hedeflerData: Hedef[]) => {
  const yatirimHedefler = hedeflerData.filter(h => h.varlikSembol);
  if (yatirimHedefler.length === 0) return;
  
  setFiyatYukleniyor(true);
  const yeniFiyatlar = new Map<string, YatirimHedefFiyat>();
  
  try {
    const hisseHedefler = yatirimHedefler.filter(h => h.varlikTip === 'HISSE');
    const kriptoHedefler = yatirimHedefler.filter(h => h.varlikTip === 'KRIPTO');
    
    if (hisseHedefler.length > 0) {
      try {
        const bistData = await piyasaApi.bist100();
        const hisseler = bistData.veri || bistData || [];
        hisseHedefler.forEach(hedef => {
          const hisse = hisseler.find((h: any) => 
            (h.sembol || h.code || '').toUpperCase() === hedef.varlikSembol?.toUpperCase()
          );
          if (hisse) {
            const hObj = hisse as any;
            yeniFiyatlar.set(hedef.varlikSembol!, {
              sembol: hedef.varlikSembol!,
              guncelFiyat: hObj.satisFiyati || hObj.alisFiyati || parseFloat(hObj.lastprice || '0') || 0,
              alisFiyati: hObj.alisFiyati,
              degisimYuzde: hObj.degisimYuzde || parseFloat(hObj.rate || '0') || 0,
            });
          }
        });
      } catch (e) {
        console.log('Hisse fiyat hatası:', e);
      }
    }
    
    if (kriptoHedefler.length > 0) {
      try {
        const kriptoData = await piyasaApi.kriptoListesi(100);
        const kriptolar = kriptoData.veri || kriptoData || [];
        kriptoHedefler.forEach(hedef => {
          const kripto = kriptolar.find((k: any) => 
            (k.sembol || k.symbol || '').toUpperCase() === hedef.varlikSembol?.toUpperCase()
          );
          if (kripto) {
            const kObj = kripto as any;
            yeniFiyatlar.set(hedef.varlikSembol!, {
              sembol: hedef.varlikSembol!,
              guncelFiyat: kObj.usdFiyat || kObj.current_price || 0,
              degisimYuzde: kObj.degisim24s || kObj.price_change_percentage_24h || 0,
            });
          }
        });
      } catch (e) {
        console.log('Kripto fiyat hatası:', e);
      }
    }
    
    setYatirimFiyatlar(yeniFiyatlar);
  } catch (error) {
    console.log('Yatırım fiyat hatası:', error);
  } finally {
    setFiyatYukleniyor(false);
  }
}, []);

// Hedefleri getir
const fetchHedefler = useCallback(async () => {
try {
const data = await hedefApi.listele();
setHedefler(data);
await fetchYatirimFiyatlari(data);
} catch (error: any) {
console.log('Hedefler getirilemedi:', error.response?.data || error);
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Hedefler yüklenemedi',
});
} finally {
setLoading(false);
}
}, [fetchYatirimFiyatlari]);

useEffect(() => {
fetchHedefler();
}, [fetchHedefler]);

const onRefresh = async () => {
setRefreshing(true);
await fetchHedefler();
setRefreshing(false);
};

const formatCurrency = (value: number) => {
return `₺${value.toLocaleString('tr-TR')}`;
};

const getOncelikLabel = (oncelik: number) => {
switch (oncelik) {
case 3: return 'Yüksek';
case 2: return 'Orta';
default: return 'Düşük';
}
};

const getOncelikColor = (oncelik: number) => {
switch (oncelik) {
case 3: return colors.error;
case 2: return colors.secondary;
default: return colors.onSurfaceVariant;
}
};

const openKatkiModal = (hedef: Hedef) => {
setSelectedHedef(hedef);
setKatkiMiktar('');
setKatkiNot('');
setKatkiModalVisible(true);
};

const handleKatkı = async () => {
if (!selectedHedef || !katkiMiktar) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Miktar giriniz',
});
return;
}

const miktar = parseFloat(katkiMiktar);
if (isNaN(miktar) || miktar <= 0) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Geçerli bir miktar giriniz',
});
return;
}

setSavingKatkı(true);
try {
const data: HedefKatkiDto = {
miktar,
notlar: katkiNot || undefined,
};

const result = await hedefApi.katki(selectedHedef.id, data);

if (result.tamamlandi) {
Toast.show({
type: 'success',
text1: '🎉 Hedef Tamamlandı!',
text2: `${selectedHedef.baslik} hedefine ulaştınız!`,
});
} else {
Toast.show({
type: 'success',
text1: 'Katkı Eklendi',
text2: `${formatCurrency(miktar)} eklendi`,
});
}

setKatkiModalVisible(false);
await fetchHedefler();
} catch (error: any) {
console.log('Katkı hatası:', error.response?.data || error);
Toast.show({
type: 'error',
text1: 'Hata',
text2: error.response?.data?.message || 'Katkı yapılamadı',
});
} finally {
setSavingKatkı(false);
}
};

const handleSil = async (hedef: Hedef) => {
Alert.alert(
'Hedef Sil',
`"${hedef.baslik}" hedefini silmek istediğinize emin misiniz?`,
[
{ text: 'İptal', style: 'cancel' },
{
text: 'Sil',
style: 'destructive',
onPress: async () => {
try {
await hedefApi.sil(hedef.id);
Toast.show({
type: 'success',
text1: 'Silindi',
text2: 'Hedef silindi',
});
await fetchHedefler();
} catch (error: any) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Hedef silinemedi',
});
}
},
},
]
);
};

const getDurumLabel = (durum: string) => {
switch (durum) {
case 'TAMAMLANDI': return 'Tamamlandı';
case 'IPTAL_EDILDI': return 'İptal Edildi';
default: return 'Devam Ediyor';
}
};

const getDurumColor = (durum: string) => {
switch (durum) {
case 'TAMAMLANDI': return colors.primary;
case 'IPTAL_EDILDI': return colors.error;
default: return colors.secondary;
}
};

return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<Text style={styles.headerTitle}>Hedeflerim</Text>
<TouchableOpacity
style={styles.addButton}
onPress={() => navigation?.navigate('HedefEkle')}
>
<Icon name="plus" size={18} color={colors.primary} />
</TouchableOpacity>
</View>

<ScrollView
style={styles.scrollView}
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
>
{loading ? (
<View style={styles.loadingState}>
<Text style={styles.loadingText}>Yükleniyor...</Text>
</View>
) : hedefler.length > 0 ? (
hedefler.map((hedef, index) => {
const yuzde = hedef.yuzde || Math.round((hedef.mevcutMiktar / hedef.hedefMiktar) * 100);
const kalan = hedef.kalan || (hedef.hedefMiktar - hedef.mevcutMiktar);

return (
<Animated.View
key={hedef.id}
entering={FadeInDown.delay(index * 100).duration(400)}
>
<Card variant="outlined" style={styles.hedefCard}>
<View style={styles.hedefHeader}>
<View style={[styles.hedefIcon, { backgroundColor: hedef.renk + '20' }]}>
<Icon name="bullseye" size={18} color={hedef.renk || colors.primary} />
</View>
<View style={styles.hedefInfo}>
<View style={styles.baslikRow}>
<Text style={styles.hedefBaslik}>{hedef.baslik}</Text>
<View style={[styles.durumBadge, { backgroundColor: getDurumColor(hedef.durum) + '20' }]}>
<Text style={[styles.durumText, { color: getDurumColor(hedef.durum) }]}>
{getDurumLabel(hedef.durum)}
</Text>
</View>
</View>
<View style={styles.metaRow}>
<Text style={styles.hedefYuzde}>{yuzde}% tamamlandı</Text>
<Text style={[styles.oncelikText, { color: getOncelikColor(hedef.oncelik) }]}>
{getOncelikLabel(hedef.oncelik)}
</Text>
</View>
</View>
</View>

<ProgressBar
progress={yuzde}
height={8}
color={hedef.renk || colors.secondary}
style={styles.hedefProgress}
/>

<View style={styles.hedefFooter}>
<Text style={styles.hedefMevcut}>
{formatCurrency(hedef.mevcutMiktar)}
</Text>
<Text style={styles.hedefHedef}>
/ {formatCurrency(hedef.hedefMiktar)}
</Text>
<Text style={styles.kalanText}>
Kalan: {formatCurrency(Math.max(kalan, 0))}
</Text>
</View>

{hedef.hedefTarihi && (
<View style={styles.tarihRow}>
<Icon name="calendar" size={14} color={colors.onSurfaceVariant} />
<Text style={styles.tarihText}>
Hedef: {new Date(hedef.hedefTarihi).toLocaleDateString('tr-TR')}
</Text>
{hedef.kalanGun !== null && hedef.kalanGun !== undefined && (
<Text style={[
styles.kalanGunText,
hedef.kalanGun < 0 && { color: colors.error },
hedef.kalanGun <= 7 && hedef.kalanGun >= 0 && { color: colors.secondary },
]}>
{hedef.kalanGun < 0
? `${Math.abs(hedef.kalanGun)} gün geçti`
: `${hedef.kalanGun} gün kaldı`
}
</Text>
)}
</View>
)}

{hedef.varlikSembol && (() => {
  const fiyatBilgi = yatirimFiyatlar.get(hedef.varlikSembol);
  const guncelDeger = fiyatBilgi && hedef.varlikAdet 
    ? fiyatBilgi.guncelFiyat * hedef.varlikAdet 
    : 0;
  const karZarar = guncelDeger > 0 ? guncelDeger - hedef.hedefMiktar : 0;
  const karZararYuzde = hedef.hedefMiktar > 0 ? (karZarar / hedef.hedefMiktar) * 100 : 0;
  const karMi = karZarar >= 0;
  
  return (
    <View style={styles.yatirimContainer}>
      <View style={styles.yatirimHeader}>
        <Icon name="chartLine" size={16} color={colors.primary} />
        <Text style={styles.yatirimBaslik}>
          Yatırım Hedefi: {hedef.varlikAdet} adet {hedef.varlikSembol}
        </Text>
        <View style={[styles.yatirimTipBadge, { backgroundColor: hedef.varlikTip === 'HISSE' ? '#1976D2' : '#FF9800' }]}>
          <Text style={styles.yatirimTipText}>{hedef.varlikTip === 'HISSE' ? 'BIST' : 'Kripto'}</Text>
        </View>
      </View>
      
      {fiyatYukleniyor ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
      ) : fiyatBilgi ? (
        <View style={styles.yatirimDetay}>
          <View style={styles.yatirimFiyatRow}>
            <Text style={styles.yatirimLabel}>Birim Fiyat:</Text>
            <Text style={styles.yatirimDeger}>
              {hedef.varlikTip === 'KRIPTO' ? '$' : '₺'}{fiyatBilgi.guncelFiyat.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
            </Text>
            <View style={[styles.degisimBadge, { backgroundColor: fiyatBilgi.degisimYuzde >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
              <Icon name={fiyatBilgi.degisimYuzde >= 0 ? 'arrowUp' : 'arrowDown'} size={10} color={fiyatBilgi.degisimYuzde >= 0 ? '#4CAF50' : '#F44336'} />
              <Text style={[styles.degisimText, { color: fiyatBilgi.degisimYuzde >= 0 ? '#4CAF50' : '#F44336' }]}>
                {Math.abs(fiyatBilgi.degisimYuzde).toFixed(2)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.yatirimFiyatRow}>
            <Text style={styles.yatirimLabel}>Toplam Değer:</Text>
            <Text style={[styles.yatirimDeger, styles.yatirimDegerBuyuk]}>
              {hedef.varlikTip === 'KRIPTO' ? '$' : '₺'}{guncelDeger.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <View style={[styles.karZararBox, { backgroundColor: karMi ? '#E8F5E9' : '#FFEBEE' }]}>
            <Icon name={karMi ? 'arrowUp' : 'arrowDown'} size={18} color={karMi ? '#4CAF50' : '#F44336'} />
            <View>
              <Text style={[styles.karZararLabel, { color: karMi ? '#4CAF50' : '#F44336' }]}>
                {karMi ? 'Kar' : 'Zarar'}
              </Text>
              <Text style={[styles.karZararDeger, { color: karMi ? '#4CAF50' : '#F44336' }]}>
                {karMi ? '+' : ''}{hedef.varlikTip === 'KRIPTO' ? '$' : '₺'}{karZarar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                {' '}({karZararYuzde >= 0 ? '+' : ''}{karZararYuzde.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.yatirimHata}>Fiyat bilgisi alınamadı</Text>
      )}
    </View>
  );
})()}

{hedef.aciklama && (
<Text style={styles.aciklamaText} numberOfLines={2}>
{hedef.aciklama}
</Text>
)}

<View style={styles.actionRow}>
{hedef.durum === 'DEVAM_EDIYOR' && (
<TouchableOpacity
style={styles.katkiButton}
onPress={() => openKatkiModal(hedef)}
>
<Icon name="plus" size={14} color={colors.onPrimary} />
<Text style={styles.katkiButtonText}>Para Ekle</Text>
</TouchableOpacity>
)}
<TouchableOpacity
style={styles.deleteButton}
onPress={() => handleSil(hedef)}
>
<Icon name="trash" size={14} color={colors.error} />
</TouchableOpacity>
</View>
</Card>
</Animated.View>
);
})
) : (
<View style={styles.emptyState}>
<View style={styles.emptyIcon}>
<Icon name="bullseye" size={48} color={colors.outline} />
</View>
<Text style={styles.emptyTitle}>Henüz hedef yok</Text>
<Text style={styles.emptySubtitle}>
Tasarruf hedeflerinizi belirleyerek finansal hedeflerinize ulaşın.
</Text>
<Button
title="İLK HEDEFİNİ EKLE"
onPress={() => navigation?.navigate('HedefEkle')}
style={styles.emptyButton}
/>
</View>
)}
</ScrollView>

{/* Katkı Modalı */}
<Modal
visible={katkiModalVisible}
animationType="slide"
transparent={true}
onRequestClose={() => setKatkiModalVisible(false)}
>
<View style={styles.modalOverlay}>
<View style={styles.modalContent}>
<View style={styles.modalHeader}>
<Text style={styles.modalTitle}>
{selectedHedef?.baslik} - Para Ekle
</Text>
<TouchableOpacity onPress={() => setKatkiModalVisible(false)}>
<Icon name="times" size={20} color={colors.onSurfaceVariant} />
</TouchableOpacity>
</View>

<Text style={styles.modalSubtitle}>
Hedef: {selectedHedef && formatCurrency(selectedHedef.hedefMiktar)}
</Text>
<Text style={styles.modalSubtitle}>
Mevcut: {selectedHedef && formatCurrency(selectedHedef.mevcutMiktar)}
</Text>
<Text style={styles.modalSubtitle}>
Kalan: {selectedHedef && formatCurrency(Math.max((selectedHedef.hedefMiktar - selectedHedef.mevcutMiktar), 0))}
</Text>

<TextInput
style={styles.modalInput}
placeholder="Miktar (₺)"
keyboardType="decimal-pad"
value={katkiMiktar}
onChangeText={setKatkiMiktar}
placeholderTextColor={colors.onSurfaceVariant}
/>

<TextInput
style={[styles.modalInput, styles.modalInputMultiline]}
placeholder="Not (opsiyonel)"
value={katkiNot}
onChangeText={setKatkiNot}
multiline
numberOfLines={2}
placeholderTextColor={colors.onSurfaceVariant}
/>

<View style={styles.modalButtons}>
<Button
title="İPTAL"
variant="secondary"
onPress={() => setKatkiModalVisible(false)}
style={styles.modalCancelButton}
/>
<Button
title="EKLE"
onPress={handleKatkı}
loading={savingKatkı}
style={styles.modalAddButton}
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
headerTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 20,
color: colors.onSurface,
},
addButton: {
width: 36,
height: 36,
borderWidth: 1,
borderColor: colors.primary,
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
loadingState: {
alignItems: 'center',
paddingVertical: spacing.xxl,
},
loadingText: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
},
hedefCard: {
marginBottom: spacing.md,
},
hedefHeader: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: spacing.md,
},
hedefIcon: {
width: 44,
height: 44,
borderRadius: 22,
alignItems: 'center',
justifyContent: 'center',
marginRight: spacing.md,
},
hedefInfo: {
flex: 1,
},
baslikRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
hedefBaslik: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
flex: 1,
},
durumBadge: {
paddingHorizontal: spacing.sm,
paddingVertical: 2,
borderRadius: 4,
marginLeft: spacing.xs,
},
durumText: {
fontFamily: 'Poppins_500Medium',
fontSize: 10,
},
metaRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginTop: 2,
},
hedefYuzde: {
fontFamily: 'Poppins_400Regular',
fontSize: 13,
color: colors.onSurfaceVariant,
},
oncelikText: {
fontFamily: 'Poppins_500Medium',
fontSize: 11,
},
hedefProgress: {
marginBottom: spacing.md,
},
hedefFooter: {
flexDirection: 'row',
alignItems: 'baseline',
marginBottom: spacing.xs,
},
hedefMevcut: {
fontFamily: 'Poppins_700Bold',
fontSize: 24,
color: colors.onSurface,
},
hedefHedef: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
marginLeft: spacing.xs,
},
kalanText: {
fontFamily: 'Poppins_500Medium',
fontSize: 12,
color: colors.onSurfaceVariant,
marginLeft: 'auto',
},
tarihRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.xs,
marginBottom: spacing.xs,
},
tarihText: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
},
kalanGunText: {
fontFamily: 'Poppins_500Medium',
fontSize: 12,
color: colors.primary,
marginLeft: 'auto',
},
aciklamaText: {
fontFamily: 'Poppins_400Regular',
fontSize: 13,
color: colors.onSurfaceVariant,
marginBottom: spacing.sm,
},
actionRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginTop: spacing.sm,
},
katkiButton: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: spacing.xs,
backgroundColor: colors.primary,
paddingVertical: spacing.sm,
borderRadius: 4,
},
katkiButtonText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 13,
color: colors.onPrimary,
},
deleteButton: {
padding: spacing.sm,
borderWidth: 1,
borderColor: colors.error,
borderRadius: 4,
},
emptyState: {
alignItems: 'center',
paddingVertical: spacing.xxl * 2,
},
emptyIcon: {
width: 100,
height: 100,
borderRadius: 50,
backgroundColor: colors.surfaceContainerHigh,
alignItems: 'center',
justifyContent: 'center',
marginBottom: spacing.lg,
},
emptyTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 20,
color: colors.onSurface,
marginBottom: spacing.sm,
},
emptySubtitle: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
textAlign: 'center',
maxWidth: 280,
lineHeight: 22,
marginBottom: spacing.xl,
},
emptyButton: {
paddingHorizontal: spacing.xl,
},
modalOverlay: {
flex: 1,
backgroundColor: 'rgba(0,0,0,0.5)',
justifyContent: 'flex-end',
},
modalContent: {
backgroundColor: colors.surface,
borderTopLeftRadius: 20,
borderTopRightRadius: 20,
padding: spacing.lg,
paddingBottom: spacing.xxl,
},
modalHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: spacing.md,
},
modalTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 18,
color: colors.onSurface,
},
modalSubtitle: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurfaceVariant,
marginBottom: spacing.xs,
},
modalInput: {
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: 8,
padding: spacing.md,
fontFamily: 'Poppins_400Regular',
fontSize: 16,
color: colors.onSurface,
marginTop: spacing.md,
},
modalInputMultiline: {
minHeight: 60,
textAlignVertical: 'top',
},
modalButtons: {
flexDirection: 'row',
gap: spacing.md,
marginTop: spacing.lg,
},
modalCancelButton: {
flex: 1,
},
modalAddButton: {
flex: 1,
},
yatirimContainer: {
backgroundColor: colors.surfaceContainerHigh,
borderRadius: 12,
padding: spacing.md,
marginBottom: spacing.md,
borderWidth: 1,
borderColor: colors.primaryContainer,
},
yatirimHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginBottom: spacing.sm,
},
yatirimBaslik: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 13,
color: colors.onSurface,
flex: 1,
},
yatirimTipBadge: {
paddingHorizontal: spacing.sm,
paddingVertical: 2,
borderRadius: 4,
},
yatirimTipText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 10,
color: '#FFF',
},
yatirimDetay: {
gap: spacing.sm,
},
yatirimFiyatRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
},
yatirimLabel: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
},
yatirimDeger: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: colors.onSurface,
},
yatirimDegerBuyuk: {
fontSize: 18,
color: colors.primary,
},
degisimBadge: {
flexDirection: 'row',
alignItems: 'center',
gap: 2,
paddingHorizontal: 6,
paddingVertical: 2,
borderRadius: 4,
},
degisimText: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 11,
},
karZararBox: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
padding: spacing.sm,
borderRadius: 8,
marginTop: spacing.xs,
},
karZararLabel: {
fontFamily: 'Poppins_500Medium',
fontSize: 11,
},
karZararDeger: {
fontFamily: 'Poppins_700Bold',
fontSize: 16,
},
yatirimHata: {
fontFamily: 'Poppins_400Regular',
fontSize: 12,
color: colors.onSurfaceVariant,
fontStyle: 'italic',
},
});
