import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';
import { mesajApi, Mesaj } from '../../api/mesaj';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

const ICON_COLOR = '#1a1a1a';
const ICON_COLOR_LIGHT = '#666';

interface Props {
  navigation: any;
  route: any;
}

export const SohbetScreen: React.FC<Props> = ({ navigation, route }) => {
  const { kullaniciId, kullaniciAd } = route.params;
  const { user } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mesajText, setMesajText] = useState('');
  const [paylasModalVisible, setPaylasModalVisible] = useState(false);
  const [hedefler, setHedefler] = useState<any[]>([]);
  const [rozetler, setRozetler] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const fetchMesajlar = useCallback(async () => {
    try {
      const data = await mesajApi.mesajlariGetir(kullaniciId);
      setMesajlar(data);
    } catch (error) {
      console.log('Mesajlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [kullaniciId]);

  const fetchHedeflerVeRozetler = async () => {
    try {
      const [hedefRes, rozetRes] = await Promise.all([
        apiClient.get('/hedef').catch(() => null),
        apiClient.get('/rozet/kazanilanlar').catch(() => null),
      ]);
      if (hedefRes?.data?.data) setHedefler(hedefRes.data.data);
      if (rozetRes?.data?.data) setRozetler(rozetRes.data.data);
    } catch (e) {
      console.log('Hedef/rozet yüklenemedi:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMesajlar();
      fetchHedeflerVeRozetler();
      
      // Her 5 saniyede yeni mesajları kontrol et
      const interval = setInterval(fetchMesajlar, 5000);
      return () => clearInterval(interval);
    }, [fetchMesajlar])
  );

  useEffect(() => {
    if (mesajlar.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mesajlar]);

  const mesajGonder = async () => {
    if (!mesajText.trim() || sending) return;

    setSending(true);
    try {
      const yeniMesaj = await mesajApi.mesajGonder(kullaniciId, mesajText.trim());
      setMesajlar(prev => [...prev, yeniMesaj]);
      setMesajText('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error?.response?.data?.message || 'Mesaj gönderilemedi' });
    } finally {
      setSending(false);
    }
  };

  const hedefPaylas = async (hedefId: string) => {
    try {
      const mesaj = await mesajApi.hedefPaylas(kullaniciId, hedefId);
      setMesajlar(prev => [...prev, mesaj]);
      setPaylasModalVisible(false);
      Toast.show({ type: 'success', text1: 'Paylaşıldı', text2: 'Hedef paylaşıldı' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error?.response?.data?.message || 'Paylaşılamadı' });
    }
  };

  const butcePaylas = async () => {
    try {
      const mesaj = await mesajApi.butcePaylas(kullaniciId);
      setMesajlar(prev => [...prev, mesaj]);
      setPaylasModalVisible(false);
      Toast.show({ type: 'success', text1: 'Paylaşıldı', text2: 'Bütçe durumun paylaşıldı' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error?.response?.data?.message || 'Paylaşılamadı' });
    }
  };

  const rozetPaylas = async (rozetId: string) => {
    try {
      const mesaj = await mesajApi.rozetPaylas(kullaniciId, rozetId);
      setMesajlar(prev => [...prev, mesaj]);
      setPaylasModalVisible(false);
      Toast.show({ type: 'success', text1: 'Paylaşıldı', text2: 'Rozet paylaşıldı' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: error?.response?.data?.message || 'Paylaşılamadı' });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMesaj = ({ item }: { item: Mesaj }) => {
    const isMine = item.gonderenId === user?.id;

    if (item.mesajTipi === 'PAYLASIM' && item.paylasimVerisi) {
      return (
        <View style={[styles.mesajWrap, isMine ? styles.mesajMine : styles.mesajTheirs]}>
          <View style={[styles.paylasimCard, isMine && styles.paylasimCardMine]}>
            {item.paylasimTipi === 'HEDEF' && (
              <>
                <View style={styles.paylasimHeader}>
                  <Icon name="bullseye" size={16} color={isMine ? '#fff' : ICON_COLOR} />
                  <Text style={[styles.paylasimTitle, isMine && { color: '#fff' }]}>Hedef</Text>
                </View>
                <Text style={[styles.paylasimBaslik, isMine && { color: '#fff' }]}>
                  {item.paylasimVerisi.baslik}
                </Text>
                <View style={styles.paylasimProgress}>
                  <View style={[styles.paylasimProgressFill, { width: `${item.paylasimVerisi.ilerleme}%` }]} />
                </View>
                <Text style={[styles.paylasimDetay, isMine && { color: 'rgba(255,255,255,0.8)' }]}>
                  ₺{item.paylasimVerisi.mevcutMiktar?.toLocaleString()} / ₺{item.paylasimVerisi.hedefMiktar?.toLocaleString()} ({item.paylasimVerisi.ilerleme}%)
                </Text>
              </>
            )}
            {item.paylasimTipi === 'BUTCE' && (
              <>
                <View style={styles.paylasimHeader}>
                  <Icon name="wallet" size={16} color={isMine ? '#fff' : ICON_COLOR} />
                  <Text style={[styles.paylasimTitle, isMine && { color: '#fff' }]}>Bu Ay Bütçe</Text>
                </View>
                <View style={styles.butceRow}>
                  <View style={styles.butceItem}>
                    <Text style={[styles.butceLabel, isMine && { color: 'rgba(255,255,255,0.7)' }]}>Gelir</Text>
                    <Text style={[styles.butceValue, { color: '#4a4a4a' }]}>
                      ₺{item.paylasimVerisi.toplamGelir?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.butceItem}>
                    <Text style={[styles.butceLabel, isMine && { color: 'rgba(255,255,255,0.7)' }]}>Gider</Text>
                    <Text style={[styles.butceValue, { color: '#1a1a1a' }]}>
                      ₺{item.paylasimVerisi.toplamGider?.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.paylasimDetay, isMine && { color: 'rgba(255,255,255,0.8)' }]}>
                  Tasarruf: ₺{item.paylasimVerisi.tasarruf?.toLocaleString()}
                </Text>
              </>
            )}
            {item.paylasimTipi === 'ROZET' && (
              <>
                <View style={styles.paylasimHeader}>
                  <Icon name="medal" size={16} color={isMine ? '#fff' : ICON_COLOR} />
                  <Text style={[styles.paylasimTitle, isMine && { color: '#fff' }]}>Rozet Kazanıldı!</Text>
                </View>
                <Text style={[styles.paylasimBaslik, isMine && { color: '#fff' }]}>
                  {item.paylasimVerisi.ad}
                </Text>
                <Text style={[styles.paylasimDetay, isMine && { color: 'rgba(255,255,255,0.8)' }]}>
                  {item.paylasimVerisi.aciklama}
                </Text>
              </>
            )}
            <Text style={[styles.mesajZaman, isMine && { color: 'rgba(255,255,255,0.6)' }]}>
              {formatTime(item.olusturuldu)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.mesajWrap, isMine ? styles.mesajMine : styles.mesajTheirs]}>
        <View style={[styles.mesajBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.mesajText, isMine && { color: '#fff' }]}>{item.icerik}</Text>
          <Text style={[styles.mesajZaman, isMine && { color: 'rgba(255,255,255,0.6)' }]}>
            {formatTime(item.olusturuldu)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevronLeft" size={20} color={ICON_COLOR} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{kullaniciAd}</Text>
          <View style={{ width: 40 }} />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevronLeft" size={20} color={ICON_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{kullaniciAd}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={mesajlar}
          keyExtractor={(item) => item.id}
          renderItem={renderMesaj}
          contentContainerStyle={styles.mesajlarContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.paylasButton}
            onPress={() => setPaylasModalVisible(true)}
          >
            <Icon name="plus" size={20} color={ICON_COLOR} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={ICON_COLOR_LIGHT}
            value={mesajText}
            onChangeText={setMesajText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !mesajText.trim() && styles.sendButtonDisabled]}
            onPress={mesajGonder}
            disabled={!mesajText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="paperPlane" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Paylaş Modal */}
      <Modal
        visible={paylasModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaylasModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paylaş</Text>
              <TouchableOpacity onPress={() => setPaylasModalVisible(false)}>
                <Icon name="close" size={20} color={ICON_COLOR_LIGHT} />
              </TouchableOpacity>
            </View>

            {/* Bütçe Paylaş */}
            <TouchableOpacity style={styles.paylasOption} onPress={butcePaylas}>
              <View style={[styles.paylasOptionIcon, { backgroundColor: '#e8e8e8' }]}>
                <Icon name="wallet" size={20} color="#4a4a4a" />
              </View>
              <View style={styles.paylasOptionInfo}>
                <Text style={styles.paylasOptionTitle}>Bütçe Durumu</Text>
                <Text style={styles.paylasOptionDesc}>Bu ayki gelir, gider ve tasarrufunu paylaş</Text>
              </View>
            </TouchableOpacity>

            {/* Hedefler */}
            {hedefler.length > 0 && (
              <>
                <Text style={styles.paylasSection}>Hedefler</Text>
                {hedefler.slice(0, 3).map(hedef => (
                  <TouchableOpacity 
                    key={hedef.id} 
                    style={styles.paylasOption}
                    onPress={() => hedefPaylas(hedef.id)}
                  >
                    <View style={[styles.paylasOptionIcon, { backgroundColor: '#f5f5f5' }]}>
                      <Icon name="bullseye" size={20} color="#666666" />
                    </View>
                    <View style={styles.paylasOptionInfo}>
                      <Text style={styles.paylasOptionTitle}>{hedef.baslik}</Text>
                      <Text style={styles.paylasOptionDesc}>
                        ₺{hedef.mevcutMiktar?.toLocaleString()} / ₺{hedef.hedefMiktar?.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Rozetler */}
            {rozetler.length > 0 && (
              <>
                <Text style={styles.paylasSection}>Rozetler</Text>
                {rozetler.slice(0, 3).map(kr => (
                  <TouchableOpacity 
                    key={kr.id} 
                    style={styles.paylasOption}
                    onPress={() => rozetPaylas(kr.rozet?.id || kr.rozetId)}
                  >
                    <View style={[styles.paylasOptionIcon, { backgroundColor: '#f5f5f5' }]}>
                      <Icon name="medal" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.paylasOptionInfo}>
                      <Text style={styles.paylasOptionTitle}>{kr.rozet?.ad || 'Rozet'}</Text>
                      <Text style={styles.paylasOptionDesc}>{kr.rozet?.aciklama}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: ICON_COLOR,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  mesajlarContent: {
    padding: spacing.containerMargin,
    paddingBottom: spacing.md,
  },
  mesajWrap: {
    marginBottom: spacing.sm,
  },
  mesajMine: {
    alignItems: 'flex-end',
  },
  mesajTheirs: {
    alignItems: 'flex-start',
  },
  mesajBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: 'rgb(26, 45, 77)',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  mesajText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR,
  },
  mesajZaman: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: ICON_COLOR_LIGHT,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  paylasimCard: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  paylasimCardMine: {
    backgroundColor: 'rgb(26, 45, 77)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  paylasimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  paylasimTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: ICON_COLOR,
  },
  paylasimBaslik: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
    marginBottom: spacing.sm,
  },
  paylasimProgress: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  paylasimProgressFill: {
    height: '100%',
    backgroundColor: '#4a4a4a',
    borderRadius: 3,
  },
  paylasimDetay: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: ICON_COLOR_LIGHT,
  },
  butceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  butceItem: {
    flex: 1,
  },
  butceLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: ICON_COLOR_LIGHT,
  },
  butceValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.containerMargin,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
    gap: spacing.sm,
  },
  paylasButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: ICON_COLOR,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgb(26, 45, 77)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '70%',
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
    color: ICON_COLOR,
  },
  paylasSection: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: ICON_COLOR,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paylasOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paylasOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paylasOptionInfo: {
    flex: 1,
  },
  paylasOptionTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: ICON_COLOR,
  },
  paylasOptionDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: ICON_COLOR_LIGHT,
  },
});
