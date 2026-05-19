import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Icon } from '../components';

interface WidgetData {
  gunlukHarcama: number;
  gunlukLimit: number;
  toplamGelir: number;
  toplamGider: number;
}

interface FinansWidgetProps {
  data?: WidgetData;
}

export const FinansWidget: React.FC<FinansWidgetProps> = ({ data }) => {
  const defaultData: WidgetData = {
    gunlukHarcama: 0,
    gunlukLimit: 500,
    toplamGelir: 0,
    toplamGider: 0,
  };

  const widgetData = data || defaultData;
  const kalanLimit = widgetData.gunlukLimit - widgetData.gunlukHarcama;
  const limitYuzde = Math.min((widgetData.gunlukHarcama / widgetData.gunlukLimit) * 100, 100);

  const openApp = () => {
    Linking.openURL('finans://asistan');
  };

  const openVoiceAssistant = () => {
    Linking.openURL('finans://asistan?voice=true');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finans</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</Text>
      </View>

      <View style={styles.limitSection}>
        <Text style={styles.limitLabel}>Günlük Limit</Text>
        <View style={styles.limitBar}>
          <View style={[styles.limitFill, { width: `${limitYuzde}%` }]} />
        </View>
        <View style={styles.limitInfo}>
          <Text style={styles.limitSpent}>{widgetData.gunlukHarcama.toLocaleString('tr-TR')} TL</Text>
          <Text style={styles.limitRemaining}>Kalan: {kalanLimit.toLocaleString('tr-TR')} TL</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gelir</Text>
          <Text style={styles.summaryValuePositive}>{widgetData.toplamGelir.toLocaleString('tr-TR')} TL</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gider</Text>
          <Text style={styles.summaryValueNegative}>{widgetData.toplamGider.toLocaleString('tr-TR')} TL</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={openApp}>
          <Icon name="plus" size={16} color="#1a1a1a" />
          <Text style={styles.actionText}>Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.voiceBtn]} onPress={openVoiceAssistant}>
          <Icon name="microphone" size={16} color="#ffffff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Asistan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  limitSection: {
    marginBottom: 16,
  },
  limitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  limitBar: {
    height: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  limitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  limitSpent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  limitRemaining: {
    fontSize: 12,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
  },
  summaryValuePositive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryValueNegative: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4a4a4a',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  voiceBtn: {
    backgroundColor: '#1a1a1a',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});

export default FinansWidget;
