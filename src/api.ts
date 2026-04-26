// src/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Dưới đây là IP của Anh Bùi, ai code thì vô cmd gõ ipconfig sau đó cop ip của mình vào đây
const BASE_URL = 'http://192.168.2.8:5000/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, you would store this in AsyncStorage/ureStore
let authToken: string | null = null;
let refreshTokenValue: string | null = null;
let csrfToken: string | null = null;
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];
let _navigateToLogin: (() => void) | null = null;

export const setNavigationRef = (fn: () => void) => {
  _navigateToLogin = fn;
};

export const loadAuthToken = async () => {
  try {
    const [token, rToken] = await AsyncStorage.multiGet(['authToken', 'refreshToken']);
    if (token[1]) authToken = token[1];
    if (rToken[1]) refreshTokenValue = rToken[1];
    return token[1];
  } catch (error) {
    console.error('Failed to load token', error);
    return null;
  }
};

export const setAuthToken = async (token: string | null, persist: boolean = true) => {
  authToken = token;
  try {
    if (token) {
      if (persist) {
        await AsyncStorage.setItem('authToken', token);
      } else {
        await AsyncStorage.removeItem('authToken');
      }
    } else {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
      refreshTokenValue = null;
    }
  } catch (error) {
    console.error('Failed to save token', error);
  }
};

export const setRefreshToken = async (token: string | null) => {
  refreshTokenValue = token;
  try {
    if (token) {
      await AsyncStorage.setItem('refreshToken', token);
    } else {
      await AsyncStorage.removeItem('refreshToken');
    }
  } catch (error) {
    console.error('Failed to save refresh token', error);
  }
};

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

const isUnsafeMethod = (method?: string) => {
  const normalized = (method || 'GET').toUpperCase();
  return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE';
};

const fetchCsrfToken = async () => {
  const response = await axiosClient.get('/csrf-token', {
    withCredentials: true,
  });

  const token = response?.data?.csrfToken;
  if (!token || typeof token !== 'string') {
    throw new Error('Cannot obtain CSRF token');
  }

  csrfToken = token;
  return csrfToken;
};

axiosClient.interceptors.request.use(async (config) => {
  if (isUnsafeMethod(config.method)) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
  }

  const isFormData = config.data instanceof FormData;

  config.headers = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Client': 'mobile-driver',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(config.headers || {}),
  } as any;

  // Let Axios set the boundary automatically for FormData
  if (isFormData && config.headers['Content-Type']) {
    delete config.headers['Content-Type'];
  }

  config.withCredentials = true;

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    const originalRequest = error?.config;

    // If CSRF token expired/invalid, refresh token and retry one time.
    if (
      status === 403 &&
      typeof message === 'string' &&
      message.toLowerCase().includes('csrf') &&
      originalRequest &&
      !originalRequest._csrfRetried &&
      isUnsafeMethod(originalRequest.method)
    ) {
      originalRequest._csrfRetried = true;
      await fetchCsrfToken();
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        'X-CSRF-Token': csrfToken as string,
      };
      return axiosClient.request(originalRequest);
    }

    // Avoid logging token expiry as an error since we handle it automatically via refresh
    if (status !== 401 || !message.toLowerCase().includes('token')) {
      console.error(`[API] Request failed: ${message}`);
    }

    // Auto-refresh on 401 Token expired
    if (status === 401 && originalRequest && !originalRequest._authRetried) {
      originalRequest._authRetried = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return axiosClient.request(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(new Error(message));
  }
);

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingRequests.push((token: string) => {
        if (token) resolve(token);
        else reject(new Error('Refresh failed'));
      });
    });
  }

  isRefreshing = true;
  try {
    const storedRefresh = await AsyncStorage.getItem('refreshToken');
    if (!storedRefresh) throw new Error('No refresh token');

    const refreshResponse = await axiosClient.post('/auth/refresh', {
      refreshToken: storedRefresh,
    });

    const newAccessToken = refreshResponse.data?.accessToken;
    const newRefreshToken = refreshResponse.data?.refreshToken;

    if (!newAccessToken) throw new Error('Refresh failed');

    await AsyncStorage.setItem('authToken', newAccessToken);
    if (newRefreshToken) await AsyncStorage.setItem('refreshToken', newRefreshToken);
    authToken = newAccessToken;

    pendingRequests.forEach((cb) => cb(newAccessToken));
    pendingRequests = [];
    return newAccessToken;
  } catch (error) {
    pendingRequests = [];
    await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
    authToken = null;
    if (_navigateToLogin) _navigateToLogin();
    throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  } finally {
    isRefreshing = false;
  }
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const rawBody = (options as any).body;
  const data = rawBody
    ? typeof rawBody === 'string'
      ? JSON.parse(rawBody)
      : rawBody
    : undefined;

  const config: AxiosRequestConfig = {
    url: endpoint,
    method: method as AxiosRequestConfig['method'],
    data,
    headers: options.headers as any,
  };

  const response = await axiosClient.request(config);
  console.log(`[API] Response from ${endpoint}:`, response.data);
  return response.data;
};

