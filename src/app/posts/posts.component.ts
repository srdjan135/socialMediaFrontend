import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Post } from '../models/post.model';
import { PostsService } from '../shared/services/posts.service';
import { SocketService } from '../shared/services/socket.service';
import { PostComponent } from './post/post.component';
import { UserService } from '../shared/services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, PostComponent, MatProgressSpinner],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  isLoading = true;
  currentUser!: User;

  private destroyRef = inject(DestroyRef);

  constructor(
    private postsService: PostsService,
    private userService: UserService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.getUser().subscribe((res) => {
      this.currentUser = res.user;
      this.loadPosts();
    });
  }

  private loadPosts() {
    this.postsService.getPosts();

    this.postsService.postsUpdate
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((posts) => {
        this.posts = posts;
        this.isLoading = false;
        this.cdr.markForCheck();
      });

    const socket = this.socketService.connection;

    socket.on('posts', (data: any) => {
      console.log(this.currentUser._id);
      if (data.action === 'create') {
        const allowedUsers = [
          this.currentUser._id,
          ...(this.currentUser.following || []),
        ];
        if (this.currentUser._id.includes(data.post.userId)) {
        }
        if (allowedUsers.includes(data.post.userId)) {
          this.posts = [data.post, ...this.posts];
          this.cdr.markForCheck();
        }
      }

      if (data.action === 'delete') {
        this.posts = this.posts.filter((p) => p._id !== data.postId);
      }

      this.cdr.markForCheck();
    });
  }

  handlePostDeleted(postId: string) {
    this.posts = this.posts.filter((p) => p._id !== postId);
    this.cdr.markForCheck();
  }
}
