import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private authSecretKey = 'Bearer Token';
  constructor() {
    this.isAuthenticated = !!localStorage.getItem(this.authSecretKey);
  }

  login(authToken: string): void {
    localStorage.setItem(this.authSecretKey, authToken);
    this.isAuthenticated = true;
  }

  isAuthenticatedUser(): boolean {
    return this.isAuthenticated;
  }

  getAuthenticatedToken(): string {
    const token = localStorage.getItem(this.authSecretKey);
    return token ? token : '';
  }


  logout(): void {
    localStorage.removeItem(this.authSecretKey);
    this.isAuthenticated = false;
  }
}
