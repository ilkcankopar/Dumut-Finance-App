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
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Button, Input, Icon, AnimatedBox, ProgressBar, SegmentedControl } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { piyasaApi } from '../../api/piyasa';

interface HedefItem {
id: string;
baslik: string;
hedefMiktar: string;
aciklama: string;
hedefTarihi?: string;
oncelik: 1 | 2 | 3;
herkesGorsun: boolean;
renk: string;
varlikSembol?: string;
varlikAdet?: string;
varlikTip?: string;
}

const hedefOneriler = [
{ baslik: 'Acil Durum Fonu', miktar: '30000', aciklama: '3-6 aylık giderlerinizi karşılayacak bir fon', oncelik: 3 as 1 | 2 | 3, renk: '#e53935' },
{ baslik: 'Tatil', miktar: '15000', aciklama: 'Hayalinizdeki tatil için birikim', oncelik: 2 as 1 | 2 | 3, renk: '#43a047' },
{ baslik: 'Yeni Telefon', miktar: '50000', aciklama: 'Yeni bir telefon almak için', oncelik: 1 as 1 | 2 | 3, renk: '#1e88e5' },
{ baslik: 'Araba', miktar: '500000', aciklama: 'Araba alımı için birikim', oncelik: 3 as 1 | 2 | 3, renk: '#fb8c00' },
{ baslik: 'Ev', miktar: '2000000', aciklama: 'Ev sahibi olmak için', oncelik: 3 as 1 | 2 | 3, renk: '#8e24aa' },
];

const renkSecenekleri = [
'#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
'#E91E63', '#00BCD4', '#795548', '#607D8B',
'#F44336', '#3F51B5', '#009688', '#FFC107',
];

interface Props {
navigation: any;
route: {
params?: {
sabitIslemler?: any[];
kullaniciTipi?: any;
butceProfili?: {
aylikToplamGelir: number;
aylikHedefHarcama: number;
} | null;
};
};
}

export const HedefEkleScreen: React.FC<Props> = ({ navigation, route }) => {
const { completeOnboarding } = useAuth();
const params = route.params || {};

// Onboarding modunda mı? (params varsa onboarding)
const isOnboarding = !!params.sabitIslemler || !!params.butceProfili;
const sabitIslemler = params.sabitIslemler || [];
const butceProfili = params.butceProfili || null;

const [hedefler, setHedefler] = useState<HedefItem[]>([]);
const [formData, setFormData] = useState({
baslik: '',
hedefMiktar: '',
aciklama: '',
hedefTarihi: '',
oncelik: 2 as 1 | 2 | 3,
herkesGorsun: false,
renk: '#4CAF50',
varlikSembol: '',
varlikAdet: '',
varlikTip: 'HISSE',
});
const [showForm, setShowForm] = useState(false);
const [saving, setSaving] = useState(false);
const [isYatirimHedefi, setIsYatirimHedefi] = useState(false);
const [bistList, setBistList] = useState<any[]>([]);
const [kriptoList, setKriptoList] = useState<any[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [showPickerModal, setShowPickerModal] = useState(false);
const [selectedAssetPrice, setSelectedAssetPrice] = useState<number>(0);

useEffect(() => {
piyasaApi.bist100().then((res: any) => setBistList(res.veri || res || [])).catch(() => {});
piyasaApi.kriptoListesi(100).then((res: any) => setKriptoList(res.veri || res || [])).catch(() => {});
}, []);

const oncelikOptions = [
{ value: '1', label: 'Düşük' },
{ value: '2', label: 'Orta' },
{ value: '3', label: 'Yüksek' },
];

const addHedef = () => {
if (!formData.baslik || !formData.baslik.trim()) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Hedef adı giriniz',
});
return;
}

if (!formData.hedefMiktar || parseFloat(formData.hedefMiktar) <= 0) {
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Geçerli bir miktar giriniz',
});
return;
}

