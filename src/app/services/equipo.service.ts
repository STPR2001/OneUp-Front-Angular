import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private apiUrl = 'http://216.238.102.160:3000/oneup-backend/api/equipo';
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getEquipos(page: number, size: number, nombre?: string): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (nombre) {
      params = params.set('nombreMarca', nombre);
    }
    return this.http
      .get<any>(this.apiUrl, { headers, params });
  }

  getAllEquipos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/all`, { headers });
  }

  agregarEquipos(nuevoEquipo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevoEquipo, { headers, responseType: 'text' });
  }

  modificarEquipo(equipo: any): Observable<any> {
    const url = `${this.apiUrl}/${equipo.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, equipo, { headers });
  }
  obtenerEquipoPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarEquipo(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }
}
