import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Socket } from 'socket.io-client';

import { Chat } from '../../models/chat.model';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';

import { ChatsService } from '../../shared/services/chats.service';
import { MessagesService } from '../../shared/services/messages.service';
import { SocketService } from '../../shared/services/socket.service';
import { UserService } from '../../shared/services/user.service';

import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatCardAvatar } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatSuffix,
  MatFormField,
  MatLabel,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatSuffix,
    MatCardAvatar,
    MatFormField,
    MatLabel,
    MatInput,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    MatProgressSpinner,
    RouterLink,
  ],
  templateUrl: './chat-messages.component.html',
  styleUrl: './chat-messages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessagesComponent implements OnInit, OnChanges, AfterViewInit {
  @Input({ required: true }) chats: Chat[] = [];
  @Input({ required: true }) chatId!: string;

  @Output() onDeleteChat = new EventEmitter<string>();
  @Output() unreadCountChange = new EventEmitter<{
    chatId: string;
    count: number;
  }>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  messages: Message[] = [];
  message = '';
  chat!: Chat;

  currentUser!: User;
  recipientUser!: User;
  senderUser!: User;

  isTyping = false;
  typingUserId?: string;
  isLoading = false;
  isMobile = false;

  private socket!: Socket;
  private typingTimeout: any;
  private shouldScroll = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private socketService: SocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socket = this.socketService.connection;

    if (window.innerWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }

    this.userService
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.currentUser = res.user;
        this.socket.emit('join', this.currentUser._id);
        this.cdr.markForCheck();
      });

    this.registerSocketListeners();

    this.socketService
      .onTyping()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ chatId, userId }) => {
        if (chatId === this.chatId && userId !== this.currentUser?._id) {
          this.isTyping = true;
          this.typingUserId = userId;
          this.cdr.markForCheck();
        }
      });

    this.socketService
      .onStopTyping()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ chatId, userId }) => {
        if (chatId === this.chatId && userId !== this.currentUser?._id) {
          this.isTyping = false;
          this.typingUserId = undefined;
          this.cdr.markForCheck();
        }
      });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatId'] && this.chatId) {
      this.resetTypingState();
      this.socketService.joinChat(this.chatId);
      this.loadChat();
    }
  }

  private registerSocketListeners(): void {
    this.socket.on('messages', this.onMessage);
    this.socket.on('messages-seen', this.onMessagesSeen);
  }

  private onMessage = (data: any) => {
    if (data.action === 'new' && data.message.chatId === this.chatId) {
      this.messages = [...this.messages, data.message];
      this.shouldScroll = true;

      if (data.message.senderId !== this.currentUser._id) {
        this.socket.emit('messages-seen', {
          chatId: this.chatId,
          userId: this.currentUser._id,
        });
      }

      this.updateUnreadCount();
      this.cdr.markForCheck();
    }

    if (data.action === 'delete') {
      this.messages = this.messages.filter((m) => m._id !== data.messageId);
      this.updateUnreadCount();
      this.cdr.markForCheck();
    }
  };

  private onMessagesSeen = ({ chatId, userId }: any) => {
    if (chatId !== this.chatId) return;
    if (userId === this.currentUser._id) return;

    this.messages = this.messages.map((m) =>
      m.senderId === this.currentUser._id ? { ...m, isRead: true } : m
    );

    this.cdr.markForCheck();
  };

  private loadChat(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.chatsService
      .getChat(this.chatId)
      .pipe(
        switchMap((res) => {
          this.chat = res.chat;
          return this.userService.getUser();
        }),
        switchMap((res) => {
          this.currentUser = res.user;
          return this.userService.getUsers();
        }),
        switchMap((res) => {
          const otherUserId =
            this.chat.senderId === this.currentUser._id
              ? this.chat.recipientId
              : this.chat.senderId;

          this.recipientUser = res.users.find((u) => u._id === otherUserId)!;
          this.senderUser = res.users.find(
            (u) => u._id === this.chat.senderId
          )!;

          return this.messagesService.getMessages(this.chatId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.isLoading = false;

        this.messages = res.messages.map((m) => ({
          ...m,
          isRead: m.senderId !== this.currentUser._id ? true : m.isRead,
        }));

        this.socket.emit('messages-seen', {
          chatId: this.chatId,
          userId: this.currentUser._id,
        });

        this.updateUnreadCount();
        this.scrollToBottom(true);
        this.cdr.markForCheck();
      });
  }

  sendMessage(): void {
    if (!this.message.trim()) return;

    this.messagesService
      .sendMessage(
        this.recipientUser._id,
        this.currentUser._id,
        this.chatId,
        this.message
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        this.messages = [...this.messages, msg as Message];
        this.message = '';
        this.shouldScroll = true;
        this.cdr.markForCheck();
      });
  }

  deleteMessage(messageId: string): void {
    this.messagesService
      .deleteMessage(messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.messages = this.messages.filter((m) => m._id !== messageId);
        this.cdr.markForCheck();
      });
  }

  deleteChat(): void {
    this.chatsService
      .deleteChat(this.chatId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onDeleteChat.emit(this.chatId);
        this.router.navigate(['/chats']);
      });
  }

  onTyping(): void {
    this.socketService.typing(this.chatId, this.currentUser._id);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.onStopTyping(), 1000);
  }

  onStopTyping(): void {
    this.socketService.stopTyping(this.chatId, this.currentUser._id);
  }

  private updateUnreadCount(): void {
    const count = this.messages.filter(
      (m) => !m.isRead && m.senderId !== this.currentUser._id
    ).length;

    this.unreadCountChange.emit({
      chatId: this.chatId,
      count,
    });
  }

  private resetTypingState(): void {
    this.isTyping = false;
    this.typingUserId = undefined;
  }

  private scrollToBottom(force = false): void {
    if (!this.messagesContainer) return;

    setTimeout(() => {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