const yeniHedef: HedefItem = {
id: Date.now().toString(),
baslik: formData.baslik.trim(),
hedefMiktar: formData.hedefMiktar,
aciklama: formData.aciklama || '',
hedefTarihi: formData.hedefTarihi || undefined,
oncelik: formData.oncelik,
herkesGorsun: formData.herkesGorsun,
renk: formData.renk,
varlikSembol: (isYatirimHedefi && formData.varlikSembol.trim()) ? formData.varlikSembol.trim().toUpperCase() : undefined,
varlikAdet: (isYatirimHedefi && formData.varlikAdet) ? formData.varlikAdet : undefined,
varlikTip: isYatirimHedefi ? formData.varlikTip : undefined,
};

setHedefler([...hedefler, yeniHedef]);
setFormData({
baslik: '',
hedefMiktar: '',
aciklama: '',
hedefTarihi: '',
oncelik: 2,
herkesGorsun: false,
renk: '#4CAF50',
varlikSembol: '',
varlikAdet: '',
varlikTip: 'HISSE',
});
setIsYatirimHedefi(false);
setShowForm(false);

Toast.show({
type: 'success',
text1: 'Eklendi',
text2: `${yeniHedef.baslik} hedefi eklendi`,
});
};

const selectOneri = (oneri: typeof hedefOneriler[0]) => {
const yeniHedef: HedefItem = {
id: Date.now().toString(),
baslik: oneri.baslik,
hedefMiktar: oneri.miktar,
aciklama: oneri.aciklama,
hedefTarihi: undefined,
oncelik: oneri.oncelik,
herkesGorsun: false,
renk: oneri.renk,
};
setHedefler([...hedefler, yeniHedef]);

Toast.show({
type: 'success',
text1: 'Eklendi',
text2: `${yeniHedef.baslik} hedefi eklendi`,
});
};

const removeHedef = (id: string) => {
setHedefler(hedefler.filter((h) => h.id !== id));
};

const handleComplete = async () => {
setSaving(true);
try {
if (isOnboarding) {
// ONBOARDING MODU - Sona geldik, Kayıt Ekranına Yönlendir
// navigation.reset kullanarak stack'i temizle, böylece geri tuşuna basınca HedefEkle'ye dönülmez
navigation.reset({
  index: 0,
  routes: [{
    name: 'Kayit',
    params: {
      kullaniciTipi: route.params?.kullaniciTipi || 'BUSINESS',
      onboardingData: {
        butceProfili,
        sabitIslemler,
        hedefler,
      }
    }
  }],
});
} else {
// NORMAL MOD - Sadece hedefleri kaydet ve geri dön
for (const hedef of hedefler) {
try {
const payload: any = {
baslik: hedef.baslik,
hedefMiktar: parseFloat(hedef.hedefMiktar),
oncelik: hedef.oncelik,
herkesGorsun: hedef.herkesGorsun,
renk: hedef.renk,
varlikSembol: hedef.varlikSembol,
varlikAdet: hedef.varlikAdet ? parseFloat(hedef.varlikAdet) : undefined,
varlikTip: hedef.varlikTip,
};

if (hedef.aciklama) {
payload.aciklama = hedef.aciklama;
}

if (hedef.hedefTarihi) {
payload.hedefTarihi = hedef.hedefTarihi;
}

await apiClient.post('/hedef', payload);
} catch (hedefError) {
console.log('Hedef kaydetme hatası:', hedef.baslik, hedefError);
}
}

Toast.show({
type: 'success',
text1: 'Kaydedildi',
text2: 'Hedefleriniz eklendi',
});
navigation?.goBack();
}
} catch (error: any) {
console.log('Hata:', error.response?.data || error);
Toast.show({
type: 'error',
text1: 'Hata',
text2: 'Bir hata oluştu',
});
if (isOnboarding) {
await completeOnboarding();
}
} finally {
setSaving(false);
}
};

