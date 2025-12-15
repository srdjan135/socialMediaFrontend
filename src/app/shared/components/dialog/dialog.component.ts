import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  model,
  OnDestroy,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { CommentsComponent } from '../../../posts/post/comments/comments.component';
import { CommentsService } from '../../services/comments.service';
import { Comment } from '../../../models/comment.model';

export interface DialogData {
  postId: string;
  name: string;
  recipientId: string;
}
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatIconButton,
    MatSuffix,
    FormsModule,
    MatIcon,
    CommentsComponent,
  ],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent implements OnDestroy {
  dialogRef = inject(MatDialogRef<DialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  comment!: Comment;

  constructor(
    private commentsService: CommentsService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(form: NgForm) {
    this.comment = form.value.comment;
    this.commentsService
      .addComment(this.data.postId, form.value.comment, this.data.recipientId)
      .subscribe(() => {
        this.cdr.markForCheck();
      });
    form.reset();
  }

  ngOnDestroy(): void {
    this.dialogRef.close({
      postId: this.data.postId,
      comment: this.comment,
    });
  }
}
