import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Socket } from 'socket.io-client';

import { Chat } from '../models/chat.model';
import { User } from '../models/user.model';
import { ChatsService } from '../shared/services/chats.service';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ChatComponent } from './chat/chat.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ChatMessagesComponent } from './chat-messages/chat-messages.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chats',
  standalone: true,
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatComponent, MatProgressSpinner, ChatMessagesComponent],
})
export class ChatsComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  selectedChatId: string | null = null;
  unreadCounts: Record<string, number> = {};
  currentUser!: User;
  isLoading = false;
  isChatOpen = false;

  private socket!: Socket;
  private destroy$ = new Subject<void>();

  constructor(
    private chatsService: ChatsService,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.chatsService.getChats().subscribe((res) => {
      this.chats = res.chats;
      this.isLoading = false;
      this.cdr.markForCheck();
    });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.selectedChatId = params['id'] || null;
        this.cdr.markForCheck();
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isChatOpen = !!params.get('id');
        this.cdr.markForCheck();
      });

    this.userService.getUser().subscribe((res) => {
      this.currentUser = res.user;
      this.cdr.markForCheck();
    });

    this.socket = this.socketService.connection;
    this.registerSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.unregisterSocketListeners();
  }

  private registerSocketListeners(): void {
    this.socket.on('messages', this.onMessage);
    this.socket.on('chat-created', this.onChatCreated);
    this.socket.on('chat-deleted', this.onChatDeleted);
  }

  private unregisterSocketListeners(): void {
    this.socket.off('messages', this.onMessage);
    this.socket.off('chat-created', this.onChatCreated);
    this.socket.off('chat-deleted', this.onChatDeleted);
  }

  private onMessage = (data: any) => {
    if (data.action !== 'new') return;
    if (!this.currentUser) return;

    const message = data.message;

    if (message.senderId === this.currentUser._id) return;
    if (this.selectedChatId === message.chatId) return;

    this.unreadCounts = {
      ...this.unreadCounts,
      [message.chatId]: (this.unreadCounts[message.chatId] || 0) + 1,
    };

    this.cdr.markForCheck();
  };

  private onChatCreated = ({ chat }: { chat: Chat }) => {
    this.chats = [chat, ...this.chats];
    this.cdr.markForCheck();
  };

  private onChatDeleted = ({ chatId }: { chatId: string }) => {
    this.chats = this.chats.filter((chat) => chat._id !== chatId);

    if (this.selectedChatId === chatId) {
      this.selectedChatId = null;
      this.router.navigate(['/chats']);
    }

    this.cdr.markForCheck();
  };

  deletedChat(chatId: string): void {
    this.chats = this.chats.filter((c) => c._id !== chatId);
    this.cdr.markForCheck();
  }

  handleUnreadCount(event: { chatId: string; count: number }): void {
    this.unreadCounts = {
      ...this.unreadCounts,
      [event.chatId]: event.count,
    };
    this.cdr.markForCheck();
  }
}
