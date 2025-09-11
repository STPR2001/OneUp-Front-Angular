import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ProvidersService } from 'src/app/services/providers.service';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

declare var bootstrap: any;

@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.css'],
})
export class ProvidersComponent implements OnInit, OnDestroy {
  @ViewChild('agregarProveedorModal') modalCloseAdd: any;
  @ViewChild('ModificarProveedorModal') modalCloseUpdate: any;

  proveedor: any = {};
  errorModificarProveedor = false;
  nuevoProveedor: any = {
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  };
  proveedores: any[] = [];
  proveedorSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarProveedor = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Nuevas propiedades para estadísticas y funcionalidades
  allProveedores: any[] = [];
  filteredProveedores: any[] = [];
  viewMode: 'cards' | 'table' = 'table';
  darkMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    private providersService: ProvidersService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeDarkMode();
    this.setupSearchDebounce();
    this.getProveedores();
    this.getAllProveedoresForStats();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private initializeDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    this.darkMode = savedMode === 'true';
    this.applyDarkMode();
  }

  private applyDarkMode(): void {
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    this.applyDarkMode();
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
        this.getProveedores();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getProveedores(): void {
    this.isLoading = true;
    this.providersService
      .getProveedoresActivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.proveedores = data.content;
          this.totalPages = data.totalPages;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error al obtener la lista de proveedores:', error);
          this.isLoading = false;
        }
      );
  }

  getAllProveedoresForStats(): void {
    // Obtener todos los proveedores para las estadísticas
    this.providersService
      .getProveedoresActivos(0, 1000, '')
      .subscribe(
        (data) => {
          this.allProveedores = data.content;
        },
        (error) => {
          console.error('Error al obtener proveedores para estadísticas:', error);
        }
      );
  }

  // Métodos para estadísticas
  getTotalProveedores(): number {
    return this.allProveedores.length;
  }

  getProveedoresConEmail(): number {
    return this.allProveedores.filter(p => p.email && p.email.trim() !== '').length;
  }

  getProveedoresConTelefono(): number {
    return this.allProveedores.filter(p => p.telefono && p.telefono.trim() !== '').length;
  }

  getProveedorReciente(): any {
    if (this.allProveedores.length === 0) return null;
    
    const proveedoresConFecha = this.allProveedores.filter(p => p.fechaCreacion);
    if (proveedoresConFecha.length === 0) return this.allProveedores[0];
    
    return proveedoresConFecha.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    )[0];
  }

  // Funcionalidades adicionales
  trackByProveedorId(index: number, proveedor: any): any {
    return proveedor.id;
  }

  verDetallesProveedor(proveedor: any): void {
    this.proveedorSeleccionado = { ...proveedor };
    const modalElement = document.getElementById('verDetallesProveedorModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    this.proveedorSeleccionado = {};
  }

  exportarProveedores(): void {
    if (this.proveedores.length === 0) {
      return;
    }

    const csvHeaders = ['Nombre', 'Dirección', 'Teléfono', 'Email'];
    const csvData = this.proveedores.map(proveedor => [
      proveedor.nombre || '',
      proveedor.direccion || '',
      proveedor.telefono || '',
      proveedor.email || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getProveedores();
    this.getAllProveedoresForStats();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    // Formato básico para números de teléfono
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  desactivarProveedor(proveedor: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.providersService
          .desactivarProveedor(proveedor)
          .pipe(
            tap(() => {
              console.log('Proveedor desactivado exitosamente');
              this.getProveedores();
              this.getAllProveedoresForStats();
            }),
            catchError((error) => {
              console.error('Error al desactivar proveedor:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getProveedores();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getProveedores();
  }

  seleccionarProveedor(proveedor: any): void {
    this.proveedorSeleccionado = { ...proveedor };
  }

  navigateToUpdateProveedor(id: string, nombre: string): void {
    this.router.navigateByUrl(`/proveedores/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  eliminarProveedor(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.providersService.eliminarProveedor(id).subscribe(
          () => {
            this.getProveedores();
            this.getAllProveedoresForStats();
          },
          (error) => {
            console.error('Error al eliminar proveedor:', error);
          }
        );
      }
    });
  }

  agregarProveedor(): void {
    this.providersService
      .agregarProveedor(this.nuevoProveedor)
      .pipe(
        tap(() => {
          console.log('Proveedor agregado exitosamente');
          this.nuevoProveedor = {
            nombre: '',
            direccion: '',
            telefono: '',
            email: '',
          };
          this.getProveedores();
          this.getAllProveedoresForStats();
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar proveedor:', error);
          this.errorAgregarProveedor = true;
          setTimeout(() => {
            this.errorAgregarProveedor = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarProveedor(): void {
    this.providersService
      .modificarProveedor(this.proveedor)
      .pipe(
        tap(() => {
          console.log('Proveedor modificado exitosamente');
          this.getProveedores();
          this.getAllProveedoresForStats();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar proveedor:', error);
          this.errorModificarProveedor = true;
          setTimeout(() => {
            this.errorModificarProveedor = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  abrirModalModificacion(
    proveedorId: string,
    proveedorNombre: string,
    proveedorDireccion: string,
    proveedorTelefono: string,
    proveedorCorreo: string
  ) {
    this.proveedor.id = proveedorId;
    this.proveedor.nombre = proveedorNombre;
    this.proveedor.direccion = proveedorDireccion;
    this.proveedor.telefono = proveedorTelefono;
    this.proveedor.email = proveedorCorreo;
  }
}
