import { Message } from './message.model';

export interface Chat {
  _id: string;
  recipientId: string;
  senderId: string;
  messages?: Message[];
  unreadCount?: number;
}
