import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'https://backendapi-y2lq.onrender.com';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  private onlineUsers$ = new BehaviorSubject<string[]>([]);

  constructor() {
    this.initSocket();
  }

  get connection(): Socket {
    return this.socket;
  }

  getOnlineUsers() {
    return this.onlineUsers$.asObservable();
  }

  private initSocket() {
    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {});

    this.socket.on('online_users', (users: string[]) => {
      this.onlineUsers$.next(users);
    });
  }

  registerOnline(userId: string) {
    if (!this.socket) return;

    this.socket.once('connect', () => {
      this.socket.emit('user_online', userId);
    });

    if (this.socket.connected) {
      this.socket.emit('user_online', userId);
    }
  }

  typing(chatId: string, userId: string) {
    this.socket.emit('typing', { chatId, userId });
  }

  stopTyping(chatId: string, userId: string) {
    this.socket.emit('stop_typing', { chatId, userId });
  }

  onTyping(): Observable<{ chatId: string; userId: string }> {
    return new Observable((observer) => {
      this.socket.on('user_typing', (data) => {
        observer.next(data);
      });
    });
  }

  onStopTyping(): Observable<{ chatId: string; userId: string }> {
    return new Observable((observer) => {
      this.socket.on('user_stop_typing', (data) => {
        observer.next(data);
      });
    });
  }

  joinChat(chatId: string) {
    if (!this.socket) return;

    if (this.socket.connected) {
      this.socket.emit('join_chat', chatId);
    } else {
      this.socket.once('connect', () => {
        this.socket.emit('join_chat', chatId);
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Socket disconnected');
    }
  }
}
