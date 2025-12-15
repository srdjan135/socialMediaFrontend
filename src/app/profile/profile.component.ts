import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIcon } from '@angular/material/icon';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardActions,
  MatCardAvatar,
} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { User } from '../models/user.model';
import { Post } from '../models/post.model';
import { UserService } from '../shared/services/user.service';
import { SharedService } from '../shared/services/shared.service';
import { SuggestedService } from '../shared/services/suggested.service';
import { ChatsService } from '../shared/services/chats.service';
import { PostComponent } from '../posts/post/post.component';
import { ClickStopPropagationDirective } from '../shared/directives/click-stop-propagation.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardActions,
    MatCardAvatar,
    MatButton,
    RouterLink,
    PostComponent,
    ClickStopPropagationDirective,
    MatProgressSpinner,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  currentUser!: User;
  profileUser!: User;
  followersList: User[] = [];
  followingList: User[] = [];

  buttonText = 'Follow';
  isAcceptRequest = false;
  followBack = false;
  isRequestFollowBack = false;

  selectedPost: Post | null = null;
  isLoading = true;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private suggestedService: SuggestedService,
    private chatsService: ChatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading = true;
          const username = params.get('username')!;

          return forkJoin({
            current: this.userService.getUser(),
            profile: this.userService.getProfileUser(username),
            followers: this.userService.getFollowersList(username),
            following: this.userService.getFollowingList(username),
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.currentUser = data.current.user;
        this.profileUser = data.profile.user;
        this.followersList = data.followers.followers;
        this.followingList = data.following.following;

        this.updateButtonState();
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private updateButtonState() {
    const state = this.sharedService.initButtonState(
      this.currentUser,
      this.profileUser
    );

    this.buttonText = state.buttonText;
    this.isAcceptRequest = state.isAcceptRequest;
    this.followBack = state.followBack;
    this.isRequestFollowBack = state.isRequestFollowBack;
  }

  createChat() {
    this.chatsService
      .addChat(this.currentUser._id, this.profileUser._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/chats']);
      });
  }

  getProfileContent(): boolean {
    return (
      this.profileUser?._id === this.currentUser?._id ||
      this.currentUser.following?.includes(this.profileUser._id) ||
      !this.profileUser.isPrivate
    );
  }

  getActionButtons(): boolean {
    if (!this.currentUser || !this.profileUser) return false;

    return (
      this.currentUser._id !== this.profileUser._id &&
      (this.currentUser.following?.includes(this.profileUser._id) ||
        !this.profileUser.isPrivate)
    );
  }

  acceptFollowRequestAndFollowBack() {
    this.sharedService
      .handleFollowLogic(this.buttonText, this.profileUser, this.currentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.buttonText = res.buttonText;
        this.cdr.markForCheck();
      });
  }

  followRequest() {
    this.sharedService
      .handleFollowRequest(
        this.buttonText,
        this.profileUser,
        this.profileUser._id,
        this.currentUser._id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.buttonText = res.buttonText;
        this.cdr.markForCheck();
      });
  }

  removeFollower(followerId: string) {
    this.suggestedService
      .removeFollower(followerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.followersList = this.followersList.filter(
          (f) => f._id !== followerId
        );
        this.cdr.markForCheck();
      });
  }

  unfollow(followingId: string) {
    this.suggestedService
      .unfollowUser(followingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.followingList = this.followingList.filter(
          (f) => f._id !== followingId
        );
        this.cdr.markForCheck();
      });
  }

  openPost(post: Post) {
    this.selectedPost = post;
    this.cdr.markForCheck();
  }

  closePost() {
    this.selectedPost = null;
    this.cdr.markForCheck();
  }
}
