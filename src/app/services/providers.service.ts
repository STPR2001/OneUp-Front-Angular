import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProvidersService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/proveedor';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNTg5OTcwOSwiZXhwIjoxNzE1OTI4NTA5fQ.RYvFC0-3UFu_yOEWoHssAPHP8ieNp-FyYCcPrZeq2yo4hNFPt4gzym5Xukf16SevCQNrNvotOdG7hryw407euA';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    });
  }

  getProveedores(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  agregarProveedor(nuevoProveedor: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(this.apiUrl, nuevoProveedor, { headers })
      .pipe(catchError(this.handleError));
  }

  modificarProveedor(proveedorModificado: any): Observable<any> {
    const url = `${this.apiUrl}/${proveedorModificado.id}`;
    const headers = this.getHeaders();
    return this.http
      .put<any>(url, proveedorModificado, { headers })
      .pipe(catchError(this.handleError));
  }

  eliminarProveedor(id: number): Observable<any> {
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
