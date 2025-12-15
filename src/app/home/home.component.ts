import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { PostsComponent } from '../posts/posts.component';
import { SuggestedListComponent } from '../suggested-list/suggested-list.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostsComponent, SuggestedListComponent, MatButton],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  isOpenedSuggestedList = true;
  openSuggested = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateSuggestedListVisibility();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateSuggestedListVisibility();
  }

  openList() {
    this.openSuggested = true;
  }

  closeList() {
    this.openSuggested = false;
  }

  private updateSuggestedListVisibility() {
    const isDesktop = window.innerWidth > 992;
    this.isOpenedSuggestedList = isDesktop;
    this.openSuggested = isDesktop ? false : this.openSuggested;
  }
}
