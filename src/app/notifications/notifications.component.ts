import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { UserService } from '../shared/services/user.service';
import { User } from '../models/user.model';
import { UserNotification } from '../models/user-notification.model';

import { NotificationComponent } from './notification/notification.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NotificationComponent, MatProgressSpinner],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private userService = inject(UserService);

  isLoading = signal(true);

  notifications = signal<UserNotification[]>([]);
  currentUser = signal<User | null>(null);

  userMap = signal<Map<string, User>>(new Map());

  vm = computed(() => ({
    notifications: this.notifications(),
    currentUser: this.currentUser(),
    userMap: this.userMap(),
  }));

  constructor() {
    this.loadData();
  }

  private loadData() {
    forkJoin({
      user: this.userService.getUser(),
      users: this.userService.getUsers(),
    }).subscribe(({ user, users }) => {
      this.currentUser.set(user.user);
      this.notifications.set(user.user.notifications ?? []);
      const map = new Map<string, User>();
      users.users.forEach((u) => map.set(u._id, u));
      this.userMap.set(map);
      this.isLoading.set(false);
    });
  }

  onDeletedNotification(id: string) {
    this.notifications.update((current) => current.filter((n) => n._id !== id));
  }
}
