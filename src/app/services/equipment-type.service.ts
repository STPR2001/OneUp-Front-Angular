import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class EquipmentTypeService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/tipoEquipo/';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getTipoEquipos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }
  agregarTipoEquipo(nuevoTipoEquipo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevoTipoEquipo, {
      headers,
      responseType: 'text',
    });
  }

  modificarTipoEquipo(tipoEquipo: any): Observable<any> {
    const url = `${this.apiUrl}/${tipoEquipo.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, tipoEquipo, { headers });
  }

  obtenerTipoEquipoPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarTipoEquipo(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }
}
