import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { Observable, of, map } from 'rxjs';
import { User } from '../../models/user.model';
import { SuggestedService } from './suggested.service';

interface FollowStateResult {
  buttonText: string;
  isAcceptRequest: boolean;
  followBack: boolean;
  isRequestFollowBack: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor(
    private notificationService: NotificationService,
    private suggestedService: SuggestedService
  ) {}

  initButtonState(currentUser: User, profileUser: User): FollowStateResult {
    const isRequested = currentUser?.sentFollowRequests?.includes(
      profileUser._id
    );

    const isAcceptRequest = profileUser?.sentFollowRequests?.includes(
      currentUser?._id
    )!;

    const isFollowing = currentUser?.following?.includes(profileUser._id);
    const isFollow = currentUser?.followers?.includes(profileUser._id);

    const followBack = (isFollow && !isFollowing)!;
    const isRequestFollowBack = (isRequested && isFollow)!;

    let buttonText = 'Follow';

    switch (true) {
      case isRequestFollowBack:
        buttonText = 'Back Request Sent';
        break;

      case followBack:
        buttonText = 'Follow Back';
        break;

      case isAcceptRequest:
        buttonText = 'Accept';
        break;

      case isRequested:
        buttonText = 'Request sent';
        break;

      case isFollowing:
        buttonText = 'Following';
        break;
    }

    return {
      buttonText,
      isAcceptRequest,
      followBack,
      isRequestFollowBack,
    };
  }

  handleFollowRequest(
    buttonText: string,
    recipientUser: User,
    profileUserId: string,
    currentUserId?: string
  ): Observable<{ buttonText: string }> {
    switch (buttonText) {
      case 'Follow':
        if (!recipientUser.isPrivate) {
          return this.suggestedService
            .followUser(profileUserId)
            .pipe(map(() => ({ buttonText: 'Following' })));
        }
        return this.suggestedService
          .sentFollowRequest(profileUserId)
          .pipe(map(() => ({ buttonText: 'Request sent' })));

      case 'Request sent':
        return this.suggestedService
          .removeSentFollowRequest(profileUserId)
          .pipe(map(() => ({ buttonText: 'Follow' })));

      case 'Follow Back':
        return this.notificationService
          .followBackRequest(profileUserId, currentUserId!)
          .pipe(map(() => ({ buttonText: 'Following' })));

      default:
        console.warn('Unknown button state:', buttonText);
        return of({ buttonText });
    }
  }

  handleFollowLogic(
    buttonText: string,
    itemData: User,
    currentUser: User
  ): Observable<{ buttonText: string }> {
    const targetUserId = itemData._id;
    const currentUserId = currentUser._id;

    switch (buttonText) {
      case 'Accept':
        return this.notificationService
          .acceptFollowRequest(targetUserId, currentUserId)
          .pipe(
            map(() => {
              currentUser.followers?.push(itemData._id);
              itemData.following?.push(currentUser._id);

              const isFollowing = currentUser.following?.includes(itemData._id);
              const isFollow = currentUser.followers?.includes(itemData._id);

              const isFollowBackRequest = isFollow && isFollowing;

              if (isFollowBackRequest) {
                return { buttonText: 'Following' };
              } else {
                return { buttonText: 'Follow Back' };
              }
            })
          );

      case 'Follow Back':
        if (!itemData.isPrivate) {
          return this.suggestedService
            .followUser(targetUserId)
            .pipe(map(() => ({ buttonText: 'Following' })));
        }
        this.notificationService
          .followBackRequest(targetUserId, currentUserId)
          .subscribe();
        return of({ buttonText: 'Back Request Sent' });

      case 'Back Request Sent':
        this.notificationService
          .declineFollowBackRequest(targetUserId)
          .subscribe();
        return of({ buttonText: 'Follow Back' });

      default:
        console.warn('Unknown button state:', buttonText);
        return of({ buttonText });
    }
  }
}
