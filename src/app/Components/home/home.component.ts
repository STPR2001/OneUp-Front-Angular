import { Component, OnInit, ViewChild } from '@angular/core';
import { RepairsService } from 'src/app/services/repairs.service';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  reparaciones: any[] = [];
  tecnicos: any[] = [];
  equipos: any[] = [];
  clientes: any[] = [];
  reparacionSeleccionada: any = {};
  searchTerm: string = '';
  estadoFiltro: string = 'En taller';
  estados: string[] = ['En taller', 'Finalizada', 'Entregada'];
  nuevaReparacion: any = {
    fechaIngreso: '',
    tecnico: { id: '' },
    cliente: { id: '' },
    equipo: { id: '' },
    accesorios: '',
    falla: '',
    codigoSeguimiento: 'asdasdasd',
    estado: '',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
  };
  reparacion: any = {
    fechaIngreso: '',
    tecnico: { id: '' },
    cliente: { id: '' },
    equipo: { id: '' },
    accesorios: '',
    falla: '',
    codigoSeguimiento: '',
    estado: '',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
  };

  errorAgregarReparacion = false;

  constructor(
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private EquipoService: EquipoService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerReparaciones();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
  }

  obtenerReparaciones(): void {
    this.RepairsService.getAllReparaciones().subscribe(
      (data) => {
        this.reparaciones = data;
      },
      (error) => {
        console.error('Error al obtener reparaciones:', error);
      }
    );
  }

  eliminarReparacion(id: number): void {
    this.RepairsService.eliminarReparacion(id).subscribe(
      () => {
        this.obtenerReparaciones();
      },
      (error) => {
        console.error('Error al eliminar reparacion', error);
      }
    );
  }

  seleccionaReparacion(reparacion: any): void {
    this.reparacionSeleccionada = { ...reparacion };
  }

  obtenerClientes(): void {
    this.ClientsService.getAllClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.TecnicsService.getAllTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.EquipoService.getAllEquipos().subscribe(
      (data) => {
        this.equipos = data;
      },
      (error) => {
        console.error('Error al obtener los equipos:', error);
      }
    );
  }

  get filteredReparaciones() {
    return this.reparaciones.filter((reparacion) =>
      reparacion.cliente.nombre
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredReparacionesForStatus() {
    return this.reparaciones.filter((reparacion) => {
      const matchesSearch = 
        reparacion.cliente.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reparacion.equipo.marca.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reparacion.equipo.modelo.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reparacion.falla.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch && reparacion.estado === 'En taller' && reparacion.activo;
    });
  }

  setFechaActual(): void {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    this.nuevaReparacion.fechaIngreso = `${year}-${month}-${day}`;
  }

  // Funciones para las estadísticas
  getReparacionesEnTaller(): number {
    return this.reparaciones.filter(r => r.estado === 'En taller' && r.activo).length;
  }

  getReparacionesFinalizadas(): number {
    return this.reparaciones.filter(r => r.estado === 'Finalizada' && r.activo).length;
  }

  getReparacionesEntregadas(): number {
    return this.reparaciones.filter(r => r.estado === 'Entregada' && r.activo).length;
  }

  getTotalReparaciones(): number {
    return this.reparaciones.filter(r => r.activo).length;
  }

  // Función para calcular días en taller
  getDiasEnTaller(reparacion: any): number {
    const fechaIngreso = new Date(reparacion.fechaIngreso);
    const hoy = new Date();
    const diferencia = hoy.getTime() - fechaIngreso.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }

  // Funciones para estadísticas adicionales
  getEstadisticasGenerales() {
    const reparacionesActivas = this.reparaciones.filter(r => r.activo);
    return {
      totalReparaciones: reparacionesActivas.length,
      reparacionesUrgentes: reparacionesActivas.filter(r => this.getDiasEnTaller(r) > 7 && r.estado === 'En taller').length,
      ingresosMensuales: this.calcularIngresosMensuales(),
      promedioTiempoReparacion: this.calcularPromedioTiempoReparacion(),
      clientesRecurrentes: this.obtenerClientesRecurrentes(),
      tecnicoMasProductivo: this.obtenerTecnicoMasProductivo()
    };
  }

  calcularIngresosMensuales(): number {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    console.log('Calculando ingresos para:', {
      mes: mesActual + 1,
      anio: anioActual
    });

    const reparacionesEntregadas = this.reparaciones.filter(r => {
      // Verificar si la reparación está activa
      const estaActiva = r.activo === true || r.activo === undefined || r.activo === null;
      if (!estaActiva) {
        console.log(`Reparación ${r.id} descartada: inactiva`);
        return false;
      }

      // Verificar si tiene monto de reparación
      const tieneMontos = (r.manoDeObra > 0 || r.entrega > 0);
      if (!tieneMontos) {
        console.log(`Reparación ${r.id} descartada: sin montos registrados`);
        return false;
      }

      // Verificar si está en estado entregada o finalizada
      const estadoValido = r.estado === 'Entregada' || r.estado === 'Finalizada';
      if (!estadoValido) {
        console.log(`Reparación ${r.id} descartada: estado ${r.estado} no válido`);
        return false;
      }

      // Si no tiene fecha de entrega, usar la fecha de última actualización o la actual
      const fechaEntrega = r.fechaEntrega ? new Date(r.fechaEntrega) : 
                          r.fechaActualizacion ? new Date(r.fechaActualizacion) : 
                          new Date();

      const mesEntrega = fechaEntrega.getMonth();
      const anioEntrega = fechaEntrega.getFullYear();
      
      const estaEnMesActual = mesEntrega === mesActual && anioEntrega === anioActual;
      
      if (estaEnMesActual) {
        console.log(`Reparación ${r.id} aceptada: Mano de obra=${r.manoDeObra}, Entrega=${r.entrega}`);
      } else {
        console.log(`Reparación ${r.id} descartada: fecha fuera del mes actual - Mes: ${mesEntrega + 1}, Año: ${anioEntrega}`);
      }
      
      return estaEnMesActual;
    });
    
    console.log('Reparaciones contabilizadas este mes:', reparacionesEntregadas);
    
    const total = reparacionesEntregadas.reduce((total, r) => {
      const subtotal = (r.manoDeObra || 0) + (r.entrega || 0);
      console.log(`Sumando reparación ${r.id}: manoDeObra=${r.manoDeObra}, entrega=${r.entrega}, subtotal=${subtotal}`);
      return total + subtotal;
    }, 0);
    
    console.log('Total ingresos del mes:', total);
    
    return total;
  }

  calcularPromedioTiempoReparacion(): number {
    const reparacionesFinalizadas = this.reparaciones.filter(r => 
      r.activo === true && r.estado === 'Entregada'
    );

    console.log('Calculando promedio para reparaciones:', reparacionesFinalizadas);

    if (reparacionesFinalizadas.length === 0) return 0;

    const tiempoTotal = reparacionesFinalizadas.reduce((total, r) => {
      const inicio = new Date(r.fechaIngreso);
      // Si no hay fecha de entrega, usamos la fecha actual
      const fin = r.fechaEntrega ? new Date(r.fechaEntrega) : new Date();
      const diasEnTaller = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Reparación ${r.id}: ${diasEnTaller} días (${inicio.toISOString()} - ${fin.toISOString()})`);
      return total + diasEnTaller;
    }, 0);

    const promedio = Math.round(tiempoTotal / reparacionesFinalizadas.length);
    console.log(`Promedio calculado: ${promedio} días`);
    return promedio;
  }

  obtenerClientesRecurrentes(): number {
    const clientesConReparaciones: { [key: string]: number } = this.reparaciones
      .filter(r => r.activo)
      .reduce((acc: { [key: string]: number }, r) => {
        acc[r.cliente.id] = (acc[r.cliente.id] || 0) + 1;
        return acc;
      }, {});

    return Object.values(clientesConReparaciones)
      .filter(cantidad => cantidad > 1)
      .length;
  }

  obtenerTecnicoMasProductivo(): string {
    const reparacionesPorTecnico: { [key: string]: number } = this.reparaciones
      .filter(r => r.activo && (r.estado === 'Finalizada' || r.estado === 'Entregada'))
      .reduce((acc: { [key: string]: number }, r) => {
        acc[r.tecnico.nombre] = (acc[r.tecnico.nombre] || 0) + 1;
        return acc;
      }, {});

    if (Object.keys(reparacionesPorTecnico).length === 0) return 'N/A';

    const [tecnicoMasProductivo] = Object.entries(reparacionesPorTecnico)
      .reduce(([maxTecnico, maxCantidad]: [string, number], [tecnico, cantidad]: [string, number]) => 
        cantidad > maxCantidad ? [tecnico, cantidad] : [maxTecnico, maxCantidad]
      , ['', 0]);

    return tecnicoMasProductivo;
  }
}
