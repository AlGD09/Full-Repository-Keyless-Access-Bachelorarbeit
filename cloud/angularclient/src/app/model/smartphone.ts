import { User } from './user';


export interface Smartphone {
  id?: number;
  deviceId: string;
  name: string;
  status?: string;
  bleId?: string;
  lastSeen?: string; // ISO-String vom Backend
  users?: User[];
}
