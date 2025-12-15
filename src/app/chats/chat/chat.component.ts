import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatCard,
  MatCardAvatar,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Chat } from '../../models/chat.model';
import { User } from '../../models/user.model';
import { UserService } from '../../shared/services/user.service';
import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardAvatar,
    RouterLink,
    RouterLinkActive,
    CommonModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit {
  @Input({ required: true }) chatData!: Chat;
  @Input() unreadCount = 0;

  currentUser!: User;
  recipientUser!: User;
  senderUser!: User;
  onlineUsers: string[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.socketService
      .getOnlineUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.onlineUsers = users;
        this.cdr.markForCheck();
      });

    combineLatest([this.userService.getUser(), this.userService.getUsers()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([meRes, usersRes]) => {
        this.currentUser = meRes.user;

        this.senderUser = usersRes.users.find(
          (u) => u._id === this.chatData.senderId
        )!;

        this.recipientUser = usersRes.users.find(
          (u) => u._id === this.chatData.recipientId
        )!;

        this.cdr.markForCheck();
      });
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.includes(userId);
  }
}
