import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Chat } from '../../models/chat.model';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'chats';

@Injectable({
  providedIn: 'root',
})
export class ChatsService {
  constructor(private http: HttpClient) {}

  getChats() {
    return this.http.get<{ message: string; chats: Chat[] }>(BACKEND_URL);
  }

  getChat(chatId: string) {
    return this.http.get<{ message: string; chat: Chat }>(
      BACKEND_URL + `/${chatId}`
    );
  }

  addChat(senderId: string, recipientId: string) {
    return this.http.post(BACKEND_URL, {
      recipientId,
      senderId,
    });
  }

  deleteChat(chatId: string) {
    return this.http.delete(BACKEND_URL + `/${chatId}`);
  }
}
