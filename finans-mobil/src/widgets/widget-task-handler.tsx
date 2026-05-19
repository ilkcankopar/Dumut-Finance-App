import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GunlukHarcamaWidget } from './GunlukHarcamaWidget';
import { SesliAsistanWidget } from './SesliAsistanWidget';
import { HedefWidget } from './HedefWidget';

export const getWidgetElement = async (widgetName: string) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const isLoggedIn = !!token;
    const widgetDataStr = await AsyncStorage.getItem('widget_data');
    const widgetData = widgetDataStr ? JSON.parse(widgetDataStr) : {};

    switch (widgetName) {
      case 'GunlukHarcama':
        return (
          <GunlukHarcamaWidget 
            isLoggedIn={isLoggedIn}
            gunlukHarcama={widgetData.gunlukHarcama || 0}
            gunlukLimit={widgetData.gunlukLimit || 500}
          />
        );
      
      case 'SesliAsistan':
        return (
          <SesliAsistanWidget isLoggedIn={isLoggedIn} />
        );
      
      case 'HedefTakip':
        return (
          <HedefWidget 
            isLoggedIn={isLoggedIn}
            hedefAdi={widgetData.hedefAdi || 'Hedef'}
            mevcutMiktar={widgetData.mevcutMiktar || 0}
            hedefMiktar={widgetData.hedefMiktar || 1000}
          />
        );
      
      default:
        return (
          <GunlukHarcamaWidget 
            isLoggedIn={isLoggedIn}
            gunlukHarcama={widgetData.gunlukHarcama || 0}
            gunlukLimit={widgetData.gunlukLimit || 500}
          />
        );
    }
  } catch (err) {
    console.error('getWidgetElement error:', err);
    return <GunlukHarcamaWidget isLoggedIn={false} gunlukHarcama={0} gunlukLimit={500} />;
  }
};

const widgetTaskHandler = async (props: WidgetTaskHandlerProps) => {
  try {
    const widgetName = props.widgetInfo.widgetName;
    const widgetElement = await getWidgetElement(widgetName);
    return props.renderWidget(widgetElement);
  } catch (e) {
    console.log('Widget render error:', e);
    return props.renderWidget(
      <GunlukHarcamaWidget 
        isLoggedIn={false}
        gunlukHarcama={0}
        gunlukLimit={500}
      />
    );
  }
};

export const registerWidgets = () => {
  try {
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (e) {
    console.log('Widget handler registration error:', e);
  }
};

