import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Comment } from '../../../models/comment.model';
import { CommentsService } from '../../../shared/services/comments.service';
import { CommentComponent } from './comment/comment.component';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, CommentComponent, MatProgressSpinner],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit {
  @Input({ required: true }) postId!: string;

  comments: Comment[] = [];
  isLoading = true;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(private commentsService: CommentsService) {}

  ngOnInit(): void {
    this.commentsService.getComments(this.postId);

    this.commentsService.commentsUpdate
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((comments) => {
        this.comments = comments;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