const handleSkip = async () => {
if (!isOnboarding) {
// Normal modda geri dön
navigation?.goBack();
return;
}

// navigation.reset kullanarak stack'i temizle
navigation.reset({
  index: 0,
  routes: [{
    name: 'Kayit',
    params: {
      kullaniciTipi: route.params?.kullaniciTipi || 'BUSINESS',
      onboardingData: {
        butceProfili,
        sabitIslemler,
        hedefler: [],
      }
    }
  }],
});
};

const getOncelikLabel = (oncelik: number) => {
switch (oncelik) {
case 3: return 'Yüksek';
case 2: return 'Orta';
default: return 'Düşük';
}
};

const toplamHedef = hedefler.reduce((acc, h) => acc + parseFloat(h.hedefMiktar || '0'), 0);

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
<View style={[styles.progressStep, styles.progressStepActive]} />
</View>

<Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
<Text style={styles.stepLabel}>ADIM 3/3</Text>
<Text style={styles.title}>Hedefleriniz</Text>
<Text style={styles.subtitle}>
Tasarruf hedeflerinizi belirleyin. Bu hedefler sizi motive edecek ve ilerlemenizi takip etmenizi sağlayacak.
</Text>
</Animated.View>

{!showForm && (
<>
<Text style={styles.sectionTitle}>Önerilen Hedefler</Text>
<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
style={styles.oneriScroll}
>
{hedefOneriler
.filter((o) => !hedefler.some((h) => h.baslik === o.baslik))
.map((oneri) => (
<TouchableOpacity
key={oneri.baslik}
style={[styles.oneriCard, { borderLeftWidth: 3, borderLeftColor: oneri.renk }]}
onPress={() => selectOneri(oneri)}
activeOpacity={0.7}
>
<Text style={styles.oneriBaslik}>{oneri.baslik}</Text>
<Text style={styles.oneriMiktar}>
₺{parseInt(oneri.miktar).toLocaleString('tr-TR')}
</Text>
<Text style={styles.oneriPeriyot}>{getOncelikLabel(oneri.oncelik)} Öncelik</Text>
</TouchableOpacity>
))}
</ScrollView>

<TouchableOpacity
style={styles.customHedefButton}
onPress={() => setShowForm(true)}
>
<Text style={styles.customHedefText}>+ Özel Hedef Ekle</Text>
</TouchableOpacity>
</>
)}

{showForm && (
<AnimatedBox variant="elevated" delay={0} style={styles.formCard}>
<View style={styles.formHeader}>
<Text style={styles.formTitle}>Yeni Hedef</Text>
<TouchableOpacity onPress={() => setShowForm(false)}>
<Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: colors.onSurfaceVariant }}>×</Text>
</TouchableOpacity>
</View>

<Input
label="HEDEF ADI"
placeholder="örn. Yeni Laptop, Tatil"
value={formData.baslik}
onChangeText={(value) => setFormData((prev) => ({ ...prev, baslik: value }))}
/>

<Input
label="HEDEF MİKTARI"
placeholder="0"
prefix="₺"
value={formData.hedefMiktar}
onChangeText={(value) => setFormData((prev) => ({ ...prev, hedefMiktar: value }))}
keyboardType="decimal-pad"
/>

<View style={styles.fieldGroup}>
<Text style={styles.fieldLabel}>ÖNCELİK</Text>
<SegmentedControl
options={oncelikOptions}
selectedValue={String(formData.oncelik)}
onValueChange={(value) => setFormData((prev) => ({ ...prev, oncelik: parseInt(value) as 1 | 2 | 3 }))}
/>
</View>

<Text style={styles.fieldLabel}>HEDEF TARİHİ (Opsiyonel)</Text>
<TextInput
style={styles.dateInput}
placeholder="YYYY-MM-DD"
value={formData.hedefTarihi}
onChangeText={(value) => setFormData((prev) => ({ ...prev, hedefTarihi: value }))}
/>

<Text style={styles.fieldLabel}>RENK</Text>
<View style={styles.renkRow}>
{renkSecenekleri.map((renk) => (
<TouchableOpacity
key={renk}
style={[
styles.renkOption,
{ backgroundColor: renk },
formData.renk === renk && styles.renkOptionSelected,
]}
onPress={() => setFormData((prev) => ({ ...prev, renk }))}
/>
))}
</View>

