import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private apiUrl = 'http://216.238.102.160:3000/oneup-backend/api/modelo';
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getModelos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  agregarModelo(nuevoModelo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, nuevoModelo, { headers, responseType: 'text'  });
  }

  modificarModelo(modelo: any): Observable<any> {
    const url = `${this.apiUrl}/${modelo.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, modelo, { headers });
  }

  obtenerModeloPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarModelo(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }

  getModelosPorMarca(marcaId: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/modelos/${marcaId}`, { headers });
  }
}
