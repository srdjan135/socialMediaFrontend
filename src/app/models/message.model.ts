export interface Message {
  _id: string;
  recipientId: string;
  senderId: string;
  chatId: string;
  text: string;
  isRead: boolean;
  createdAt: Date;
}
