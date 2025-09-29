import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { AuthService } from './services/auth/auth.service';
import { LoginService } from './services/auth/login.service';
import { Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';

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

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    public authService: AuthService, // Hacer público para usar en el template
    private loginService: LoginService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.checkScreenWidth(); // Verifica el tamaño de la pantalla al iniciar
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    // Si el ancho de la pantalla es menor a 768px, oculta la barra lateral
    this.sidebarOpen = window.innerWidth >= 768;
  }

  isLogued(): boolean {
    return this.authService.getAuthenticatedToken() !== '';
  }

  async logout(): Promise<void> {
    try {
      // Limpiar la sesión
      this.authService.logout();
      
      // Resetear el estado del usuario
      this.loginService.resetUserState();
      
      // Cerrar el modal
      this.modalCerrarSesion.nativeElement.click();
      
      // Redirigir al login y limpiar el historial de navegación
      await this.router.navigate(['/login'], {
        replaceUrl: true // Reemplaza la entrada actual en el historial
      });
      
      // Recargar la aplicación para asegurar un estado limpio
      window.location.reload();
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Forzar redirección al login en caso de error
      window.location.href = '/login';
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  // Métodos para badges dinámicos
  getTotalReparacionesActivas(): number {
    // Simulamos datos - en producción vendría de un servicio
    // Podrías conectar esto con tu servicio de reparaciones real
    return 12; // Valor por defecto
  }

  getRepuestosPocoStock(): number {
    // Simulamos datos - en producción vendría de un servicio de inventario
    // Podrías conectar esto con tu servicio de repuestos real
    return 3; // Valor por defecto para indicar repuestos con poco stock
  }

  closeDrawerOnMobile(drawer: MatSidenav) {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        drawer.close();
      }
    });
  }

  // Métodos para verificar roles en el template
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isTecnico(): boolean {
    return this.authService.isTecnico();
  }

  // Método para verificar si puede acceder a secciones administrativas
  canAccessAdminSections(): boolean {
    return this.authService.isAdmin();
  }
}
