import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';
import Toast from 'react-native-toast-message';

interface Arkadas {
  id: string;
  arkadas: {
    id: string;
    ad: string;
    soyad: string;
    profilResmi?: string;
    email: string;
  };
  hedefGoster: boolean;
  raporGoster: boolean;
  olusturuldu: string;
}

interface Istek {
  id: string;
  kullanici: {
    id: string;
    ad: string;
    soyad: string;
    profilResmi?: string;
  };
  olusturuldu: string;
}

interface AramaKullanici {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  profilResmi?: string;
  arkadaslikDurumu: 'arkadas' | 'beklemede' | 'yok';
}

interface Props {
  navigation: any;
}

export const ArkadaslarScreen: React.FC<Props> = ({ navigation }) => {
  const [arkadaslar, setArkadaslar] = useState<Arkadas[]>([]);
  const [istekler, setIstekler] = useState<{ gelen: Istek[]; giden: Istek[] }>({ gelen: [], giden: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<AramaKullanici[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'arkadaslar' | 'istekler'>('arkadaslar');

  const fetchData = useCallback(async () => {
    try {
      const [arkRes, istekRes] = await Promise.all([
        apiClient.get('/arkadaslik'),
        apiClient.get('/arkadaslik/istekler'),
      ]);
      setArkadaslar(arkRes.data?.data || []);
      setIstekler({
        gelen: istekRes.data?.data?.gelenIstekler || [],
        giden: istekRes.data?.data?.gidenIstekler || [],
      });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await apiClient.get('/arkadaslik/ara', { params: { arama: text } });
      setSearchResults(res.data?.data?.kullanicilar || []);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendRequest = async (alinanId: string) => {
    try {
      await apiClient.post('/arkadaslik/istek', { alinanId });
      Toast.show({ type: 'success', text1: 'Istek Gonderildi', text2: 'Arkadaslik istegi gonderildi' });
      handleSearch(searchText);
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error.response?.data?.message || 'Istek gonderilemedi' });
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await apiClient.post(`/arkadaslik/kabul/${id}`);
      Toast.show({ type: 'success', text1: 'Kabul Edildi', text2: 'Arkadaslik istegi kabul edildi' });
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error.response?.data?.message || 'Istek kabul edilemedi' });
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      await apiClient.post(`/arkadaslik/reddet/${id}`);
      Toast.show({ type: 'info', text1: 'Reddedildi', text2: 'Arkadaslik istegi reddedildi' });
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error.response?.data?.message || 'Istek reddedilemedi' });
    }
  };

  const removeFriend = async (id: string) => {
    Alert.alert('Arkadasi Sil', 'Bu arkadasi silmek istediginizden emin misiniz?', [
      { text: 'Iptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/arkadaslik/${id}`);
            Toast.show({ type: 'success', text1: 'Silindi', text2: 'Arkadas silindi' });
            fetchData();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Arkadas silinemedi' });
          }
        },
      },
    ]);
  };

  const renderArkadas = ({ item, index }: { item: Arkadas; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.arkadas.ad[0]}{item.arkadas.soyad[0]}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.arkadas.ad} {item.arkadas.soyad}</Text>
          <Text style={styles.cardEmail}>{item.arkadas.email}</Text>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity 
            style={styles.messageBtn} 
            onPress={() => navigation.navigate('Sohbet', { 
              kullaniciId: item.arkadas.id, 
              kullaniciAd: `${item.arkadas.ad} ${item.arkadas.soyad}` 
            })}
          >
            <Icon name="paperPlane" size={16} color={colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeFriend(item.id)}>
            <Icon name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderIstek = ({ item, index }: { item: Istek; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.kullanici.ad[0]}{item.kullanici.soyad[0]}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.kullanici.ad} {item.kullanici.soyad}</Text>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(item.id)}>
            <Icon name="check" size={16} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectRequest(item.id)}>
            <Icon name="times" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Arkadaslar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowSearchModal(true)}>
          <Icon name="plus" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'arkadaslar' && styles.tabActive]}
          onPress={() => setActiveTab('arkadaslar')}
        >
          <Text style={[styles.tabText, activeTab === 'arkadaslar' && styles.tabTextActive]}>
            Arkadaslar ({arkadaslar.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'istekler' && styles.tabActive]}
          onPress={() => setActiveTab('istekler')}
        >
          <Text style={[styles.tabText, activeTab === 'istekler' && styles.tabTextActive]}>
            Istekler ({istekler.gelen.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.onSurface} style={styles.loading} />
      ) : activeTab === 'arkadaslar' ? (
        <FlatList
          data={arkadaslar}
          renderItem={renderArkadas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="user" size={48} color={colors.outline} />
              <Text style={styles.emptyText}>Henuz arkadas eklemediniz</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={istekler.gelen}
          renderItem={renderIstek}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="bell" size={48} color={colors.outline} />
              <Text style={styles.emptyText}>Bekleyen istek yok</Text>
            </View>
          }
        />
      )}

      <Modal visible={showSearchModal} animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Icon name="times" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Arkadas Ara</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ad, soyad veya email ile ara..."
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
          </View>
          {searchLoading ? (
            <ActivityIndicator size="small" color={colors.onSurface} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.ad[0]}{item.soyad[0]}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.ad} {item.soyad}</Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>
                  </View>
                  {item.arkadaslikDurumu === 'yok' ? (
                    <TouchableOpacity style={styles.sendBtn} onPress={() => sendRequest(item.id)}>
                      <Icon name="plus" size={16} color={colors.background} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {item.arkadaslikDurumu === 'arkadas' ? 'Arkadas' : 'Beklemede'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={
                searchText.length >= 2 ? (
                  <Text style={styles.noResult}>Sonuc bulunamadi</Text>
                ) : (
                  <Text style={styles.noResult}>Aramak icin en az 2 karakter girin</Text>
                )
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outline },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: colors.onSurface },
  addBtn: { padding: spacing.xs },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.outline },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.onSurface },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onSurface },
  list: { padding: spacing.md },
  loading: { flex: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.outline },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.onSurface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: colors.background },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  cardName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.onSurface },
  cardEmail: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.onSurfaceVariant },
  removeBtn: { padding: spacing.sm },
  messageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  actionBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.onSurface, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.onSurfaceVariant, marginTop: spacing.md },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outline },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: colors.onSurface },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, margin: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.outline },
  searchInput: { flex: 1, paddingVertical: spacing.sm, marginLeft: spacing.sm, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.onSurface, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.outline },
  statusText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.onSurfaceVariant },
  noResult: { textAlign: 'center', fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.onSurfaceVariant, marginTop: 40 },
  error: { color: '#DC3545' },
});
