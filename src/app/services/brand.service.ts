import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private apiUrl = 'https://64.176.2.135:3000/oneup-backend/api/marca';
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getMarcas(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  agregarMarca(nuevaMarca: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevaMarca, {
      headers,
      responseType: 'text',
    });
  }

  modificarMarca(marca: any): Observable<any> {
    const url = `${this.apiUrl}/${marca.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, marca, { headers });
  }

  obtenerMarcaPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarMarca(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }

  cargarMarcasModelos(): Observable<string> {
    const url = `${this.apiUrl}/TraerMarcas`;
    const headers = this.getHeaders();
    return this.http.get(url, { headers, responseType: 'text' });
  }
}