<Input
label="AÇIKLAMA (Opsiyonel)"
placeholder="Bu hedef neden önemli?"
value={formData.aciklama}
onChangeText={(value) => setFormData((prev) => ({ ...prev, aciklama: value }))}
multiline
/>

<TouchableOpacity
style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerHigh, padding: spacing.md, borderRadius: 8, marginVertical: spacing.md }}
onPress={() => setIsYatirimHedefi(!isYatirimHedefi)}
>
<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
<Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.onSurface }}>
Bu bir Borsa / Kripto yatırım hedefi mi?
</Text>
</View>
<View style={[styles.checkbox, isYatirimHedefi && styles.checkboxChecked]}>
{isYatirimHedefi && <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.onPrimary }}>✓</Text>}
</View>
</TouchableOpacity>

{isYatirimHedefi && (
<View style={{ backgroundColor: colors.primaryContainer + '30', padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primaryContainer }}>
<Text style={styles.fieldLabel}>VARLIK TİPİ SEÇİN</Text>
<View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
  <TouchableOpacity
    style={[styles.varlikTypeBtn, formData.varlikTip === 'HISSE' && styles.varlikTypeActive]}
    onPress={() => { setFormData((prev) => ({ ...prev, varlikTip: 'HISSE', varlikSembol: '' })); setSearchQuery(''); }}
  >
    <Text style={[styles.varlikTypeText, formData.varlikTip === 'HISSE' && styles.varlikTypeTextActive]}>BIST 100 Hisse</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.varlikTypeBtn, formData.varlikTip === 'KRIPTO' && styles.varlikTypeActive]}
    onPress={() => { setFormData((prev) => ({ ...prev, varlikTip: 'KRIPTO', varlikSembol: '' })); setSearchQuery(''); }}
  >
    <Text style={[styles.varlikTypeText, formData.varlikTip === 'KRIPTO' && styles.varlikTypeTextActive]}>Kripto Para</Text>
  </TouchableOpacity>
</View>

<Text style={styles.fieldLabel}>VARLIK SEÇİMİ (Arama ile Kolay Seçim)</Text>
<TouchableOpacity
  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: spacing.md, backgroundColor: colors.surface, marginBottom: spacing.sm }}
  onPress={() => setShowPickerModal(!showPickerModal)}
>
  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: formData.varlikSembol ? colors.onSurface : colors.onSurfaceVariant }}>
    {formData.varlikSembol ? `Seçilen: ${formData.varlikSembol}` : 'Listeden Seçmek İçin Tıklayın...'}
  </Text>
  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.primary }}>▼</Text>
</TouchableOpacity>

{showPickerModal && (
  <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8, padding: spacing.sm, maxHeight: 220, marginBottom: spacing.md }}>
    <TextInput
      style={{ borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6, padding: spacing.xs + 4, fontFamily: 'Poppins_400Regular', fontSize: 13, marginBottom: spacing.sm, color: colors.onSurface }}
      placeholder="İsim veya Kod ile ara..."
      placeholderTextColor={colors.onSurfaceVariant}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
      {(formData.varlikTip === 'HISSE' ? bistList : kriptoList)
        .filter((item: any) => {
          const term = searchQuery.toLowerCase();
          const code = (item.sembol || item.code || item.symbol || '').toLowerCase();
          const name = (item.ad || item.text || item.name || '').toLowerCase();
          return code.includes(term) || name.includes(term);
        })
        .map((item: any, idx: number) => {
          const code = item.sembol || item.code || item.symbol || '';
          const name = item.ad || item.text || item.name || '';
          return (
            <TouchableOpacity
              key={`pick-${code}-${idx}`}
              style={{ paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', justifyContent: 'space-between' }}
              onPress={() => {
                const price = parseFloat(item.lastprice || item.guncelFiyat || item.usdFiyat || item.currentPrice || '0');
                setSelectedAssetPrice(price);
                const newBaslik = name ? `${name} (${code.toUpperCase()})` : code.toUpperCase();
                const newMiktar = formData.varlikAdet && price > 0 ? (parseFloat(formData.varlikAdet) * price).toFixed(2) : formData.hedefMiktar;
                setFormData(prev => ({ 
                  ...prev, 
                  varlikSembol: code.toUpperCase(),
                  baslik: newBaslik,
                  hedefMiktar: String(newMiktar)
                }));
                setShowPickerModal(false);
              }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.onSurface }}>{code.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.onSurfaceVariant }} numberOfLines={1}>{name}</Text>
            </TouchableOpacity>
          );
        })}
    </ScrollView>
  </View>
)}

