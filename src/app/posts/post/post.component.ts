import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
  model,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Socket } from 'socket.io-client';

import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { UserService } from '../../shared/services/user.service';
import { PostsService } from '../../shared/services/posts.service';
import { CommentsService } from '../../shared/services/comments.service';
import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    MatIconButton,
    MatCard,
    MatCardHeader,
    MatCardActions,
    MatCardTitle,
    MatCardAvatar,
    MatCardContent,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RouterLink,
  ],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostComponent {
  @Input({ required: true }) postData!: Post;
  @Output() postDeleted = new EventEmitter<string>();

  name = model('Comments: ');

  user!: User;
  userId!: string;

  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private socket: Socket;

  constructor(
    private userService: UserService,
    private postsService: PostsService,
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
        this.cdr.markForCheck();

        this.loadPostUser();
      });

    this.commentsService.commentsUpdate
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((comments) => {
        this.postData = { ...this.postData, comments: [...comments] };
        this.cdr.markForCheck();
      });

    this.commentsService.getComments(this.postData._id);

    this.socket.on('posts', (data) => {
      if (data.action !== 'like' || data.postId !== this.postData._id) return;

      const likes = data.isLiked
        ? [...(this.postData.likes ?? []), data.userId]
        : this.postData.likes?.filter((id) => id !== data.userId);

      this.postData = {
        ...this.postData,
        likes,
        isUserLiked:
          data.userId === this.userId
            ? data.isLiked
            : this.postData.isUserLiked,
      };

      this.cdr.markForCheck();
    });

    this.destroyRef.onDestroy(() => {
      this.socket.off('posts');
    });
  }

  private loadPostUser() {
    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.user = res.users.find((u) => u._id === this.postData.userId)!;
        this.cdr.markForCheck();

        this.postData = {
          ...this.postData,
          isUserLiked: this.postData.likes?.includes(this.userId),
        };
        this.cdr.markForCheck();
      });
  }

  likePost() {
    const isLiked = !this.postData.isUserLiked;

    this.postData = {
      ...this.postData,
      isUserLiked: isLiked,
      likes: isLiked
        ? [...(this.postData.likes ?? []), this.userId]
        : this.postData.likes?.filter((id) => id !== this.userId),
    };

    this.postsService
      .likePost(this.postData._id, this.postData.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.postData = res.updatedPost;
        this.cdr.markForCheck();
      });
  }

  onDeletePost() {
    this.postsService
      .deletePost(this.postData._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.postDeleted.emit(this.postData._id));
  }

  openCommentsDialog(postId: string) {
    this.dialog
      .open(DialogComponent, {
        data: {
          name: this.name(),
          postId,
          recipientId: this.postData.userId,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.comment) return;

        this.postData = {
          ...this.postData,
          comments: [...(this.postData.comments ?? []), result],
        };
        this.cdr.markForCheck();
      });
  }
}
