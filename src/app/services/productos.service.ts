import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/producto';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getProductos(page: number, size: number, nombre?: string): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  getProductosActivos(
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
    return this.http.get<any>(`${this.apiUrl}/activos`, { headers, params });
  }

  agregarProducto(nuevoProducto: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevoProducto, { headers });
  }

  modificarProducto(producto: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${producto.id}`, producto, {
      headers,
    });
  }

  eliminarProducto(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
