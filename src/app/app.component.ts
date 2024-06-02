import { Component, ViewChild } from '@angular/core';
import { AuthService } from './services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'oneUp'; 
  sidebarOpen = true;

  @ViewChild('cerrarSesion') modalCerrarSesion: any;

  constructor(private authService: AuthService, private router: Router) { }

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
}
