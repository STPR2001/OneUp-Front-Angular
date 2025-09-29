import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ClientsService } from 'src/app/services/clients.service';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

declare var bootstrap: any;

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
})
export class ClientsComponent implements OnInit, OnDestroy {
  @ViewChild('agregarClienteModal') modalCloseAdd: any;
  @ViewChild('ModificarClienteModal') modalCloseUpdate: any;

  nuevoCliente: any = {
    nombre: '',
    email: '',
    cedula: '',
    direccion: '',
    observacion: '',
    telefono: '',
  };
  clientes: any[] = [];
  allClientes: any[] = []; // Array con todos los clientes para estadísticas
  clienteSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarCliente = false;
  cliente: any = {};
  errorModificarCliente = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getClientes();
    this.getAllClientesForStats();
    this.setupSearchDebounce();

    // Abrir modal automáticamente si viene con query param desde el dashboard
    this.route.queryParamMap.subscribe(params => {
      const openAdd = params.get('openAdd');
      if (openAdd === '1') {
        setTimeout(() => {
          const btn = document.querySelector('[data-bs-target="#agregarClienteModal"]') as HTMLElement;
          if (btn) {
            btn.click();
          } else {
            const modalEl = document.getElementById('agregarClienteModal');
            if (modalEl) {
              const modal = new (window as any).bootstrap.Modal(modalEl);
              modal.show();
            }
          }
          // Limpiar el query param
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { openAdd: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.nombre = searchTerm;
        this.currentPage = 0;
        this.getClientes();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getClientes(): void {
    this.clientsService
      .getClientesActivos(this.currentPage, this.pageSize, this.nombre)
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

  getAllClientesForStats(): void {
    // Obtener todos los clientes para las estadísticas
    this.clientsService
      .getClientesActivos(0, 1000, '') // Obtener muchos clientes para estadísticas
      .subscribe(
        (data) => {
          this.allClientes = data.content;
        },
        (error) => {
          console.error('Error al obtener clientes para estadísticas:', error);
        }
      );
  }

  getTotalClientes(): number {
    return this.allClientes.length;
  }

  getTotalPuntos(): number {
    return this.allClientes.reduce((total, cliente) => total + (cliente.puntos || 0), 0);
  }

  getClientesNuevos(): number {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return this.allClientes.filter(cliente => {
      if (cliente.fechaCreacion) {
        const fechaCreacion = new Date(cliente.fechaCreacion);
        return fechaCreacion.getMonth() === currentMonth && 
               fechaCreacion.getFullYear() === currentYear;
      }
      return false;
    }).length;
  }

  trackByClienteId(index: number, cliente: any): any {
    return cliente.id;
  }

  verDetallesCliente(cliente: any): void {
    this.clienteSeleccionado = { ...cliente };
    const modalElement = document.getElementById('verDetallesClienteModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    this.clienteSeleccionado = {};
  }

  exportarClientes(): void {
    if (this.clientes.length === 0) {
      return;
    }

    const csvHeaders = ['Nombre', 'Email', 'Teléfono', 'Cédula', 'Dirección', 'Puntos', 'Observaciones'];
    const csvData = this.clientes.map(cliente => [
      cliente.nombre || '',
      cliente.email || '',
      cliente.telefono || '',
      cliente.cedula || '',
      cliente.direccion || '',
      cliente.puntos || 0,
      cliente.observacion || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getClientes();
    this.getAllClientesForStats();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor);
  }

  desactivarCliente(cliente: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clientsService
          .desactivarCliente(cliente)
          .pipe(
            tap(() => {
              console.log('Cliente desactivado exitosamente');
              this.getClientes();
              this.getAllClientesForStats();
            }),
            catchError((error) => {
              console.error('Error al desactivar cliente:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getClientes();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getClientes();
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = { ...cliente };
  }

  agregarCliente(): void {
    if (!this.nuevoCliente.nombre || this.nuevoCliente.nombre.trim() === '') {
      this.errorAgregarCliente = true;
      setTimeout(() => {
        this.errorAgregarCliente = false;
      }, 5000);
      return;
    }

    this.clientsService
      .agregarCliente(this.nuevoCliente)
      .pipe(
        tap(() => {
          console.log('Cliente agregado exitosamente');
          this.nuevoCliente = {
            nombre: '',
            email: '',
            cedula: '',
            direccion: '',
            observacion: '',
            telefono: '',
          };
          this.getClientes();
          this.getAllClientesForStats();
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar cliente:', error);
          this.errorAgregarCliente = true;
          setTimeout(() => {
            this.errorAgregarCliente = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarCliente(): void {
    if (!this.cliente.nombre || this.cliente.nombre.trim() === '') {
      this.errorModificarCliente = true;
      setTimeout(() => {
        this.errorModificarCliente = false;
      }, 5000);
      return;
    }

    this.clientsService
      .modificarCliente(this.cliente)
      .pipe(
        tap(() => {
          console.log('Cliente modificado exitosamente');
          this.router.navigate(['/clients']);
          this.getClientes();
          this.getAllClientesForStats();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar cliente:', error);
          this.errorModificarCliente = true;
          setTimeout(() => {
            this.errorModificarCliente = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  abrirModalModificacion(
    id: string,
    nombre: string,
    email: string,
    telefono: string,
    cedula: string,
    direccion: string,
    observacion: string
  ) {
    this.cliente.id = id;
    this.cliente.nombre = nombre;
    this.cliente.email = email;
    this.cliente.telefono = telefono;
    this.cliente.cedula = cedula;
    this.cliente.direccion = direccion;
    this.cliente.observacion = observacion;
  }

  eliminarCliente(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clientsService.eliminarCliente(id).subscribe(
          () => {
            this.getClientes();
            this.getAllClientesForStats();
          },
          (error) => {
            console.error('Error al eliminar cliente', error);
          }
        );
      }
    });
  }
}
