import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PostsService } from '../../shared/services/posts.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePostComponent {
  selectedImage?: File;
  imagePreview?: string;

  constructor(
    private postsService: PostsService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(form: NgForm) {
    if (!this.selectedImage) return;

    const formData = new FormData();
    formData.append('imagePath', this.selectedImage);
    formData.append('description', form.value.description || '');

    this.postsService.addPost(formData);

    form.resetForm();
    this.imagePreview = '';
    this.selectedImage = undefined;
    this.cdr.markForCheck();
  }

  onImagePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedImage = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(this.selectedImage);
  }
}