<Input
label="HEDEF ADET (örn. 100)"
placeholder="Hedeflenen adet"
value={formData.varlikAdet}
onChangeText={(value) => {
  const num = parseFloat(value) || 0;
  const newMiktar = selectedAssetPrice > 0 && num > 0 ? (num * selectedAssetPrice).toFixed(2) : formData.hedefMiktar;
  setFormData((prev) => ({ 
    ...prev, 
    varlikAdet: value,
    hedefMiktar: String(newMiktar)
  }));
}}
keyboardType="decimal-pad"
/>
</View>
)}

<TouchableOpacity
style={styles.herkesGorsunRow}
onPress={() => setFormData((prev) => ({ ...prev, herkesGorsun: !prev.herkesGorsun }))}
>
<View style={[styles.checkbox, formData.herkesGorsun && styles.checkboxChecked]}>
{formData.herkesGorsun && <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.onPrimary }}>✓</Text>}
</View>
<Text style={styles.herkesGorsunText}>Arkadaşlarımla paylaş</Text>
</TouchableOpacity>

<Button title="HEDEF EKLE" onPress={addHedef} fullWidth />
</AnimatedBox>
)}

{hedefler.length > 0 && (
<Animated.View entering={FadeIn.duration(300)} style={styles.listSection}>
<View style={styles.listHeader}>
<Text style={styles.sectionTitle}>Eklenen Hedefler</Text>
<Text style={styles.toplamText}>
Toplam: ₺{toplamHedef.toLocaleString('tr-TR')}
</Text>
</View>

{hedefler.map((hedef, index) => (
<Animated.View
key={hedef.id}
entering={FadeInDown.delay(index * 50).duration(300)}
style={styles.hedefItem}
>
<View style={styles.hedefLeft}>
<View style={[styles.hedefIcon, { backgroundColor: hedef.renk }]} />
<View style={styles.hedefInfo}>
<Text style={styles.hedefBaslik}>{hedef.baslik}</Text>
<View style={styles.hedefMeta}>
<Text style={styles.hedefMiktar}>
₺{parseFloat(hedef.hedefMiktar).toLocaleString('tr-TR')}
</Text>
<View style={styles.oncelikBadge}>
<Text style={styles.oncelikText}>{getOncelikLabel(hedef.oncelik)}</Text>
</View>
{hedef.varlikSembol && (
  <View style={[styles.oncelikBadge, { backgroundColor: colors.primary + '15', marginLeft: spacing.xs }]}>
    <Text style={[styles.oncelikText, { color: colors.primary }]}>{hedef.varlikAdet}x {hedef.varlikSembol}</Text>
  </View>
)}
</View>
<ProgressBar progress={0} height={4} style={styles.hedefProgress} />
</View>
</View>
<TouchableOpacity
onPress={() => removeHedef(hedef.id)}
style={styles.removeButton}
>
<Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.error }}>×</Text>
</TouchableOpacity>
</Animated.View>
))}
</Animated.View>
)}

