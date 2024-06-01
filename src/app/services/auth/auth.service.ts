import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authSecretKey = 'Bearer Token';
  constructor() {
  }

  login(authToken: string): void {
    const now = new Date();

    const item = {
      value: authToken,
      expiry: now.getTime() + 28800000,
    };

    localStorage.setItem(this.authSecretKey, JSON.stringify(item));
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
      return '';
    }

    return item.value ? item.value : '';
  }


  logout(): void {
    localStorage.removeItem(this.authSecretKey);
  }
}
