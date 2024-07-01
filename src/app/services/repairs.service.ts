import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RepairsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/reparacion';
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getReparaciones(page: number, size: number, nombreCliente?: string, estado?: string): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (nombreCliente) {
      params = params.set('nombreCliente', nombreCliente);
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http
      .get<any>(this.apiUrl, { headers, params });
  }

  getAllReparaciones(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/all`, { headers });
  }
  getReparacion(codigo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/codigo/${codigo}`);
  }

  agregarReparacion(nuevaReparacion: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevaReparacion, { headers, responseType: 'text' });
  }

  eliminarReparacion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }

  modificarReparacion(reparacion: any): Observable<any> {
    const url = `${this.apiUrl}/${reparacion.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, reparacion, { headers });
  }

  obtenerReparacionPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  getReparacionesPorMes(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    return this.http
      .get<any>(`${this.apiUrl}/reparaciones-por-mes`, { headers, params });
  }

  getReparacionesPorTecnico(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    return this.http
      .get<any>(`${this.apiUrl}/reparaciones-por-tecnico`, { headers, params });
  }
}