<View style={styles.bottomActions}>
<Button
title="TAMAMLA"
onPress={handleComplete}
loading={saving}
fullWidth
/>
<TouchableOpacity onPress={handleSkip} style={styles.skipButton} disabled={saving}>
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
sectionTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
marginBottom: spacing.md,
},
oneriScroll: {
marginBottom: spacing.md,
marginHorizontal: -spacing.containerMargin,
paddingHorizontal: spacing.containerMargin,
},
oneriCard: {
width: 140,
padding: spacing.md,
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: 12,
marginRight: spacing.sm,
alignItems: 'flex-start',
gap: spacing.xs,
},
oneriBaslik: {
fontFamily: 'Poppins_500Medium',
fontSize: 13,
color: colors.onSurface,
textAlign: 'center',
},
oneriMiktar: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 14,
color: colors.primary,
},
oneriPeriyot: {
fontFamily: 'Poppins_400Regular',
fontSize: 11,
color: colors.onSurfaceVariant,
},
customHedefButton: {
alignItems: 'center',
justifyContent: 'center',
paddingVertical: spacing.md,
borderWidth: 1.5,
borderColor: colors.primary,
borderStyle: 'dashed',
borderRadius: 12,
marginBottom: spacing.lg,
},
customHedefText: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.primary,
},
formCard: {
padding: spacing.lg,
marginBottom: spacing.md,
},
formHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: spacing.md,
},
formTitle: {
fontFamily: 'Poppins_600SemiBold',
fontSize: 16,
color: colors.onSurface,
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
marginTop: spacing.md,
},
dateInput: {
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: 8,
padding: spacing.md,
fontFamily: 'Poppins_400Regular',
fontSize: 16,
color: colors.onSurface,
},
renkRow: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: spacing.sm,
marginBottom: spacing.md,
},
renkOption: {
width: 32,
height: 32,
borderRadius: 16,
},
renkOptionSelected: {
borderWidth: 3,
borderColor: colors.onSurface,
},
herkesGorsunRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginVertical: spacing.md,
},
checkbox: {
width: 22,
height: 22,
borderWidth: 2,
borderColor: colors.borderLight,
borderRadius: 4,
alignItems: 'center',
justifyContent: 'center',
},
checkboxChecked: {
backgroundColor: colors.primary,
borderColor: colors.primary,
},
herkesGorsunText: {
fontFamily: 'Poppins_400Regular',
fontSize: 14,
color: colors.onSurface,
},
listSection: {
marginTop: spacing.md,
},
listHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: spacing.md,
},
toplamText: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.onSurfaceVariant,
},
hedefItem: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingVertical: spacing.md,
borderBottomWidth: 1,
borderBottomColor: colors.borderLight,
},
hedefLeft: {
flexDirection: 'row',
alignItems: 'center',
flex: 1,
gap: spacing.sm,
},
hedefIcon: {
width: 8,
height: 40,
borderRadius: 4,
},
hedefInfo: {
flex: 1,
},
hedefBaslik: {
fontFamily: 'Poppins_500Medium',
fontSize: 14,
color: colors.onSurface,
},
hedefMeta: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.sm,
marginBottom: spacing.xs,
},
hedefMiktar: {
fontFamily: 'Poppins_400Regular',
fontSize: 13,
color: colors.onSurfaceVariant,
},
oncelikBadge: {
paddingHorizontal: spacing.sm,
paddingVertical: 2,
backgroundColor: colors.secondaryContainer,
},
oncelikText: {
fontFamily: 'Poppins_500Medium',
fontSize: 10,
color: colors.primary,
},
hedefProgress: {
marginTop: spacing.xs,
},
removeButton: {
padding: spacing.sm,
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
varlikTypeBtn: {
flex: 1,
paddingVertical: spacing.sm,
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: 8,
alignItems: 'center',
},
varlikTypeActive: {
backgroundColor: colors.primaryContainer,
borderColor: colors.primary,
},
varlikTypeText: {
fontFamily: 'Poppins_500Medium',
fontSize: 13,
color: colors.onSurfaceVariant,
},
varlikTypeTextActive: {
color: colors.onPrimary,
fontFamily: 'Poppins_600SemiBold',
},
});
