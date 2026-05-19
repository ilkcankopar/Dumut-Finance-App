import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Card, Icon, Button } from '../../components';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Props {
  navigation: any;
}

export const ButceProfiliScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    aylikHedefHarcama: '',
    aylikToplamGelir: '',
  });

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/butce/durum');
      const profil = response.data?.data?.profil;
      if (profil) {
        setFormData({
          aylikHedefHarcama: profil.aylikHedefHarcama?.toString() || '',
          aylikToplamGelir: profil.aylikToplamGelir?.toString() || '',
        });
      }
    } catch (error) {
      console.log('Profil yüklenemedi:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Bütçe profili alınamadı',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.aylikToplamGelir || !formData.aylikHedefHarcama) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen tüm alanları doldurun',
      });
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch('/butce/profil', {
        aylikToplamGelir: parseFloat(formData.aylikToplamGelir),
        aylikHedefHarcama: parseFloat(formData.aylikHedefHarcama),
      });

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Bütçe profiliniz güncellendi',
      });
      
      navigation.goBack();
    } catch (error) {
      console.log('Profil güncellenemedi:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Güncelleme başarısız oldu',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevronLeft" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bütçe Profilim</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <Card variant="outlined" style={styles.infoCard}>
                <Icon name="info" size={24} color={colors.primary} />
                <Text style={styles.infoText}>
                  Buradan kurulum aşamasında belirlediğiniz aylık gelir ve hedef harcama tutarlarını güncelleyebilirsiniz. Bu veriler yapay zeka tavsiyeleri ve anasayfa özetleri için kullanılmaktadır.
                </Text>
              </Card>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aylık Toplam Gelir</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>₺</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.aylikToplamGelir}
                    onChangeText={(val) => setFormData({ ...formData, aylikToplamGelir: val })}
                    keyboardType="decimal-pad"
                    placeholder="Örn: 25000"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dışarda Harcayabileceğin (Net Kalan)</Text>
              <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>₺</Text>
              <TextInput
              style={styles.input}
              value={formData.aylikHedefHarcama}
              onChangeText={(val) => setFormData({ ...formData, aylikHedefHarcama: val })}
              keyboardType="decimal-pad"
              placeholder="Örn: 20000"
              />
              </View>
              <Text style={styles.inputHint}>Gelir - Sabit Giderler = Dışarıda harcayabileceğin</Text>
              </View>

              <Card variant="outlined" style={styles.sabitlerCard}>
                <View style={styles.sabitlerHeader}>
                  <Icon name="repeat" size={20} color={colors.onSurface} />
                  <Text style={styles.sabitlerTitle}>Sabit İşlemler</Text>
                </View>
                <Text style={styles.sabitlerText}>
                  Aylık düzenli olarak ödediğiniz kira, fatura, abonelik gibi sabit giderlerinizi veya sabit gelirlerinizi 'İşlemler' sekmesinden düzenleyebilir veya silebilirsiniz.
                </Text>
                <Button
                title="İşlemler Sayfasına Git"
                variant="secondary"
                onPress={() => navigation.navigate('Islemler')}
                style={{ marginTop: spacing.md }}
                />
              </Card>

              <Button
                title="Kaydet"
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  content: {
    padding: spacing.containerMargin,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: spacing.md,
  },
  sabitlerCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  sabitlerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sabitlerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  sabitlerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  inputHint: {
  fontFamily: 'Poppins_400Regular',
  fontSize: 12,
  color: colors.onSurfaceVariant,
  marginTop: 4,
  },
  saveButton: {
  marginTop: spacing.sm,
  },
  });
