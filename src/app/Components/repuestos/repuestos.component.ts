import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

declare var bootstrap: any;

@Component({
  selector: 'app-repuestos',
  templateUrl: './repuestos.component.html',
  styleUrls: ['./repuestos.component.css'],
})
export class RepuestosComponent implements OnInit, OnDestroy {
  @ViewChild('agregarRepuestoModal') modalCloseAdd: any;
  @ViewChild('ModificarRepuestoModal') modalCloseUpdate: any;

  repuesto: any = {};
  errorModificarRepuesto = false;
  nuevoRepuesto: any = {
    descripcion: '',
    numeroDeParte: '',
    precioCosto: 0,
    precioVenta: 0,
    stock: 0,
  };
  repuestos: any[] = [];
  allRepuestos: any[] = []; // Array con todos los repuestos para estadísticas
  repuestoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarRepuesto = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private repuestosService: RepuestosService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getRepuestos();
    this.getAllRepuestosForStats();
    this.setupSearchDebounce();
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
        this.getRepuestos();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getRepuestos(): void {
    this.repuestosService
      .getRepuestosActivos(this.currentPage, this.pageSize, this.nombre)
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

  getAllRepuestosForStats(): void {
    // Obtener todos los repuestos para las estadísticas
    this.repuestosService
      .getRepuestosActivos(0, 1000, '') // Obtener muchos repuestos para estadísticas
      .subscribe(
        (data) => {
          this.allRepuestos = data.content;
        },
        (error) => {
          console.error('Error al obtener repuestos para estadísticas:', error);
        }
      );
  }

  getTotalRepuestos(): number {
    return this.allRepuestos.length;
  }

  getTotalStock(): number {
    return this.allRepuestos.reduce((total, repuesto) => total + (repuesto.stock || 0), 0);
  }

  getRepuestosStockBajo(): number {
    return this.allRepuestos.filter(repuesto => (repuesto.stock || 0) <= 5).length;
  }

  getValorInventario(): number {
    return this.allRepuestos.reduce((total, repuesto) => 
      total + ((repuesto.precioCosto || 0) * (repuesto.stock || 0)), 0);
  }

  trackByRepuestoId(index: number, repuesto: any): any {
    return repuesto.id;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor || 0);
  }

  getRentabilidad(repuesto: any): number {
    const costo = repuesto.precioCosto || 0;
    const venta = repuesto.precioVenta || 0;
    if (costo === 0) return 0;
    return Math.round(((venta - costo) / costo) * 100);
  }

  getStockIcon(stock: number): string {
    if (stock === 0) return 'error';
    if (stock <= 5) return 'warning';
    return 'check_circle';
  }

  getStatusClass(repuesto: any): string {
    const stock = repuesto.stock || 0;
    if (stock === 0) return 'agotado';
    if (stock <= 5) return 'stock-bajo';
    return 'disponible';
  }

  getStatusText(repuesto: any): string {
    const stock = repuesto.stock || 0;
    if (stock === 0) return 'Agotado';
    if (stock <= 5) return 'Stock Bajo';
    return 'Disponible';
  }

  calcularRentabilidadModal(): number {
    const costo = this.nuevoRepuesto.precioCosto || 0;
    const venta = this.nuevoRepuesto.precioVenta || 0;
    if (costo === 0) return 0;
    return Math.round(((venta - costo) / costo) * 100);
  }

  calcularRentabilidadModalEdit(): number {
    const costo = this.repuesto.precioCosto || 0;
    const venta = this.repuesto.precioVenta || 0;
    if (costo === 0) return 0;
    return Math.round(((venta - costo) / costo) * 100);
  }

