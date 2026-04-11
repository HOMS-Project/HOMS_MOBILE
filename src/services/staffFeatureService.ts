import { staffApi } from "../api";

export type TeamOrderSummary = {
  invoiceId: string;
  assignmentId?: string;
  orderCode: string;
  status: string;
  scheduledTime?: string;
  pickupAddress: string;
  deliveryAddress: string;
};

export type TeamMember = {
  id?: string;
  fullName: string;
  phone: string;
  avatar?: string;
  isCurrentUser?: boolean;
};

export type TeamDetail = {
  invoiceId: string;
  assignmentId?: string;
  orderCode: string;
  status: string;
  scheduledTime?: string;
  pickupAddress: string;
  deliveryAddress: string;
  vehicle: {
    plateNumber: string;
    vehicleType: string;
  } | null;
  drivers: TeamMember[];
  assistants: TeamMember[];
};

export type IncidentTypeOption = {
  value: string;
  label: string;
};

export type StaffIncident = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  type: string;
  status: string;
  description: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type IncidentMediaInput = {
  uri: string;
  mimeType?: string;
  fileName?: string;
};

const mapAndDeduplicateMembers = (members: any[]): TeamMember[] => {
  const result: TeamMember[] = [];
  const seen = new Set<string>();

  members.forEach((member) => {
    const id = member?.id || member?._id;
    const fullName = member?.fullName || "Chưa có tên";
    const phone = member?.phone || "";
    const dedupeKey = String(id || `${fullName}-${phone}`);

    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    result.push({
      id,
      fullName,
      phone,
      avatar: member?.avatar || "",
      isCurrentUser: Boolean(member?.isCurrentUser),
    });
  });

  return result;
};

const getMimeType = (uri: string, fallback = "image/jpeg") => {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/mp4";
  return fallback;
};

const getFileName = (uri: string, idx: number) => {
  const file = uri.split("/").pop();
  if (file && file.includes(".")) return file;
  return `incident-${Date.now()}-${idx}.jpg`;
};

export const fetchAssignedInvoices = async (): Promise<TeamOrderSummary[]> => {
  const result = await staffApi.getOrders();
  const payload = (result as any)?.data ?? result;

  return (Array.isArray(payload) ? payload : []).map((item: any) => ({
    invoiceId: item.invoiceId || item.id || item._id,
    assignmentId: item.assignmentId,
    orderCode: item.orderCode || "Đơn hàng",
    status: String(item.status || "").toUpperCase(),
    scheduledTime: item.scheduledTime,
    pickupAddress: item.pickup?.address || "",
    deliveryAddress: item.delivery?.address || "",
  }));
};

export const fetchTeamOrderDetail = async (
  invoiceId: string,
): Promise<TeamDetail> => {
  const result = await staffApi.getOrderDetails(invoiceId);
  const payload = (result as any)?.data ?? result;

  const drivers = Array.isArray(payload?.team?.drivers)
    ? payload.team.drivers
    : [];
  const assistants = Array.isArray(payload?.team?.assistants)
    ? payload.team.assistants
    : [];

  const mappedDrivers = mapAndDeduplicateMembers(drivers);
  const mappedAssistants = mapAndDeduplicateMembers(assistants);

  return {
    invoiceId: payload?.invoiceId || payload?.id || invoiceId,
    assignmentId: payload?.assignmentId,
    orderCode: payload?.orderCode || "Đơn hàng",
    status: String(payload?.status || "").toUpperCase(),
    scheduledTime: payload?.scheduledTime,
    pickupAddress: payload?.pickup?.address || "",
    deliveryAddress: payload?.delivery?.address || "",
    vehicle: payload?.team?.vehicle
      ? {
          plateNumber: payload.team.vehicle.plateNumber || "",
          vehicleType: payload.team.vehicle.vehicleType || "",
        }
      : null,
    drivers: mappedDrivers,
    assistants: mappedAssistants,
  };
};

export const fetchIncidentTypes = async (): Promise<IncidentTypeOption[]> => {
  const result = await staffApi.getIncidentTypes();
  const payload = (result as any)?.data ?? result;

  return Array.isArray(payload) ? payload : [];
};

export const fetchMyIncidents = async (): Promise<StaffIncident[]> => {
  const result = await staffApi.getMyIncidents();
  const payload = (result as any)?.data ?? result;

  return Array.isArray(payload) ? payload : [];
};

export const createIncidentReport = async (params: {
  invoiceId: string;
  type: string;
  description: string;
  media: IncidentMediaInput[];
}) => {
  const { invoiceId, type, description, media } = params;
  const formData = new FormData();

  formData.append("invoiceId", invoiceId);
  formData.append("type", type);
  formData.append("description", description);

  media.forEach((item, idx) => {
    formData.append("file", {
      uri: item.uri,
      name: item.fileName || getFileName(item.uri, idx),
      type: item.mimeType || getMimeType(item.uri),
    } as any);
  });

  return staffApi.createIncident(formData);
};
