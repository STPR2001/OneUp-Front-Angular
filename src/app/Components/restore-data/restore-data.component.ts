import { Component, OnInit } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { ClientsService } from 'src/app/services/clients.service';
import { RepairsService } from 'src/app/services/repairs.service';
import { ProvidersService } from 'src/app/services/providers.service';
import { ShoppingService } from 'src/app/services/shopping.service';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepuestosService } from 'src/app/services/repuestos.service';


@Component({
  selector: 'app-restore-data',
  templateUrl: './restore-data.component.html',
  styleUrls: ['./restore-data.component.css']
})
export class RestoreDataComponent implements OnInit {
  clientes: any[] = [];
  cliente: any = {};

  repuestos: any[] = [];
  repuesto: any = {};

  tecnicos: any[] = [];
  tecnico: any = {};

  compras: any[] = [];
  compra: any = {};

  proveedores: any[] = [];
  proveedor: any = {};

  equipos: any[] = [];
  equipo: any = {};

  reparaciones: any[] = [];
  reparacion: any = {};

  selectedDataType: string = '';
  
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private clientsService: ClientsService,
    private tecnicsService: TecnicsService,
    private equipoService: EquipoService,
    private repairService: RepairsService,
    private providerServie: ProvidersService,
    private repuestoService: RepuestosService,
    private shoppingService: ShoppingService
  ) {}

  ngOnInit(): void {
    // Se pueden inicializar otras cosas si es necesario
  }

  onDataTypeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedDataType = selectElement.value;
    if (this.selectedDataType === 'clientes') {
      this.getClientes();
    }
    if (this.selectedDataType === 'tecnicos') {
      this.getTecnicos();
    }
    if (this.selectedDataType === 'proveedores') {
      this.getProveedores();
    }
    if (this.selectedDataType === 'compras') {
      this.getCompras();
    }
    if (this.selectedDataType === 'reparaciones') {
      this.getReparaciones();
    }
    if (this.selectedDataType === 'equipos') {
      this.getEquipos();
    }
    if (this.selectedDataType === 'repuestos') {
      this.getRepuestos();
    }
    
  }

  getClientes(): void {
    this.clientsService
      .getClientesInactivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.clientes = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de clientes:', error);
        }
      );
  }

  activarCliente(cliente: any): void {
    this.clientsService
      .activarCliente(cliente)
      .pipe(
        tap(() => {
          console.log('Cliente activado exitosamente');
          this.getClientes();
        }),
        catchError((error) => {
          console.error('Error al activar cliente:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getRepuestos(): void {
    this.repuestoService
      .getRepuestosInactivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.repuestos = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de repuestos:', error);
        }
      );
  }

  activarRepuesto(repuesto: any): void {
    this.repuestoService.activarRepuesto(repuesto)
      .pipe(
        tap(() => {
          console.log('repuesto activado exitosamente');
          this.getRepuestos();
        }),
        catchError((error) => {
          console.error('Error al activar repuesto:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getTecnicos(): void {
    this.tecnicsService
      .getTecnicosInactivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.tecnicos = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de tecnicos:', error);
        }
      );
  }

  activarTecnico(tecnico: any): void {
    this.tecnicsService.activarTecnico(tecnico)
      .pipe(
        tap(() => {
          console.log('tecnico activado exitosamente');
          this.getTecnicos();
        }),
        catchError((error) => {
          console.error('Error al activar tecnico:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getReparaciones(): void {
    this.repairService
      .getReparacionesInactivas(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.reparaciones = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de reparaciones:', error);
        }
      );
  }

  activarReparacion(reparacion: any): void {
    this.repairService.activarReparacion(reparacion)
      .pipe(
        tap(() => {
          console.log('reparacion activado exitosamente');
          this.getReparaciones();
        }),
        catchError((error) => {
          console.error('Error al activar reparacion:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getCompras(): void {
    this.shoppingService
      .getComprasInactivas(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.compras = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de compras:', error);
        }
      );
  }

  activarCompra(compra: any): void {
    this.shoppingService.activarCompra(compra)
      .pipe(
        tap(() => {
          console.log('compra activado exitosamente');
          this.getCompras();
        }),
        catchError((error) => {
          console.error('Error al activar compra:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getTotalCantidad(compra: any): number {
    return compra.compraRepuesto.reduce(
      (sum: number, repuesto: any) => sum + repuesto.cant,
      0
    );
  }

  getEquipos(): void {
    this.equipoService
      .getEquiposInactivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.equipos = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de equipos:', error);
        }
      );
  }

  activarEquipo(equipo: any): void {
    this.equipoService.activarEquipo(equipo)
      .pipe(
        tap(() => {
          console.log('equipo activado exitosamente');
          this.getEquipos();
        }),
        catchError((error) => {
          console.error('Error al activar equipo:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  getProveedores(): void {
    this.providerServie
      .getProveedoresInactivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.proveedores = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de proveedores:', error);
        }
      );
  }

  activarProveedor(proveedor: any): void {
    this.providerServie.activarProveedor(proveedor)
      .pipe(
        tap(() => {
          console.log('proveedor activado exitosamente');
          this.getProveedores();
        }),
        catchError((error) => {
          console.error('Error al activar proveedor:', error);
          return of(error);
        })
      )
      .subscribe();
  }

}
