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
export class ProvidersService {
  private apiUrl =
    'https://oneupsoluciones.com:8443/oneup-backend/api/proveedor';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getProveedores(page: number, size: number, nombre?: string): Observable<any> {
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

  getProveedoresActivos(
    page: number,
    size: number,
    nombre?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http
      .get<any>(`${this.apiUrl}/activos`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getProveedoresInactivos(
    page: number,
    size: number,
    nombre?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http
      .get<any>(`${this.apiUrl}/inactivos`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getAllProveedores(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/all`, { headers })
      .pipe(catchError(this.handleError));
  }

  activarProveedor(proveedor: any): Observable<any> {
    const url = `${this.apiUrl}/${proveedor.id}/activar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, proveedor, { headers });
  }

  desactivarProveedor(proveedor: any): Observable<any> {
    const url = `${this.apiUrl}/${proveedor.id}/desactivar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, proveedor, { headers });
  }

  getRepuestos(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any>(
      `https://oneupsoluciones.com:8443/oneup-backend/api/repuesto/all`,
      { headers }
    );
  }
  agregarProveedor(nuevoProveedor: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post(this.apiUrl, nuevoProveedor, { headers, responseType: 'text' })
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
