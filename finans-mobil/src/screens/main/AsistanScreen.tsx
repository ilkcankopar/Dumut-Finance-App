import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { colors, spacing } from '../../theme';
import { Icon } from '../../components';
import { apiClient as api } from '../../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AsistanScreen = ({ navigation }: any) => {
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'result'>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioRef = useRef<any>(null);
  
  // Native Animated değerler
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  // Pulse animasyonu
  const startPulseAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  // Wave dalgası animasyonu (dinlerken)
  const startWaveAnim = () => {
    const createWave = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    };
    
    Animated.parallel([
      createWave(wave1Anim, 0),
      createWave(wave2Anim, 500),
    ]).start();
  };

  // Speaking wave animasyonu
  const startSpeakingAnim = () => {
    waveAnims.forEach((anim, index) => {
      const randomDuration = 200 + Math.random() * 300;
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.timing(anim, { toValue: 0.8 + Math.random() * 0.2, duration: randomDuration, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3 + Math.random() * 0.2, duration: randomDuration, useNativeDriver: false }),
        ])
      ).start();
    });
  };

  const stopAllAnims = () => {
    pulseAnim.stopAnimation();
    wave1Anim.stopAnimation();
    wave2Anim.stopAnimation();
    waveAnims.forEach(a => a.stopAnimation());
    
    pulseAnim.setValue(1);
    wave1Anim.setValue(0);
    wave2Anim.setValue(0);
    waveAnims.forEach(a => a.setValue(0.3));
  };

  // TTS - ElevenLabs
  const speak = async (text: string) => {
    console.log('[Asistan] TTS başlıyor:', text);
    setMode('speaking');
    startSpeakingAnim();
    
    const finishSpeaking = () => {
      stopAllAnims();
      setMode('result');
    };

    try {
      if (Platform.OS === 'web') {
        // Web: Blob kullan
        const response = await api.post('/sesli-asistan/seslendir', 
          { metin: text },
          { responseType: 'blob' }
        );
        
        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) audioRef.current.pause();
        const audio = new window.Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(audioUrl); finishSpeaking(); };
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); finishSpeaking(); };
        await audio.play();
      } else {
        // Mobil: Base64 kullan
        const response = await api.post('/sesli-asistan/seslendir', 
          { metin: text },
          { responseType: 'arraybuffer' }
        );
        
        // ArrayBuffer'ı Base64'e çevir
        const bytes = new Uint8Array(response.data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);
        const audioUri = `data:audio/mpeg;base64,${base64Audio}`;
        
        console.log('[Asistan] Ses URI hazır, oynatılıyor...');
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            finishSpeaking();
          }
        });
      }
    } catch (error: any) {
      console.error('[Asistan] TTS Hatası:', error);
      finishSpeaking();
    }
  };

  // API çağrısı
  const processCommand = async (text: string) => {
    if (!text || text.trim().length === 0) {
      setMode('idle');
      return;
    }
    
    console.log('[Asistan] İşleniyor:', text);
    setMode('processing');
    setTranscript(text);
    
    try {
      const res = await api.post('/sesli-asistan/metin', { metin: text });
      
      if (res.data.success) {
        const { cevapMetni, data } = res.data.data;
        setResponse({ text: cevapMetni, data });

        if (data?.tip === 'ONAY_BEKLIYOR') {
          setPending(data.islem);
          setMode('result');
          speak(`${data.islem.miktar} TL ${data.islem.kategori_adi} eklensin mi?`);
        } else {
          speak(cevapMetni);
        }
      } else {
        setResponse({ text: res.data.message || 'Bir hata oluştu.', data: null });
        setMode('result');
      }
    } catch (err: any) {
      console.error('[Asistan] API Hatası:', err);
      setResponse({ text: 'Bağlantı hatası', data: null });
      Toast.show({ type: 'error', text1: 'API Hatası' });
      setMode('result');
    }
  };

  // Mikrofon - Web Speech API (web) veya Ses Kaydı (mobil)
  const startListening = async () => {
    if (mode !== 'idle' && mode !== 'result') return;
    
    setTranscript('');
    setResponse(null);
    setPending(null);

    if (Platform.OS === 'web') {
      // Web: Speech Recognition
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) {
        Toast.show({ type: 'error', text1: 'Tarayıcı desteklemiyor' });
        return;
      }

      const recognition = new SR();
      recognition.lang = 'tr-TR';
      recognition.interimResults = true;
      recognition.continuous = false;
      let finalText = '';

      recognition.onstart = () => {
        setMode('listening');
        startPulseAnim();
        startWaveAnim();
      };

      recognition.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText = e.results[i][0].transcript;
          else interim = e.results[i][0].transcript;
        }
        setTranscript(finalText || interim);
      };

      recognition.onerror = (e: any) => {
        stopAllAnims();
        if (e.error === 'no-speech') Toast.show({ type: 'info', text1: 'Ses algılanamadı' });
        setMode('idle');
      };

      recognition.onend = () => {
        stopAllAnims();
        if (finalText) processCommand(finalText.trim());
        else setMode('idle');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      // Mobil: Ses kaydı
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Mikrofon izni gerekli' });
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        
        recordingRef.current = recording;
        setMode('listening');
        startPulseAnim();
        startWaveAnim();
        console.log('[Asistan] Kayıt başladı');
      } catch (e) {
        console.log('Kayıt hatası:', e);
        Toast.show({ type: 'error', text1: 'Mikrofon başlatılamadı' });
      }
    }
  };

  const stopListening = async () => {
    stopAllAnims();
    
    if (Platform.OS === 'web') {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      // Mobil: Kaydı durdur ve gönder
      if (!recordingRef.current) return;
      
      setMode('processing');
      
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        console.log('[Asistan] Kayıt URI:', uri);
        
        if (uri) {
          const response = await fetch(uri);
          const blob = await response.blob();
          
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            
            try {
              const res = await api.post('/sesli-asistan/ses', {
                ses_dosyasi_base64: base64,
                uzanti: 'm4a'
              });
              
              if (res.data.success) {
                const { cevapMetni, data } = res.data.data;
                setTranscript(data?.metin || '');
                setResponse({ text: cevapMetni, data });
                
                if (data?.tip === 'ONAY_BEKLIYOR') {
                  setPending(data.islem);
                  setMode('result');
                  speak(`${data.islem.miktar} TL ${data.islem.kategori_adi} eklensin mi?`);
                } else {
                  speak(cevapMetni);
                }
              } else {
                setResponse({ text: res.data.message || 'Anlaşılamadı', data: null });
                setMode('result');
              }
            } catch (err: any) {
              console.error('[Asistan] API Hatası:', err);
              Toast.show({ type: 'error', text1: 'Ses işlenemedi' });
              setMode('idle');
            }
          };
          reader.readAsDataURL(blob);
        }
      } catch (e) {
        console.error('[Asistan] Kayıt durdurma hatası:', e);
        setMode('idle');
      }
      
      recordingRef.current = null;
    }
  };

  // İşlem Onay
  const handleApprove = async () => {
    if (!pending) return;
    setMode('processing');
    
    try {
      await api.post('/sesli-asistan/onayla', {
        tip: pending.tip,
        miktar: pending.miktar,
        baslik: pending.baslik,
        kategoriId: pending.kategoriId || pending.kategori_id,
        tarih: new Date().toISOString()
      });
      
      setPending(null);
      setResponse({ text: 'İşlem kaydedildi!', data: { tip: 'SUCCESS' } });
      Toast.show({ type: 'success', text1: 'Kaydedildi!' });
      speak('İşlem kaydedildi!');
    } catch {
      Toast.show({ type: 'error', text1: 'Kayıt başarısız' });
      setMode('result');
    }
  };

  // Hedef Onay (para ekleme)
  const handleGoalApprove = async (hedef: any) => {
    setMode('processing');
    
    try {
      await api.patch(`/hedefler/${hedef.id}`, {
        mevcutMiktar: hedef.yeniMiktar
      });
      
      setResponse({ text: `${hedef.baslik} hedefine ${hedef.miktar} TL eklendi!`, data: { tip: 'SUCCESS' } });
      Toast.show({ type: 'success', text1: 'Hedefe eklendi!' });
      speak(`${hedef.baslik} hedefine ${hedef.miktar} lira eklendi!`);
    } catch {
      Toast.show({ type: 'error', text1: 'Ekleme başarısız' });
      setMode('result');
    }
  };

  const reset = () => {
    setMode('idle');
    setTranscript('');
    setResponse(null);
    setPending(null);
    stopAllAnims();
  };

  useEffect(() => {
    return () => {
      stopAllAnims();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Hızlı komutlar
  const commands = [
    { t: '100 TL kahve içtim', i: 'coffee' as const },
    { t: 'Detaylı rapor ver', i: 'chartPie' as const },
    { t: 'Dolar kaç TL', i: 'moneyBill' as const },
    { t: 'Altın ne kadar', i: 'gem' as const },
    { t: 'Hedeflerim nasıl', i: 'bullseye' as const },
    { t: 'Tasarruf önerisi', i: 'piggyBank' as const },
  ];

  // Wave animasyon stilleri
  const wave1Style = {
    transform: [{ scale: wave1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
    opacity: wave1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
  };
  const wave2Style = {
    transform: [{ scale: wave2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
    opacity: wave2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevronLeft" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sesli Asistan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* IDLE */}
        {mode === 'idle' && !response && (
          <View style={styles.section}>
            <Text style={styles.title}>Merhaba!</Text>
            <Text style={styles.subtitle}>Mikrofona basılı tut ve konuş</Text>
            
            <View style={styles.commands}>
              {commands.map((c, i) => (
                <TouchableOpacity key={i} style={styles.cmdBtn} onPress={() => processCommand(c.t)}>
                  <View style={styles.cmdIcon}>
                    <Icon name={c.i} size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.cmdText}>{c.t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* LISTENING */}
        {mode === 'listening' && (
          <View style={styles.centerSection}>
            <View style={styles.listeningIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.statusText}>Dinliyorum...</Text>
            </View>
            <View style={styles.transcriptRow}>
              <Icon name="microphone" size={16} color={colors.primary} />
              <Text style={styles.transcriptLive}>
                {Platform.OS === 'web' ? (transcript || 'Konuşun...') : 'Konuşun, bırakınca işlenecek'}
              </Text>
            </View>
          </View>
        )}

        {/* PROCESSING */}
        {mode === 'processing' && (
          <View style={styles.centerSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>İşleniyor...</Text>
          </View>
        )}

        {/* SPEAKING */}
        {mode === 'speaking' && (
          <View style={styles.centerSection}>
            <View style={styles.speakingWaves}>
              {waveAnims.map((anim, index) => (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.waveBar, 
                    { height: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 50] }) }
                  ]} 
                />
              ))}
            </View>
            <Text style={styles.statusText}>Yanıtlıyor...</Text>
          </View>
        )}

        {/* RESULT */}
        {mode === 'result' && response && (
          <View style={styles.section}>
            {transcript && (
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{transcript}</Text>
              </View>
            )}

            <View style={styles.aiCard}>
              <Text style={styles.aiText}>{response.text}</Text>

              {/* İŞLEM ONAY */}
              {pending && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmTitle}>İşlem Onayı</Text>
                  <View style={styles.confirmDetail}>
                    <Text style={styles.confirmLabel}>Miktar:</Text>
                    <Text style={styles.confirmValue}>{pending.miktar} TL</Text>
                  </View>
                  <View style={styles.confirmDetail}>
                    <Text style={styles.confirmLabel}>Kategori:</Text>
                    <Text style={styles.confirmValue}>{pending.kategori_adi}</Text>
                  </View>
                  <View style={styles.confirmBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPending(null); setResponse({ text: 'İptal edildi.', data: null }); }}>
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
                      <Text style={styles.approveText}>Onayla</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* DETAYLI RAPOR */}
              {response.data?.tip === 'DETAYLI_RAPOR' && response.data.rapor && (
                <View style={styles.reportSection}>
                  {/* Özet Kartlar */}
                  <View style={styles.summaryCards}>
                    <View style={[styles.summaryCard, { backgroundColor: '#1a1a1a' }]}>
                      <Text style={[styles.summaryLabel, { color: '#999' }]}>Gider</Text>
                      <Text style={[styles.summaryValue, { color: '#fff' }]}>
                        {response.data.rapor.ozet.toplamGider?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#f0f0f0' }]}>
                      <Text style={styles.summaryLabel}>Gelir</Text>
                      <Text style={[styles.summaryValue, { color: '#1a1a1a' }]}>
                        {response.data.rapor.ozet.toplamGelir?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#e8e8e8', borderWidth: 2, borderColor: '#1a1a1a' }]}>
                      <Text style={styles.summaryLabel}>Net</Text>
                      <Text style={[styles.summaryValue, { color: '#1a1a1a' }]}>
                        {response.data.rapor.ozet.netDurum?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                  </View>

                  {/* Bütçe Durumu */}
                  {response.data.rapor.butce?.hedef > 0 && (
                    <View style={styles.budgetBox}>
                      <View style={styles.budgetHeader}>
                        <Text style={styles.budgetTitle}>Bütçe Durumu</Text>
                        <Text style={styles.budgetPercent}>{response.data.rapor.butce.kullanimYuzde}%</Text>
                      </View>
                      <View style={styles.budgetBar}>
                        <View style={[styles.budgetFill, { 
                          width: `${Math.min(response.data.rapor.butce.kullanimYuzde, 100)}%`,
                          backgroundColor: '#1a1a1a'
                        }]} />
                      </View>
                      <Text style={styles.budgetRemaining}>
                        Kalan: {response.data.rapor.butce.kalan?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                  )}

                  {/* Kategori Dağılımı */}
                  {response.data.rapor.kategoriDagilimi?.length > 0 && (
                    <View style={styles.categorySection}>
                      <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
                      {response.data.rapor.kategoriDagilimi.map((kat: any, idx: number) => (
                        <View key={idx} style={styles.categoryRow}>
                          <View style={[styles.categoryDot, { backgroundColor: '#1a1a1a' }]} />
                          <Text style={styles.categoryName}>{kat.ad}</Text>
                          <Text style={styles.categoryPercent}>{kat.yuzde}%</Text>
                          <Text style={styles.categoryAmount}>{kat.miktar?.toLocaleString('tr-TR')} ₺</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Hafta Günleri */}
                  {response.data.rapor.haftaGunleriDagilimi && (
                    <View style={styles.weekSection}>
                      <Text style={styles.sectionTitle}>Haftalık Harcama</Text>
                      <View style={styles.weekBars}>
                        {response.data.rapor.haftaGunleriDagilimi.map((g: any, idx: number) => {
                          const maxTutar = Math.max(...response.data.rapor.haftaGunleriDagilimi.map((x: any) => x.tutar || 0));
                          const height = maxTutar > 0 ? ((g.tutar || 0) / maxTutar) * 60 : 5;
                          return (
                            <View key={idx} style={styles.weekBarContainer}>
                              <View style={[styles.weekBar, { height: Math.max(height, 5), backgroundColor: '#1a1a1a' }]} />
                              <Text style={styles.weekLabel}>{g.gun}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Karşılaştırma */}
                  {response.data.rapor.karsilastirma && (
                    <View style={styles.compareBox}>
                      <Text style={styles.sectionTitle}>Geçen Aya Göre</Text>
                      <View style={styles.compareRow}>
                        <Text style={styles.compareLabel}>Fark:</Text>
                        <Text style={[styles.compareValue, { color: '#1a1a1a' }]}>
                          {response.data.rapor.karsilastirma.trendYuzde > 0 ? '↑' : '↓'} %{Math.abs(response.data.rapor.karsilastirma.trendYuzde)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Hedefler */}
                  {response.data.rapor.hedefler?.length > 0 && (
                    <View style={styles.goalsSection}>
                      <Text style={styles.sectionTitle}>Hedefler</Text>
                      {response.data.rapor.hedefler.map((h: any, idx: number) => (
                        <View key={idx} style={styles.goalRow}>
                          <Text style={styles.goalName}>{h.baslik}</Text>
                          <View style={styles.goalBarContainer}>
                            <View style={[styles.goalBar, { width: `${h.ilerleme}%`, backgroundColor: '#1a1a1a' }]} />
                          </View>
                          <Text style={styles.goalPercent}>{h.ilerleme}%</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* ANALİZ */}
              {response.data?.tip === 'ANALIZ' && response.data.analiz && (
                <View style={styles.reportSection}>
                  <View style={styles.summaryCards}>
                    <View style={[styles.summaryCard, { backgroundColor: '#1a1a1a' }]}>
                      <Text style={[styles.summaryLabel, { color: '#999' }]}>Gider</Text>
                      <Text style={[styles.summaryValue, { color: '#fff' }]}>
                        {response.data.analiz.toplamGider?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#f0f0f0' }]}>
                      <Text style={styles.summaryLabel}>Gelir</Text>
                      <Text style={[styles.summaryValue, { color: '#1a1a1a' }]}>
                        {response.data.analiz.toplamGelir?.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                  </View>

                  {response.data.analiz.kategoriDetay?.length > 0 && (
                    <View style={styles.categorySection}>
                      <Text style={styles.sectionTitle}>Kategori Analizi</Text>
                      {response.data.analiz.kategoriDetay.slice(0, 5).map((kat: any, idx: number) => (
                        <View key={idx} style={styles.categoryRow}>
                          <View style={[styles.categoryDot, { backgroundColor: '#1a1a1a' }]} />
                          <Text style={styles.categoryName}>{kat.ad}</Text>
                          <Text style={styles.categoryPercent}>{kat.yuzde}%</Text>
                          <Text style={styles.categoryAmount}>{kat.miktar?.toLocaleString('tr-TR')} ₺</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* HEDEF ANALİZ */}
              {response.data?.tip === 'HEDEF_ANALIZ' && response.data.hedefler && (
                <View style={styles.reportSection}>
                  <View style={styles.summaryCards}>
                    <View style={[styles.summaryCard, { backgroundColor: '#1a1a1a' }]}>
                      <Text style={[styles.summaryLabel, { color: '#999' }]}>Aktif</Text>
                      <Text style={[styles.summaryValue, { color: '#fff' }]}>{response.data.ozet?.aktif || 0}</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#f0f0f0' }]}>
                      <Text style={styles.summaryLabel}>Tamamlanan</Text>
                      <Text style={[styles.summaryValue, { color: '#1a1a1a' }]}>{response.data.ozet?.tamamlanan || 0}</Text>
                    </View>
                  </View>

                  {response.data.hedefler.map((h: any, idx: number) => (
                    <View key={idx} style={styles.goalCard}>
                      <View style={styles.goalCardHeader}>
                        <Text style={styles.goalCardTitle}>{h.baslik}</Text>
                        <Text style={[styles.goalCardStatus, { color: '#1a1a1a' }]}>
                          {h.durum === 'TAMAMLANDI' ? '✓ Tamamlandı' : `${h.ilerleme}%`}
                        </Text>
                      </View>
                      <View style={styles.goalBarContainer}>
                        <View style={[styles.goalBar, { width: `${h.ilerleme}%`, backgroundColor: '#1a1a1a' }]} />
                      </View>
                      <View style={styles.goalCardFooter}>
                        <Text style={styles.goalCardAmount}>{h.mevcutMiktar?.toLocaleString('tr-TR')} / {h.hedefMiktar?.toLocaleString('tr-TR')} ₺</Text>
                        <Text style={styles.goalCardRemaining}>Kalan: {h.kalan?.toLocaleString('tr-TR')} ₺</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* HEDEF ONAY (para ekleme) */}
              {response.data?.tip === 'HEDEF_ONAY' && response.data.hedef && (
                <View style={styles.goalConfirmBox}>
                  <Text style={styles.confirmTitle}>Hedefe Para Ekle</Text>
                  <View style={styles.goalConfirmDetail}>
                    <Text style={styles.goalConfirmLabel}>{response.data.hedef.baslik}</Text>
                    <Text style={styles.goalConfirmValue}>+{response.data.hedef.miktar?.toLocaleString('tr-TR')} ₺</Text>
                  </View>
                  <View style={styles.goalBarContainer}>
                    <View style={[styles.goalBar, { width: `${response.data.hedef.ilerleme}%`, backgroundColor: '#1a1a1a' }]} />
                  </View>
                  <Text style={styles.goalConfirmInfo}>
                    Yeni toplam: {response.data.hedef.yeniMiktar?.toLocaleString('tr-TR')} / {response.data.hedef.hedefMiktar?.toLocaleString('tr-TR')} ₺
                  </Text>
                  <View style={styles.confirmBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setResponse({ text: 'İptal edildi.', data: null }); }}>
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleGoalApprove(response.data.hedef)}>
                      <Text style={styles.approveText}>Onayla</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PİYASA VERİLERİ */}
              {response.data?.piyasa && (
                <View style={styles.reportSection}>
                  <Text style={styles.sectionTitle}>Piyasa Verileri</Text>
                  <View style={styles.marketGrid}>
                    {response.data.piyasa.doviz?.dolar && (
                      <View style={[styles.marketCard, { backgroundColor: '#1a1a1a' }]}>
                        <Text style={[styles.marketLabel, { color: '#999' }]}>Dolar</Text>
                        <Text style={[styles.marketValue, { color: '#fff' }]}>{response.data.piyasa.doviz.dolar.satis?.toFixed(2)} ₺</Text>
                      </View>
                    )}
                    {response.data.piyasa.doviz?.euro && (
                      <View style={[styles.marketCard, { backgroundColor: '#f0f0f0' }]}>
                        <Text style={styles.marketLabel}>Euro</Text>
                        <Text style={styles.marketValue}>{response.data.piyasa.doviz.euro.satis?.toFixed(2)} ₺</Text>
                      </View>
                    )}
                    {response.data.piyasa.altin?.gram && (
                      <View style={[styles.marketCard, { backgroundColor: '#1a1a1a' }]}>
                        <Text style={[styles.marketLabel, { color: '#999' }]}>Gram Altın</Text>
                        <Text style={[styles.marketValue, { color: '#fff' }]}>{response.data.piyasa.altin.gram.satis?.toLocaleString('tr-TR')} ₺</Text>
                      </View>
                    )}
                    {response.data.piyasa.bist100 && (
                      <View style={[styles.marketCard, { backgroundColor: '#f0f0f0' }]}>
                        <Text style={styles.marketLabel}>BIST 100</Text>
                        <Text style={styles.marketValue}>{response.data.piyasa.bist100.deger?.toLocaleString('tr-TR')}</Text>
                        <Text style={[styles.marketChange, { color: '#1a1a1a' }]}>
                          {response.data.piyasa.bist100.degisimYuzde >= 0 ? '+' : ''}{response.data.piyasa.bist100.degisimYuzde?.toFixed(2)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.newBtn} onPress={reset}>
              <Icon name="repeat" size={16} color={colors.primary} />
              <Text style={styles.newText}>Yeni Soru</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MİKROFON ALANI */}
      <View style={styles.micSection}>
        {mode === 'listening' && (
          <>
            <Animated.View style={[styles.wave, wave1Style]} />
            <Animated.View style={[styles.wave, wave2Style]} />
          </>
        )}
        
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={[styles.micBtn, mode === 'listening' && styles.micBtnActive]}
            onPressIn={startListening}
            onPressOut={stopListening}
            disabled={mode === 'processing' || mode === 'speaking'}
          >
            {mode === 'processing' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Icon name="microphone" size={28} color="#FFF" />
            )}
          </Pressable>
        </Animated.View>
        
        <Text style={styles.micHint}>
          {mode === 'listening' ? 'Bırakınca gönderilecek' :
           mode === 'processing' ? 'İşleniyor...' :
           mode === 'speaking' ? 'Konuşuyor...' : 'Basılı tut ve konuş'}
        </Text>
        
        {/* Metin girişi alternatif */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="veya yaz..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => {
              if (inputText.trim()) {
                processCommand(inputText.trim());
                setInputText('');
              }
            }}
            editable={mode === 'idle' || mode === 'result'}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => {
              if (inputText.trim()) {
                processCommand(inputText.trim());
                setInputText('');
              }
            }}
            disabled={!inputText.trim() || mode === 'processing'}
          >
            <Icon name="paperPlane" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: colors.onSurface },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 280 },

  section: { gap: 16 },
  centerSection: { alignItems: 'center', paddingTop: 60, gap: 16 },
  
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: colors.onSurface, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center' },
  statusText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: colors.primary },
  transcriptLive: { fontFamily: 'Poppins_500Medium', fontSize: 16, color: colors.onSurface, textAlign: 'center' },
  transcriptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  listeningIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a1a1a' },

  commands: { gap: 10, marginTop: 20 },
  cmdBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  cmdIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cmdText: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.onSurface },

  speakingWaves: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 60 },
  waveBar: { width: 6, backgroundColor: colors.primary, borderRadius: 3, minHeight: 12 },

  userBubble: { alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderBottomRightRadius: 4 },
  userText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#FFF' },

  aiCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight },
  aiText: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: colors.onSurface, lineHeight: 24 },

  confirmBox: { marginTop: 16, padding: 14, backgroundColor: colors.surfaceContainerHigh, borderRadius: 12 },
  confirmTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.onSurface, marginBottom: 10 },
  confirmDetail: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  confirmLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  confirmValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.onSurface },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.error },
  approveBtn: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  approveText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFF' },

  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  newText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.primary },

  // RAPOR STİLLERİ
  reportSection: { marginTop: 16, gap: 16 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.onSurface, marginBottom: 8 },
  
  summaryCards: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.onSurfaceVariant },
  summaryValue: { fontFamily: 'Poppins_700Bold', fontSize: 16, marginTop: 2 },

  budgetBox: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetTitle: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.onSurface },
  budgetPercent: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.primary },
  budgetBar: { height: 8, backgroundColor: colors.borderLight, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 4 },
  budgetRemaining: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 6 },

  categorySection: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  categoryName: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.onSurface },
  categoryPercent: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.primary, marginRight: 10, width: 40, textAlign: 'right' },
  categoryAmount: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.onSurfaceVariant, width: 80, textAlign: 'right' },

  weekSection: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12 },
  weekBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, paddingTop: 10 },
  weekBarContainer: { alignItems: 'center', flex: 1 },
  weekBar: { width: 20, backgroundColor: colors.primary, borderRadius: 4 },
  weekLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 },

  compareBox: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  compareValue: { fontFamily: 'Poppins_700Bold', fontSize: 18 },

  goalsSection: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  goalName: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.onSurface, width: 80 },
  goalBarContainer: { flex: 1, height: 8, backgroundColor: colors.borderLight, borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  goalBar: { height: '100%', borderRadius: 4 },
  goalPercent: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.primary, width: 40, textAlign: 'right' },

  goalCard: { backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: 12, marginBottom: 10 },
  goalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalCardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.onSurface },
  goalCardStatus: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  goalCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  goalCardAmount: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.onSurfaceVariant },
  goalCardRemaining: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: colors.primary },

  marketGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  marketCard: { width: '48%', backgroundColor: colors.surfaceContainerHigh, padding: 12, borderRadius: 10, alignItems: 'center' },
  marketLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.onSurfaceVariant },
  marketValue: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.onSurface, marginTop: 2 },
  marketChange: { fontFamily: 'Poppins_500Medium', fontSize: 11, marginTop: 2 },

  goalConfirmBox: { marginTop: 16, padding: 14, backgroundColor: colors.surfaceContainerHigh, borderRadius: 12 },
  goalConfirmDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  goalConfirmLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.onSurface },
  goalConfirmValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1a1a1a' },
  goalConfirmInfo: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' },

  // MİKROFON
  micSection: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  wave: { 
    position: 'absolute', 
    top: 20,
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 3, 
    borderColor: colors.primary,
  },
  micBtn: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6 
  },
  micBtnActive: { backgroundColor: colors.error },
  micHint: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 10 },
  
  textInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 8,
    width: '100%',
  },
  textInput: { 
    flex: 1, 
    height: 44, 
    backgroundColor: colors.surfaceContainerHigh, 
    borderRadius: 22, 
    paddingHorizontal: 16,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  sendBtnDisabled: { 
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.5,
  },
});
