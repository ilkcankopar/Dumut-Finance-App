import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Widget task handler'ı kaydet (sadece Android)
if (Platform.OS === 'android') {
  try {
    const { registerWidgets } = require('./src/widgets/widget-task-handler');
    registerWidgets();
  } catch (e) {
    console.log('Widget registration error:', e);
  }
}

registerRootComponent(App);
