import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '../../models/message.model';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'messages';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor(private http: HttpClient) {}

  getMessages(chatId: string) {
    return this.http.get<{ message: string; messages: Message[] }>(
      BACKEND_URL + `/${chatId}`
    );
  }

  sendMessage(
    recipientId: string,
    senderId: string,
    chatId: string,
    messageText: string
  ) {
    return this.http.post(BACKEND_URL + `/${chatId}`, {
      recipientId,
      senderId,
      chatId,
      messageText,
    });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(BACKEND_URL + `/${messageId}`);
  }
}
