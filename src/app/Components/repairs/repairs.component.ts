import { Component, OnInit, ViewChild } from '@angular/core';
import { RepairsService } from 'src/app/services/repairs.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.css'],
})
export class RepairsComponent implements OnInit {
  @ViewChild('agregarReparacionModal') modalCloseAdd: any;
  @ViewChild('ModificarReparacionModal') modalCloseUpdate: any;

  reparaciones: any[] = [];
  tecnicos: any[] = [];
  equipos: any[] = [];
  clientes: any[] = [];
  reparacionSeleccionada: any = {};
  searchTerm: string = '';
  estadoFiltro: string = 'Todos';
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

  errorModificarReparacion = false;
  errorAgregarReparacion = false;

  constructor(
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private EquipoService: EquipoService
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerReparaciones();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
  }

  obtenerReparaciones(): void {
    this.RepairsService.getReparaciones().subscribe(
      (data) => {
        this.reparaciones = data;
        console.log(this.reparaciones);
      },
      (error) => {
        console.error('Error al obtener reparaciones:', error);
      }
    );
  }

  agregarReparacion(): void {
    this.RepairsService.agregarReparacion(this.nuevaReparacion)
      .pipe(
        tap(() => {
          console.log('Reparación agregada exitosamente');
          this.nuevaReparacion = {
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
          this.setFechaActual();
          this.obtenerReparaciones();
          console.log(this.nuevaReparacion);
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar reparación:', error);
          this.errorAgregarReparacion = true;
          setTimeout(() => {
            this.errorAgregarReparacion = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarReparacion(): void {
    this.RepairsService.modificarReparacion(this.reparacion)
      .pipe(
        tap(() => {
          console.log('Reparación modificada exitosamente');
          //this.router.navigate(['/repairs']);
          this.obtenerReparaciones();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar reparación:', error);
          this.errorModificarReparacion = true;
          setTimeout(() => {
            this.errorModificarReparacion = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
  abrirModalModificacion(reparacion: any) {
    this.reparacion = { ...reparacion };
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
    this.ClientsService.getClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.TecnicsService.getTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
        console.log(this.tecnicos);
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.EquipoService.getEquipos().subscribe(
      (data) => {
        this.equipos = data;
        console.log(this.equipos);
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
      const matchesCliente = reparacion.cliente.nombre
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());
      const matchesEstado =
        this.estadoFiltro === 'Todos' ||
        reparacion.estado === this.estadoFiltro;
      return matchesCliente && matchesEstado;
    });
  }

  setFechaActual(): void {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    this.nuevaReparacion.fechaIngreso = `${year}-${month}-${day}`;
  }

  //Aplicar logica para modales
  abrirModalAgregarTecnico(): void {}

  abrirModalAgregarCliente(): void {}

  abrirModalAgregarEquipo(): void {}
}
