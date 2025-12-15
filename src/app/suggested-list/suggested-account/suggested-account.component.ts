import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { User } from '../../models/user.model';
import { SharedService } from '../../shared/services/shared.service';
import { ClickStopPropagationDirective } from '../../shared/directives/click-stop-propagation.directive';

@Component({
  selector: 'app-suggested-account',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardAvatar,
    MatCardActions,
    MatButton,
    RouterLink,
    ClickStopPropagationDirective,
  ],
  templateUrl: './suggested-account.component.html',
  styleUrls: ['./suggested-account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestedAccountComponent implements OnChanges {
  @Input({ required: true }) itemData!: User;
  @Input({ required: true }) currentUser!: User;

  buttonText = 'Follow';
  isAcceptRequest = false;
  followBack = false;
  isRequestFollowBack = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData'] || changes['currentUser']) {
      this.updateButtonState();
      this.cdr.markForCheck();
    }
  }

  private updateButtonState() {
    const state = this.sharedService.initButtonState(
      this.currentUser,
      this.itemData
    );

    this.buttonText = state.buttonText;
    this.isAcceptRequest = state.isAcceptRequest;
    this.followBack = state.followBack;
    this.isRequestFollowBack = state.isRequestFollowBack;
  }

  followRequest() {
    this.sharedService
      .handleFollowRequest(
        this.buttonText,
        this.itemData,
        this.itemData._id,
        this.currentUser._id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.buttonText = res.buttonText;
        this.cdr.markForCheck();
      });
  }

  acceptFollowRequestAndFollowBack() {
    this.sharedService
      .handleFollowLogic(this.buttonText, this.itemData, this.currentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.buttonText = res.buttonText;
        this.cdr.markForCheck();
      });
  }
}
