import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TecnicsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/tecnico';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }
  getTecnicos(page: number, size: number, nombre?: string): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http
      .get<any>(this.apiUrl, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getAllTecnicos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/all`, { headers })
      .pipe(catchError(this.handleError));
  }

  agregarTecnico(nuevoTecnico: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post(this.apiUrl, nuevoTecnico, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  modificarTecnico(tecniceModificado: any): Observable<any> {
    const url = `${this.apiUrl}/${tecniceModificado.id}`;
    const headers = this.getHeaders();
    return this.http
      .put<any>(url, tecniceModificado, { headers })
      .pipe(catchError(this.handleError));
  }

  eliminarTecnico(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http
      .delete<any>(url, { headers })
      .pipe(catchError(this.handleError));
  }
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
