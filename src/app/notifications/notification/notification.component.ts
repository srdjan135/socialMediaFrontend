import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UserNotification } from '../../models/user-notification.model';
import { User } from '../../models/user.model';
import { NotificationService } from '../../shared/services/notification.service';
import { SharedService } from '../../shared/services/shared.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardAvatar,
    MatCardActions,
    MatButton,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    CommonModule,
  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent implements OnInit {
  @Input({ required: true }) notification!: UserNotification;
  @Input({ required: true }) notifications: UserNotification[] = [];
  @Input({ required: true }) senderUser!: User;
  @Input({ required: true }) currentUser!: User;
  @Output() deletedNotification = new EventEmitter<string>();

  buttonText: string = 'Accept';

  constructor(
    private notificationService: NotificationService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateButtonText();
  }

  navigateToUserAccount(user: User) {
    this.router.navigate(['/', user.username]);
  }

  private updateButtonText() {
    if (this.currentUser?.sentFollowRequests?.includes(this.senderUser?._id)) {
      this.buttonText = 'Back Request Sent';
    } else if (
      this.currentUser?.followers?.includes(this.senderUser?._id) &&
      this.currentUser?.following?.includes(this.senderUser?._id)
    ) {
      this.buttonText = 'Following';
    } else if (this.currentUser?.followers?.includes(this.senderUser?._id)) {
      this.buttonText = 'Follow Back';
    } else {
      this.buttonText = 'Accept';
    }
    this.cdr.markForCheck();
  }

  getIsFollowing(): boolean {
    return (this.currentUser?.followers?.includes(this.senderUser?._id) &&
      this.currentUser?.following?.includes(this.senderUser?._id))!;
  }

  getNotificationMessage(notification: UserNotification): string {
    const messages: Record<string, string> = {
      likePost: 'liked your post',
      likeComment: 'like your comment',
      comment: 'commented on your post',
      follow: 'started following you',
      followRequest: 'sent you a follow request',
      acceptRequest: 'accepted your follow request',
    };
    return messages[notification.type] || '';
  }

  deleteNotification(notId: string) {
    this.notificationService
      .deleteNotification(notId, this.senderUser._id)
      .subscribe(() => this.deletedNotification.emit(notId));
  }

  declineFollowBackRequest() {
    this.buttonText = 'Follow Back';
    this.notificationService
      .declineFollowBackRequest(this.senderUser._id)
      .subscribe(() => this.cdr.markForCheck());
  }

  acceptFollowRequestAndFollowBack() {
    this.sharedService
      .handleFollowLogic(this.buttonText, this.senderUser, this.currentUser)
      .subscribe((res) => {
        this.buttonText = res.buttonText;
        this.cdr.markForCheck();
      });
  }
}
