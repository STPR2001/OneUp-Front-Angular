import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

export interface UsuarioDTO {
  nombreUsuario: string;
  password?: string;
  activo: boolean;
  roles: string[];
  idTecnico?: number;
}

export interface RolUsuario {
  idRol: number;
  nombreRol: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/usuarios';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
    });
  }

  // Obtener todos los usuarios
  getUsuarios(): Observable<UsuarioDTO[]> {
    const headers = this.getHeaders();
    return this.http.get<UsuarioDTO[]>(this.apiUrl, { headers });
  }

  // Obtener todos los roles disponibles
  getRoles(): Observable<RolUsuario[]> {
    const headers = this.getHeaders();
    return this.http.get<RolUsuario[]>(`${this.apiUrl}/roles`, { headers });
  }

  // Crear nuevo usuario
  crearUsuario(usuario: UsuarioDTO): Observable<string> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, usuario, {
      headers,
      responseType: 'text',
    });
  }

  // Actualizar usuario existente
  actualizarUsuario(
    nombreUsuario: string,
    usuario: UsuarioDTO
  ): Observable<string> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${nombreUsuario}`, usuario, {
      headers,
      responseType: 'text',
    });
  }

  // Eliminar usuario
  eliminarUsuario(nombreUsuario: string): Observable<string> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${nombreUsuario}`, {
      headers,
      responseType: 'text',
    });
  }

  // Activar usuario
  activarUsuario(nombreUsuario: string): Observable<string> {
    const headers = this.getHeaders();
    return this.http.put(
      `${this.apiUrl}/${nombreUsuario}/activar`,
      {},
      {
        headers,
        responseType: 'text',
      }
    );
  }

  // Desactivar usuario
  desactivarUsuario(nombreUsuario: string): Observable<string> {
    const headers = this.getHeaders();
    return this.http.put(
      `${this.apiUrl}/${nombreUsuario}/desactivar`,
      {},
      {
        headers,
        responseType: 'text',
      }
    );
  }
}
