import { Platform, Alert, ToastAndroid } from 'react-native';

export const showToast = (message: string) => {
    if (!message) return;
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
        Alert.alert('', message);
    }
};