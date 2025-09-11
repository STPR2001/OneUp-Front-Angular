import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { PointsService } from './points.service';

@Injectable({
  providedIn: 'root',
})
export class HistorialClienteService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/reparacion';

  constructor(private http: HttpClient, private pointsService: PointsService) {}

  // Obtener historial por DNI del cliente usando endpoint público
  obtenerHistorialPorDNI(dni: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/public/historial/${dni}`).pipe(
      tap((response) => {
        console.log('Respuesta completa del API:', response);
        console.log('Buscando reparaciones para cédula:', dni);
      }),
      map((reparaciones) => {
        console.log('Reparaciones filtradas:', reparaciones);
        return reparaciones;
      })
    );
  }

  // Calcular puntos totales del cliente
  calcularPuntosTotales(reparaciones: any[]): number {
    return this.pointsService.calculateTotalPoints(reparaciones);
  }

  // Obtener estadísticas del cliente
  obtenerEstadisticas(reparaciones: any[]): any {
    if (reparaciones.length === 0) return null;

    const reparacionesEntregadas = reparaciones.filter(
      (rep) => rep.estado?.toLowerCase() === 'entregada'
    );
    const totalGastado = reparacionesEntregadas.reduce(
      (total, rep) => total + (rep.manoDeObra || 0) + (rep.entrega || 0),
      0
    );

    // Tomamos los puntos directamente del cliente de la última reparación
    // Ya que este valor ya tiene en cuenta los puntos ganados y usados
    const puntosActuales = reparaciones[0].cliente?.puntos || 0;

    return {
      totalReparaciones: reparaciones.length,
      reparacionesEntregadas: reparacionesEntregadas.length,
      reparacionesEnProceso: reparaciones.filter(
        (rep) => rep.estado?.toLowerCase() === 'en taller'
      ).length,
      totalGastado: totalGastado,
      puntosAcumulados: puntosActuales,
    };
  }
}
