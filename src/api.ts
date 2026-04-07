// src/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Dưới đây là IP của Anh Bùi, ai code thì vô cmd gõ ipconfig sau đó cop ip của mình vào đây
const BASE_URL = 'http://10.63.47.129:5000/api';

// In a real app, you would store this in AsyncStorage/ureStore
let authToken: string | null = null;
let csrfToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
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

  config.headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client': 'mobile-driver',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(config.headers || {}),
  } as any;

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

    console.error(`[API] Request failed: ${message}`);
    return Promise.reject(new Error(message));
  }
);

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
    updateAssignmentStatus: (assignmentId: string) => `/staff/assignments/${assignmentId}/status`,
    updateAssignmentRoute: (assignmentId: string) => `/staff/assignments/${assignmentId}/route`,
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
  updateAssignmentStatus: (assignmentId: string, status: string) =>
    axiosClient.patch(endpoints.staff.updateAssignmentStatus(assignmentId), { status }).then((res) => res.data),
  submitPickup: (orderId: string, formData: FormData) =>
    axiosClient
      .post(endpoints.staff.pickup(orderId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),
  submitDropoff: (orderId: string, formData: FormData) =>
    axiosClient
      .post(endpoints.staff.dropoff(orderId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),
  getProxyRoute: (p1: string, p2: string) =>
    axiosClient.get(endpoints.staff.getProxyRoute, { params: { p1, p2 } }).then((res) => res.data),
  getNotifications: () => axiosClient.get(endpoints.staff.getNotifications).then((res) => res.data),
  markNotificationRead: (id: string) =>
    axiosClient.patch(endpoints.staff.markNotificationRead(id)).then((res) => res.data),
};