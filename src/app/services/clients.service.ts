import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/cliente';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNTg5OTcwOSwiZXhwIjoxNzE1OTI4NTA5fQ.RYvFC0-3UFu_yOEWoHssAPHP8ieNp-FyYCcPrZeq2yo4hNFPt4gzym5Xukf16SevCQNrNvotOdG7hryw407euA';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  getClientes(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  agregarCliente(nuevoCliente: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, nuevoCliente, { headers });
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
