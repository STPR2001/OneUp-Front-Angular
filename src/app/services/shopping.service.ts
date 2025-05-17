import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/compra';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }
  getCompras(
    page: number,
    size: number,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http
      .get<any>(this.apiUrl, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getComprasActivas(
    page: number,
    size: number,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http
      .get<any>(`${this.apiUrl}/activas`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getComprasInactivas(
    page: number,
    size: number,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http
      .get<any>(`${this.apiUrl}/inactivas`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  activarCompra(compra: any): Observable<any> {
    const url = `${this.apiUrl}/${compra.id}/activar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, compra, { headers });
  }

  desactivarCompra(compra: any): Observable<any> {
    const url = `${this.apiUrl}/${compra.id}/desactivar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, compra, { headers });
  }

  getComprasPorMes(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    console.log(
      'Solicitando compras por mes:',
      `${this.apiUrl}/compras-por-mes`,
      { anio }
    );
    return this.http
      .get<any>(`${this.apiUrl}/compras-por-mes`, { headers, params })
      .pipe(
        tap((response) => console.log('Respuesta compras por mes:', response)),
        catchError((error) => {
          console.error('Error en compras por mes:', error);
          throw error;
        })
      );
  }

  getComprasPorProveedor(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    console.log(
      'Solicitando compras por proveedor:',
      `${this.apiUrl}/compras-por-proveedor`,
      { anio }
    );
    return this.http
      .get<any>(`${this.apiUrl}/compras-por-proveedor`, { headers, params })
      .pipe(
        tap((response) =>
          console.log('Respuesta compras por proveedor:', response)
        ),
        catchError((error) => {
          console.error('Error en compras por proveedor:', error);
          throw error;
        })
      );
  }

  agregarCompra(nuevoCompra: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(this.apiUrl, nuevoCompra, { headers })
      .pipe(catchError(this.handleError));
  }

  modificarCompra(tecniceModificado: any): Observable<any> {
    const url = `${this.apiUrl}/${tecniceModificado.id}`;
    const headers = this.getHeaders();
    return this.http
      .put<any>(url, tecniceModificado, { headers })
      .pipe(catchError(this.handleError));
  }

  eliminarCompra(id: number): Observable<any> {
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
