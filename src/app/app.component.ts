import { Component, ViewChild, OnInit } from '@angular/core';
import { AuthService } from './services/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'oneUp';
  sidebarOpen = true;
  currentRoute: string = '';

  @ViewChild('cerrarSesion') modalCerrarSesion: any;

  constructor(private authService: AuthService, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
  }

  isLogued(): boolean {
    return this.authService.getAuthenticatedToken() !== '';
  }

  logout(): void {
    this.authService.logout();
    this.modalCerrarSesion.nativeElement.click();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}
