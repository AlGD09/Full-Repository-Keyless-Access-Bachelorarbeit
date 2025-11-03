export interface Smartphone {
  id?: number;
  deviceId: string;
  userName: string;
  secretHash: string;
  status?: string;
  bleId?: string;
  lastSeen?: string; // ISO-String vom Backend
}