  verDetallesRepuesto(repuesto: any): void {
    this.repuestoSeleccionado = { ...repuesto };
    const modalElement = document.getElementById('verDetallesRepuestoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    this.repuestoSeleccionado = {};
  }

  exportarRepuestos(): void {
    if (this.repuestos.length === 0) {
      return;
    }

    const csvHeaders = ['Descripción', 'Número de Parte', 'Precio Costo', 'Precio Venta', 'Stock', 'Rentabilidad %', 'Valor Stock'];
    const csvData = this.repuestos.map(repuesto => [
      repuesto.descripcion || '',
      repuesto.numeroDeParte || '',
      repuesto.precioCosto || 0,
      repuesto.precioVenta || 0,
      repuesto.stock || 0,
      this.getRentabilidad(repuesto),
      (repuesto.precioCosto || 0) * (repuesto.stock || 0)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `repuestos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getRepuestos();
    this.getAllRepuestosForStats();
  }

  desactivarRepuesto(repuesto: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repuestosService
          .desactivarRepuesto(repuesto)
          .pipe(
            tap(() => {
              console.log('Repuesto desactivado exitosamente');
              this.getRepuestos();
              this.getAllRepuestosForStats();
            }),
            catchError((error) => {
              console.error('Error al desactivar repuesto:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getRepuestos();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getRepuestos();
  }

  seleccionarRepuesto(repuesto: any): void {
    this.repuestoSeleccionado = { ...repuesto };
  }

  navigateToUpdateRepuesto(id: string, nombre: string): void {
    this.router.navigateByUrl(`/repuestos/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  eliminarRepuesto(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repuestosService.eliminarRepuesto(id).subscribe(
          () => {
            this.getRepuestos();
            this.getAllRepuestosForStats();
          },
          (error) => {
            console.error('Error al eliminar repuesto:', error);
          }
        );
      }
    });
  }

  agregarRepuesto(): void {
    // Validaciones
    if (!this.nuevoRepuesto.descripcion || this.nuevoRepuesto.descripcion.trim() === '') {
      this.errorAgregarRepuesto = true;
      setTimeout(() => {
        this.errorAgregarRepuesto = false;
      }, 5000);
      return;
    }

    if (!this.nuevoRepuesto.numeroDeParte || this.nuevoRepuesto.numeroDeParte.trim() === '') {
      this.errorAgregarRepuesto = true;
      setTimeout(() => {
        this.errorAgregarRepuesto = false;
      }, 5000);
      return;
    }

    this.repuestosService.agregarRepuesto(this.nuevoRepuesto).subscribe({
      next: (response) => {
        console.log(response);
        this.router.navigate(['/repuestos']);
        this.nuevoRepuesto = {
          descripcion: '',
          numeroDeParte: '',
          precioCosto: 0,
          precioVenta: 0,
          stock: 0,
        };
        this.getRepuestos();
        this.getAllRepuestosForStats();
        this.modalCloseAdd.nativeElement.click();
      },
      error: (error) => {
        console.log('Error al agregar repuesto:', error);
        this.errorAgregarRepuesto = true;
        setTimeout(() => {
          this.errorAgregarRepuesto = false;
        }, 5000);
        return of(error);
      },
    });
  }

  modificarRepuesto(): void {
    // Validaciones
    if (!this.repuesto.descripcion || this.repuesto.descripcion.trim() === '') {
      this.errorModificarRepuesto = true;
      setTimeout(() => {
        this.errorModificarRepuesto = false;
      }, 5000);
      return;
    }

    if (!this.repuesto.numeroDeParte || this.repuesto.numeroDeParte.trim() === '') {
      this.errorModificarRepuesto = true;
      setTimeout(() => {
        this.errorModificarRepuesto = false;
      }, 5000);
      return;
    }

    this.repuestosService
      .modificarRepuesto(this.repuesto)
      .pipe(
        tap(() => {
          this.router.navigate(['/repuestos']);
          this.getRepuestos();
          this.getAllRepuestosForStats();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar repuesto:', error);
          this.errorModificarRepuesto = true;
          setTimeout(() => {
            this.errorModificarRepuesto = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  abrirModalModificacion(
    repuestoId: string,
    repuestoNumeroDeParte: string,
    repuestoDescripcion: string,
    repuestoPrecioCosto: number,
    repuestoPrecioVenta: number,
    repuestoStock: number
  ) {
    this.repuesto.id = repuestoId;
    this.repuesto.numeroDeParte = repuestoNumeroDeParte;
    this.repuesto.descripcion = repuestoDescripcion;
    this.repuesto.precioCosto = repuestoPrecioCosto;
    this.repuesto.precioVenta = repuestoPrecioVenta;
    this.repuesto.stock = repuestoStock;
  }
}
