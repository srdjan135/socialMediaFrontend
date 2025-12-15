import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidenavService {
  isCollapsedSidenav = false;

  toggleSideNav() {
    this.isCollapsedSidenav = !this.isCollapsedSidenav;
  }
}
