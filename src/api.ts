// src/api.ts

// Dưới đây là IP của Anh Bùi, ai code thì vô cmd gõ ipconfig sau đó cop ip của mình vào đây
const BASE_URL = 'http://10.63.47.129:5000/api';

// In a real app, you would store this in AsyncStorage/ureStore
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[API] Fetching: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client': 'mobile-driver',
    'ngrok-skip-browser-warning': 'true', // Tránh trang warning của Ngrok khi gọi API
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  console.log(`[API] Headers for ${endpoint}:`, JSON.stringify(headers, null, 2));

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log(`[API] Raw response from ${endpoint}:`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[API] JSON Parse Error for ${endpoint}. Raw text starts with: ${responseText.substring(0, 100)}`);
      throw new Error(`Invalid JSON response from server. Check Ngrok/Server status.`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
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
  },
};
