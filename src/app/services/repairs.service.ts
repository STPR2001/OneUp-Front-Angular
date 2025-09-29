import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { tap, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RepairsService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/reparacion';
  constructor(private http: HttpClient, private authService: AuthService) {}

  // Simple cache por clave (endpoint/parametros)
  private cache = new Map<string, Observable<any>>();
  clearCache() {
    this.cache.clear();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getReparaciones(
    page: number,
    size: number,
    nombreCliente?: string,
    estado?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombreCliente) {
      params = params.set('nombreCliente', nombreCliente);
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    const key = `reps:${params.toString()}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(this.apiUrl, { headers, params })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  getReparacionesActivas(
    page: number,
    size: number,
    nombreCliente?: string,
    estado?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombreCliente) {
      params = params.set('nombreCliente', nombreCliente);
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    const key = `repsAct:${params.toString()}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(`${this.apiUrl}/activas`, { headers, params })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  getReparacionesInactivas(
    page: number,
    size: number,
    nombreCliente?: string,
    estado?: string
  ): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombreCliente) {
      params = params.set('nombreCliente', nombreCliente);
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    const key = `repsInact:${params.toString()}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(`${this.apiUrl}/inactivas`, { headers, params })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  getAllReparaciones(): Observable<any> {
    const headers = this.getHeaders();
    const key = `repsAll`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(`${this.apiUrl}/all`, { headers })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  activarReparacion(reparacion: any): Observable<any> {
    const url = `${this.apiUrl}/${reparacion.id}/activar`;
    const headers = this.getHeaders();
    this.clearCache();
    return this.http.put<any>(url, reparacion, { headers });
  }

  desactivarReparacion(reparacion: any): Observable<any> {
    const url = `${this.apiUrl}/${reparacion.id}/desactivar`;
    const headers = this.getHeaders();
    this.clearCache();
    return this.http.put<any>(url, reparacion, { headers });
  }

  getReparacion(codigo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/codigo/${codigo}`);
  }

  agregarReparacion(nuevaReparacion: any): Observable<any> {
    const headers = this.getHeaders();
    // Invalida caché para que el listado se recargue inmediatamente
    this.clearCache();
    return this.http.post(this.apiUrl, nuevaReparacion, {
      headers,
      responseType: 'text',
    });
  }

  eliminarReparacion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    this.clearCache();
    return this.http.delete<any>(url, { headers });
  }

  modificarReparacion(reparacion: any): Observable<any> {
    const url = `${this.apiUrl}/${reparacion.id}`;
    const headers = this.getHeaders();
    this.clearCache();
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
    const key = `repsPorMes:${anio || 'na'}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(`${this.apiUrl}/reparaciones-por-mes`, { headers, params })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }

  getReparacionesPorTecnico(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    console.log(
      'Solicitando reparaciones por técnico:',
      `${this.apiUrl}/reparaciones-por-tecnico`,
      { anio }
    );
    return this.http
      .get<any>(`${this.apiUrl}/reparaciones-por-tecnico`, {
        headers,
        params,
      })
      .pipe(
        tap((response) =>
          console.log('Respuesta reparaciones por técnico:', response)
        ),
        catchError((error) => {
          console.error('Error en reparaciones por técnico:', error);
          throw error;
        })
      );
  }

  getIngresosPorTecnico(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    console.log(
      'Solicitando ingresos por técnico:',
      `${this.apiUrl}/estadisticas/ingresos-tecnico`,
      { anio }
    );
    return this.http
      .get<any>(`${this.apiUrl}/estadisticas/ingresos-tecnico`, {
        headers,
        params,
      })
      .pipe(
        tap((response) =>
          console.log('Respuesta ingresos por técnico:', response)
        ),
        catchError((error) => {
          console.error('Error en ingresos por técnico:', error);
          throw error;
        })
      );
  }

  getIngresosPorMes(anio?: number): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (anio) {
      params = params.append('anio', anio.toString());
    }
    const key = `ingMes:${anio || 'na'}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.http
          .get<any>(`${this.apiUrl}/estadisticas/ingresos-por-mes`, {
            headers,
            params,
          })
          .pipe(shareReplay(1))
      );
    }
    return this.cache.get(key)!;
  }
}
