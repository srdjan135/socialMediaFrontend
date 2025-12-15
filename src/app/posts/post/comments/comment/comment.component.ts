import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  inject,
} from '@angular/core';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Socket } from 'socket.io-client';

import { Comment } from '../../../../models/comment.model';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../shared/services/user.service';
import { CommentsService } from '../../../../shared/services/comments.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { SocketService } from '../../../../shared/services/socket.service';

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardAvatar,
    MatCardActions,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RouterLink,
  ],
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent {
  @Input({ required: true }) commentData!: Comment;

  user!: User;
  userId!: string;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<DialogComponent>);
  private socket: Socket;

  constructor(
    private userService: UserService,
    private commentsService: CommentsService,
    private socketService: SocketService
  ) {
    this.socket = this.socketService.connection;
  }

  ngOnInit(): void {
    this.userService
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.userId = res.user._id;
        this.loadCommentUser();
      });

    this.socket.on('comments', (data) => {
      if (data.action === 'like' && data.commentId === this.commentData._id) {
        if (data.isLiked) {
          this.commentData.likes?.push(data.userId);
        } else {
          this.commentData.likes = this.commentData.likes?.filter(
            (id) => id !== data.userId
          );
        }
        this.commentData.isUserLiked =
          data.userId === this.userId
            ? data.isLiked
            : this.commentData.isUserLiked;

        this.cdr.markForCheck();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.socket.off('comments');
    });
  }

  private loadCommentUser() {
    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.user = res.users.find((u) => u._id === this.commentData.userId)!;
        this.commentData = {
          ...this.commentData,
          isUserLiked: this.commentData.likes?.includes(this.userId),
        };
        this.cdr.markForCheck();
      });
  }

  likeComment() {
    this.commentsService
      .likeComment(this.commentData._id, this.commentData.userId)
      .subscribe((res) => {
        this.commentData = res.updatedComment;
        this.cdr.markForCheck();
      });
  }
  onDeleteComment() {
    this.commentsService.deleteComment(this.commentData._id).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  close() {
    this.dialogRef.close();
  }
}
