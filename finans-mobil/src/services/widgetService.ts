import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface WidgetData {
  gunlukHarcama: number;
  gunlukLimit: number;
  toplamGelir: number;
  toplamGider: number;
  hedefAdi: string;
  mevcutMiktar: number;
  hedefMiktar: number;
  updatedAt: string;
}

// Widget verisini kaydet
export async function saveWidgetData(data: Partial<WidgetData>): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  try {
    const existing = await AsyncStorage.getItem('widget_data');
    const parsed = existing ? JSON.parse(existing) : {};
    
    const newData: WidgetData = {
      ...parsed,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem('widget_data', JSON.stringify(newData));
    
    // Widget'ı güncelle
    await updateWidgets();
  } catch (error) {
    console.error('Widget data kaydetme hatası:', error);
  }
}

// Widget'ları güncelle (native modül çağrısı)
export async function updateWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { getWidgetElement } = await import('../widgets/widget-task-handler');

    await requestWidgetUpdate({
      widgetName: 'GunlukHarcama',
      renderWidget: async () => await getWidgetElement('GunlukHarcama'),
    });

    await requestWidgetUpdate({
      widgetName: 'SesliAsistan',
      renderWidget: async () => await getWidgetElement('SesliAsistan'),
    });

    await requestWidgetUpdate({
      widgetName: 'HedefTakip',
      renderWidget: async () => await getWidgetElement('HedefTakip'),
    });
  } catch (error) {
    console.error('Widget güncelleme hatası:', error);
  }
}

// Logout olunca widget'ı temizle
export async function clearWidgetData(): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  try {
    await AsyncStorage.removeItem('widget_data');
    await updateWidgets();
  } catch (error) {
    console.error('Widget temizleme hatası:', error);
  }
}

