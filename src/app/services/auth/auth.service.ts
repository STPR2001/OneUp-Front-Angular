import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authSecretKey = 'Bearer Token';
  private userDataKey = 'User Data';
  
  constructor() {
  }

  login(authToken: string, userData?: any): void {
    const now = new Date();

    const item = {
      value: authToken,
      expiry: now.getTime() + 28800000,
    };

    localStorage.setItem(this.authSecretKey, JSON.stringify(item));
    
    // Guardar datos del usuario si se proporcionan
    if (userData) {
      localStorage.setItem(this.userDataKey, JSON.stringify(userData));
    }
  } 

  getAuthenticatedToken(): string {
    const token = localStorage.getItem(this.authSecretKey);
    if (!token) {
      return '';
    }
    const item = JSON.parse(token);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(this.authSecretKey);
      localStorage.removeItem(this.userDataKey);
      return '';
    }

    return item.value ? item.value : '';
  }

  // Decodificar JWT token para extraer información
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Obtener roles del usuario desde el token
  getUserRoles(): string[] {
    const token = this.getAuthenticatedToken();
    if (!token) return [];

    const decodedToken = this.decodeToken(token);
    return decodedToken?.authorities || [];
  }

  // Obtener nombre de usuario desde el token
  getUsername(): string {
    const token = this.getAuthenticatedToken();
    if (!token) return '';

    const decodedToken = this.decodeToken(token);
    return decodedToken?.sub || '';
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    // Hacer la comparación case-insensitive
    return roles.some(userRole => userRole.toLowerCase() === role.toLowerCase());
  }

  // Verificar si el usuario tiene alguno de los roles especificados
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    // Hacer la comparación case-insensitive
    return roles.some(role => 
      userRoles.some(userRole => userRole.toLowerCase() === role.toLowerCase())
    );
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Verificar si el usuario es técnico
  isTecnico(): boolean {
    return this.hasRole('TECNICO');
  }

  // Verificar si el usuario es recepcionista
  isRecepcionista(): boolean {
    return this.hasRole('RECEPCIONISTA');
  }

  logout(): void {
    // Eliminar token de autenticación
    localStorage.removeItem(this.authSecretKey);
    localStorage.removeItem(this.userDataKey);
    
    // Limpiar cualquier otra data sensible
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cookies relacionadas con la sesión
    document.cookie.split(";").forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  }
}
