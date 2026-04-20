import { staffApi } from "../api";

export type StaffNotification = {
  id: string;
  orderId: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

const normalizeNotification = (raw: any): StaffNotification => ({
  id: String(raw?.id || raw?._id || ""),
  orderId: String(
    // ticketId is the RequestTicket ID sent by dispatch — backend supports lookup by either REQ ID or INV ID
    raw?.ticketId ||
      raw?.orderId ||
      raw?.invoiceId ||
      raw?.order_id ||
      raw?.referenceId ||
      raw?.data?.orderId ||
      "",
  ),
  title: String(raw?.title || "Thông báo mới"),
  message: String(raw?.message || raw?.body || ""),
  createdAt: String(raw?.createdAt || raw?.created_at || new Date().toISOString()),
  isRead: Boolean(raw?.isRead),
});

const toList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const fetchStaffNotifications = async (): Promise<StaffNotification[]> => {
  const response = await staffApi.getNotifications();
  return toList(response).map(normalizeNotification);
};

export const markNotificationAsRead = async (notificationId: string) => {
  if (!notificationId) return;

  await staffApi.markNotificationRead(notificationId);
};
