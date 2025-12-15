import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SuggestedAccountComponent } from './suggested-account/suggested-account.component';
import { UserService } from '../shared/services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-suggested-list',
  standalone: true,
  imports: [SuggestedAccountComponent, MatProgressSpinner],
  templateUrl: './suggested-list.component.html',
  styleUrls: ['./suggested-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestedListComponent implements OnInit {
  users: User[] = [];
  currentUser!: User;
  isLoading = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin({
      current: this.userService.getUser(),
      users: this.userService.getUsers(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ current, users }) => {
        this.currentUser = current.user;
        this.users = users.users.filter((u) => u._id !== this.currentUser._id);

        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
