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
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/seguridad/autenticacion';
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
    return this.http.post<any>(this.apiUrl, credentials, { headers }).pipe(
      tap((response) => {
        this.currentUserLoginOn.next(true);
        if (response.user) {
          this.currentUserData.next(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else {
        errorMessage = `Error ${error.status}: ${error.error?.message || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
}
