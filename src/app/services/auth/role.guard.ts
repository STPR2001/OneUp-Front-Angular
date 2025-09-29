import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.getAuthenticatedToken()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener los roles requeridos de la ruta
    const expectedRoles = route.data['expectedRoles'] as string[];
    
    // Si no hay roles especificados, permitir acceso (solo requiere autenticación)
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    if (this.authService.hasAnyRole(expectedRoles)) {
      return true;
    }

    // Si no tiene los roles necesarios, redirigir a una página de acceso denegado
    this.router.navigate(['/acceso-denegado']);
    return false;
  }
}
