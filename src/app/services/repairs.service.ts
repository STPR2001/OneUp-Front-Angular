import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  getReparaciones(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
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

  getReparacionesPorMes(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/reparaciones-por-mes`, { headers });
  }

  getReparacionesPorTecnico(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/reparaciones-por-tecnico`, { headers });
  }
}
