import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepairsService } from 'src/app/services/repairs.service';
import { HistorialClienteService } from 'src/app/services/historial-cliente.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { PointsService } from '../../services/points.service';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class SeguimientoComponent implements OnInit {
  reparacionBuscada: any = null;
  historialCliente: any[] = [];
  estadisticasCliente: any = null;
  ultimaNota: any = null;
  form: FormGroup;
  isLoading: boolean = false;
  mostrarHistorial: boolean = false;
  errorMessage: string = '';
  busquedaRealizada: boolean = false;
  reparacionSeleccionada: any = null;
  valorPunto: number = 5;

  constructor(
    private fb: FormBuilder, 
    private repairsService: RepairsService,
    private clientsService: ClientsService,
    private historialClienteService: HistorialClienteService,
    private pointsService: PointsService
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.pattern('^[0-9]{8}$')]]
    });
    this.valorPunto = this.pointsService.calculatePointsValue(1);
  }

  ngOnInit(): void {}

  resetearEstados(): void {
    this.isLoading = false;
    this.errorMessage = '';
    this.busquedaRealizada = false;
    this.mostrarHistorial = false;
  }

  verDetallesReparacion(reparacion: any): void {
    this.reparacionSeleccionada = reparacion;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarModal(event: MouseEvent): void {
    // Solo cerrar si se hace clic en el overlay o en el botón de cerrar
    if (
      event.target === event.currentTarget || 
      (event.target as HTMLElement).closest('.cerrar-modal')
    ) {
      this.reparacionSeleccionada = null;
      // Restaurar scroll del body
      document.body.style.overflow = 'auto';
    }
  }

  obtenerUltimaNota(reparacion: any): string {
    if (reparacion.notasreparacion && reparacion.notasreparacion.length > 0) {
      const notasOrdenadas = [...reparacion.notasreparacion].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      return notasOrdenadas[0].informe;
    }
    return 'Pendiente de diagnóstico';
  }

  buscarReparacion(): void {
    if (this.form.get('codigo')?.valid) {
      this.resetearEstados();
      this.isLoading = true;
      this.busquedaRealizada = true;
      const idBusqueda = this.form.get('codigo')?.value ?? '';
      
      this.repairsService.getReparacion(idBusqueda).subscribe({
        next: (data) => {
          this.reparacionBuscada = data;
          if (this.reparacionBuscada.notasreparacion && this.reparacionBuscada.notasreparacion.length > 0) {
            this.reparacionBuscada.notasreparacion.sort(
              (a: { fecha: string }, b: { fecha: string }) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            this.ultimaNota = this.reparacionBuscada.notasreparacion[0].informe;
          }
          if (this.reparacionBuscada.cliente?.dni) {
            this.buscarHistorialCliente(this.reparacionBuscada.cliente.dni);
          }
          this.errorMessage = '';
          this.isLoading = false;
          setTimeout(() => {
            const resultSection = document.querySelector('.results-section');
            if (resultSection) {
              resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        },
        error: (error) => {
          console.error('Error al obtener reparación:', error);
          this.reparacionBuscada = null;
          this.errorMessage = 'No se encontró ninguna reparación con el código ingresado';
          this.mostrarHistorial = false;
          this.isLoading = false;
        }
      });
    } else {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  buscarHistorialCliente(dni: string): void {
    this.resetearEstados();
    this.isLoading = true;
    this.busquedaRealizada = true;
    
    this.historialClienteService.obtenerHistorialPorDNI(dni).subscribe({
      next: (historial) => {
        this.historialCliente = historial;
        if (historial.length === 0) {
          this.errorMessage = 'No se encontraron reparaciones para el DNI ingresado';
          this.mostrarHistorial = false;
        } else {
          this.estadisticasCliente = this.historialClienteService.obtenerEstadisticas(historial);
          this.mostrarHistorial = true;
        }
        this.isLoading = false;
        setTimeout(() => {
          const historialSection = document.querySelector('.historial-section');
          if (historialSection) {
            historialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error al obtener historial:', error);
        this.errorMessage = 'Ocurrió un error al buscar el historial del cliente';
        this.mostrarHistorial = false;
        this.isLoading = false;
      }
    });
  }

  buscarPorDNI(): void {
    const dni = this.form.get('dni')?.value;
    if (dni) {
      this.buscarHistorialCliente(dni);
    } else {
      this.form.get('dni')?.markAsTouched();
    }
  }

  limpiarBusqueda(): void {
    this.form.reset();
    this.reparacionBuscada = null;
    this.historialCliente = [];
    this.estadisticasCliente = null;
    this.resetearEstados();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  calcularPuntosReparacion(reparacion: any): string {
    const puntos = this.pointsService.calculateRepairPoints(reparacion);
    if (puntos === null) {
      return 'Pendiente de entrega';
    }
    return puntos.toString() + ' puntos';
  }
}
