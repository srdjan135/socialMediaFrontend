import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  ViewChild,
  inject,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { MatIconButton } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SidenavService } from '../shared/services/sidenav.service';
import { NotificationService } from '../shared/services/notification.service';
import { UserService } from '../shared/services/user.service';
import { SocketService } from '../shared/services/socket.service';
import { User } from '../models/user.model';
import { UserNotification } from '../models/user-notification.model';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    MatList,
    MatListItem,
    MatIcon,
    MatDivider,
    MatIconButton,
    RouterLink,
    RouterLinkActive,
    MatBadge,
    MatTooltip,
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent {
  user!: User;
  notifications: UserNotification[] = [];
  unreadCount = 0;
  isMobileSize = window.innerWidth <= 992;

  private destroyRef = inject(DestroyRef);

  constructor(
    public sidenavService: SidenavService,
    private notificationService: NotificationService,
    private userService: UserService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.isMobileSize = window.innerWidth <= 992;
  }

  get showTooltip(): boolean {
    return this.isMobileSize || this.sidenavService.isCollapsedSidenav;
  }

  get tooltipPosition(): 'above' | 'right' {
    if (this.isMobileSize) return 'above';
    return 'right';
  }

  ngOnInit(): void {
    this.userService
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.user = res.user;
        this.notifications = res.user?.notifications ?? [];
        this.updateUnreadCount();

        const socket = this.socketService.connection;
        socket.emit('join', this.user._id);

        socket.on('notifications', (data) => {
          if (data.action !== 'new') return;

          this.notifications = [data.notification, ...this.notifications];
          this.updateUnreadCount();
        });

        this.cdr.markForCheck();
      });
  }

  toggleSidenav() {
    this.sidenavService.toggleSideNav();
  }

  openNotificationsPanel() {
    this.notificationService
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        this.updateUnreadCount();
        this.cdr.markForCheck();
      });
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
    this.cdr.markForCheck();
  }
}
