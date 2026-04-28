import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual backend URL when in production/dev
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:5000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, ''); // Strip out /api if present

class LocationTrackingService {
  private socket: Socket | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;

  public async initSocket() {
    if (!this.socket) {
      console.log('LocationTrackingService: Connecting to', BACKEND_URL);
      this.socket = io(BACKEND_URL, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('LocationTrackingService: Connected to backend socket', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('LocationTrackingService: Disconnected from backend socket');
      });
    }
  }

  public async startTracking(userId: string, role: string) {
    if (this.isTracking) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      await this.initSocket();

      this.isTracking = true;

      // Start watching foreground location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
        },
        (location) => {
          if (this.socket && this.socket.connected) {
            this.socket.emit('update_location', {
              userId: userId,
              role: role,
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
            });
            console.log('Location update emitted:', location.coords.latitude, location.coords.longitude);
          }
        }
      );

      console.log('Started foreground location tracking');

    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
    }
  }

  public stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isTracking = false;
    console.log('Stopped location tracking');
  }
}

export default new LocationTrackingService();
