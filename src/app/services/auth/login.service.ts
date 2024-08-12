import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest } from './loginRequest';
import { Observable, throwError, catchError, BehaviorSubject, tap } from 'rxjs';
import { User } from './user';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl =
    'https://oneupsoluciones.com:8443/oneup-backend/api/seguridad/autenticacion';
  currentUserLoginOn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  currentUserData: BehaviorSubject<User> = new BehaviorSubject<User>({
    id: 0,
    email: '',
  });

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, credentials, { headers });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
}
