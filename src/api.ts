// src/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Dưới đây là IP của Anh Bùi, ai code thì vô cmd gõ ipconfig sau đó cop ip của mình vào đây
const BASE_URL = 'http://10.63.47.129:5000/api';

// In a real app, you would store this in AsyncStorage/ureStore
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

axiosClient.interceptors.request.use((config) => {
  config.headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client': 'mobile-driver',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(config.headers || {}),
  } as any;

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
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
    acceptOrder: (orderId: string) => `/staff/orders/${orderId}/accept`,
    startOrder: (orderId: string) => `/staff/orders/${orderId}/start`,
    pickup: (orderId: string) => `/staff/orders/${orderId}/pickup`,
    dropoff: (orderId: string) => `/staff/orders/${orderId}/dropoff`,
    complete: (orderId: string) => `/staff/orders/${orderId}/complete`,
  },
};

export const staffApi = {
  getSchedule: () => axiosClient.get(endpoints.staff.getSchedule).then((res) => res.data),
  getOrders: () => axiosClient.get(endpoints.staff.getOrders).then((res) => res.data),
  getOrderDetails: (invoiceId: string) =>
    axiosClient.get(endpoints.staff.getOrderDetails(invoiceId)).then((res) => res.data),
  acceptOrder: (orderId: string) =>
    axiosClient.put(endpoints.staff.acceptOrder(orderId)).then((res) => res.data),
  startOrder: (orderId: string) =>
    axiosClient.put(endpoints.staff.startOrder(orderId)).then((res) => res.data),
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
  completeOrder: (orderId: string) =>
    axiosClient.put(endpoints.staff.complete(orderId)).then((res) => res.data),
};