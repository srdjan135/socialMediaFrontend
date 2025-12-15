import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { MatCardAvatar } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService } from '../../shared/services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatSlideToggle,
    MatCardAvatar,
    MatButton,
    MatIcon,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileComponent {
  form!: FormGroup;
  user!: User;

  @ViewChild('openFiles') fileInput!: ElementRef<HTMLInputElement>;

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [''],
      username: [''],
      imagePath: [null],
      biography: [''],
      isPrivate: [false],
    });

    this.userService
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.user = res.user;
        this.form.patchValue({
          email: res.user.email,
          username: res.user.username,
          biography: res.user.biography,
          isPrivate: res.user.isPrivate,
        });
        this.cdr.markForCheck();
      });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formData = new FormData();
    const image = this.form.get('imagePath')!.value;

    if (image instanceof File) {
      formData.append('imagePath', image);
    }

    formData.append('email', this.form.value.email);
    formData.append('username', this.form.value.username);
    formData.append('biography', this.form.value.biography);
    formData.append('isPrivate', this.form.value.isPrivate);

    this.userService
      .updateUser(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showMessage('Profile updated successfully!');
        this.cdr.markForCheck();
      });
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.form.patchValue({ imagePath: file });
    this.form.get('imagePath')!.updateValueAndValidity();

    const reader = new FileReader();
    reader.onload = () => {
      this.user = { ...this.user, imagePath: reader.result as string };
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  deleteProfileImage() {
    this.user = { ...this.user, imagePath: '/assets/user_blank.png' };
    this.form.patchValue({ imagePath: null });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    const formData = new FormData();
    formData.append('deleteImage', 'true');

    this.userService
      .updateUser(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showMessage('Profile image removed!');
        this.cdr.markForCheck();
      });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