export const endpoints = {
  auth: {
    login: '/auth/login',
    googleLogin: '/auth/google-login',
    forgotPassword: '/auth/forgot-password',
    verifyOtp: '/auth/verify-otp',
    resetPassword: '/auth/reset-password',
  },
  user: {
    getProfile: '/customer/personal-info',
    updateProfile: '/customer/personal-info',
    changePassword: '/customer/change-password',
  },
  staff: {
    getOrders: '/staff/orders',
    getOrderDetails: (invoiceId: string) => `/staff/orders/${invoiceId}`,
    startOrder: (invoiceId: string) => `/staff/orders/${invoiceId}/start`,
    completeOrder: (invoiceId: string) => `/staff/orders/${invoiceId}/complete`,
    updateAssignmentStatus: (assignmentId: string) => `/staff/assignments/${assignmentId}/status`,
    updateAssignmentRoute: (assignmentId: string) => `/staff/assignments/${assignmentId}/route`,
    getIncidentTypes: '/staff/incidents/meta/types',
    getMyIncidents: '/staff/incidents',
    createIncident: '/staff/incidents',
    getSchedule: '/staff/schedule',
    pickup: (orderId: string) => `/staff/orders/${orderId}/pickup`,
    dropoff: (orderId: string) => `/staff/orders/${orderId}/dropoff`,
    getProxyRoute: '/staff/routing/osrm',
    getNotifications: '/notifications',
    markNotificationRead: (id: string) => `/notifications/${id}/read`,
  },
};

export const staffApi = {
  getSchedule: () => axiosClient.get(endpoints.staff.getSchedule).then((res) => res.data),
  getOrders: () => axiosClient.get(endpoints.staff.getOrders).then((res) => res.data),
  getOrderDetails: (invoiceId: string) =>
    axiosClient.get(endpoints.staff.getOrderDetails(invoiceId)).then((res) => res.data),
  startOrder: (invoiceId: string) =>
    axiosClient.put(endpoints.staff.startOrder(invoiceId)).then((res) => res.data),
  completeOrder: (invoiceId: string) =>
    axiosClient.put(endpoints.staff.completeOrder(invoiceId)).then((res) => res.data),
  getIncidentTypes: () => axiosClient.get(endpoints.staff.getIncidentTypes).then((res) => res.data),
  getMyIncidents: () => axiosClient.get(endpoints.staff.getMyIncidents).then((res) => res.data),
  createIncident: async (formData: FormData) => {
    return axiosClient.post(endpoints.staff.createIncident, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  updateAssignmentStatus: (assignmentId: string, status: string) =>
    axiosClient.patch(endpoints.staff.updateAssignmentStatus(assignmentId), { status }).then((res) => res.data),
  submitPickup: async (orderId: string, formData: FormData) => {
    return axiosClient.post(endpoints.staff.pickup(orderId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  submitDropoff: async (orderId: string, formData: FormData) => {
    return axiosClient.post(endpoints.staff.dropoff(orderId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  getProxyRoute: (p1: string, p2: string) =>
    axiosClient.get(endpoints.staff.getProxyRoute, { params: { p1, p2 } }).then((res) => res.data),
  getNotifications: () => axiosClient.get(endpoints.staff.getNotifications).then((res) => res.data),
  markNotificationRead: (id: string) =>
    axiosClient.patch(endpoints.staff.markNotificationRead(id)).then((res) => res.data),
};