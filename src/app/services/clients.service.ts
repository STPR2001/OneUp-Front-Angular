import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/cliente';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
    });
  }

  getClientes(page: number, size: number, nombre?: string): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  getClientesActivos(
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

  getClientesInactivos(
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
    return this.http.get<any>(`${this.apiUrl}/inactivos`, { headers, params });
  }

  getAllClientes(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/all`, { headers });
  }

  agregarCliente(nuevoCliente: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevoCliente, {
      headers,
      responseType: 'text',
    });
  }

  activarCliente(cliente: any): Observable<any> {
    const url = `${this.apiUrl}/${cliente.id}/activar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, cliente, { headers });
  }

  desactivarCliente(cliente: any): Observable<any> {
    const url = `${this.apiUrl}/${cliente.id}/desactivar`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, cliente, { headers });
  }

  modificarCliente(cliente: any): Observable<any> {
    const url = `${this.apiUrl}/${cliente.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, cliente, { headers });
  }

  obtenerClientePorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarCliente(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }
}
