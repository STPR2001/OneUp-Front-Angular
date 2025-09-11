import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { ShoppingService } from 'src/app/services/shopping.service';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

declare var bootstrap: any;

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit, OnDestroy {
  @ViewChild('agregarCompraModal') modalCloseAdd: any;
  @ViewChild('ModificarCompraModal') modalCloseUpdate: any;

  compra: any = {};
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  errorModificarCompra = false;
  nuevoCompra: any = {};
  compras: any[] = [];
  allCompras: any[] = []; // Array con todas las compras para estadísticas
  compraSeleccionado: any = {};
  compraSeleccionada: any = {};
  errorAgregarCompra = false;
  startDate: string = '';
  endDate: string = '';
  today: string = '';
  searchTerm: string = '';

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private shoppingService: ShoppingService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getCompras();
    this.getAllComprasForStats();
    this.today = this.getToday();
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
        this.searchTerm = searchTerm;
        this.currentPage = 0;
        this.getCompras();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getCompras(): void {
    this.shoppingService
      .getComprasActivas(this.currentPage, this.pageSize, this.startDate, this.endDate)
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

  getAllComprasForStats(): void {
    // Obtener todas las compras para las estadísticas
    this.shoppingService
      .getComprasActivas(0, 1000, '', '') // Obtener muchas compras para estadísticas
      .subscribe(
        (data) => {
          this.allCompras = data.content;
        },
        (error) => {
          console.error('Error al obtener compras para estadísticas:', error);
        }
      );
  }

  // Métodos de estadísticas
  getTotalCompras(): number {
    return this.allCompras.length;
  }

  getTotalArticulos(): number {
    return this.allCompras.reduce((total, compra) => 
      total + this.getTotalCantidad(compra), 0);
  }

  getMontoTotal(): number {
    return this.allCompras.reduce((total, compra) => 
      total + (compra.total || 0), 0);
  }

  getComprasEsteMes(): number {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    return this.allCompras.filter(compra => {
      const fechaCompra = new Date(compra.fecha);
      return fechaCompra.getMonth() === mesActual && fechaCompra.getFullYear() === añoActual;
    }).length;
  }

  // Métodos de utilidad
  trackByCompraId(index: number, compra: any): any {
    return compra.id;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor || 0);
  }

  formatDateShort(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTimeShort(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRepuestosLimitados(repuestos: any[]): any[] {
    return repuestos ? repuestos.slice(0, 2) : [];
  }

  formatearPrecioUnitario(compra: any): string {
    const totalCantidad = this.getTotalCantidad(compra);
    if (totalCantidad === 0) return '';
    const precioUnitario = (compra.total || 0) / totalCantidad;
    return `${this.formatearMoneda(precioUnitario)} / und.`;
  }

  getEstadoClass(compra: any): string {
    const fecha = new Date(compra.fecha);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return 'reciente';
    if (diferenciaDias <= 7) return 'nueva';
    if (diferenciaDias <= 30) return 'normal';
    return 'antigua';
  }

  getEstadoIcon(compra: any): string {
    const fecha = new Date(compra.fecha);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return 'new_releases';
    if (diferenciaDias <= 7) return 'fiber_new';
    if (diferenciaDias <= 30) return 'check_circle';
    return 'history';
  }

  getEstadoText(compra: any): string {
    const fecha = new Date(compra.fecha);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias === 0) return 'Hoy';
    if (diferenciaDias <= 7) return 'Reciente';
    if (diferenciaDias <= 30) return 'Normal';
    return 'Antigua';
  }

  verDetallesCompra(compra: any): void {
    this.compraSeleccionada = { ...compra };
    const modalElement = document.getElementById('verDetallesCompraModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    this.compraSeleccionada = {};
  }

  exportarCompras(): void {
    if (this.compras.length === 0) {
      return;
    }

    const csvHeaders = ['Fecha', 'Repuestos', 'Cantidad Total', 'Monto', 'Estado'];
    const csvData = this.compras.map(compra => [
      this.formatDate(compra.fecha),
      compra.compraRepuesto?.map((r: any) => `${r.repuesto.descripcion} (${r.cant})`).join('; ') || '',
      this.getTotalCantidad(compra),
      compra.total || 0,
      this.getEstadoText(compra)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getCompras();
    this.getAllComprasForStats();
  }

  desactivarCompra(compra: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.shoppingService.desactivarCompra(compra).pipe(
          tap(() => {
            console.log('Compra desactivada exitosamente');
            this.getCompras();
            this.getAllComprasForStats();
          }),
          catchError((error) => {
            console.error('Error al desactivar compra:', error);
            return of(error);
          })
        ).subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getCompras();
  }

  seleccionarCompra(compra: any): void {
    this.compraSeleccionado = { ...compra };
  }

  navigateToUpdateCompra(id: string, nombre: string): void {
    this.router.navigateByUrl(`/compras/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getCompras();
  }

  eliminarCompra(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.shoppingService.eliminarCompra(id).subscribe(
          () => {
            this.getCompras();
            this.getAllComprasForStats();
          },
          (error) => {
            console.error('Error al eliminar compra:', error);
          }
        );
      }
    });
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  getTotalCantidad(compra: any): number {
    if (!compra || !compra.compraRepuesto) return 0;
    return compra.compraRepuesto.reduce(
      (sum: number, repuesto: any) => sum + (repuesto.cant || 0),
      0
    );
  }

  agregarCompra(): void {
    this.shoppingService
      .agregarCompra(this.nuevoCompra)
      .pipe(
        tap(() => {
          this.router.navigate(['/compras']);
          this.nuevoCompra = {};
          this.getCompras();
          this.getAllComprasForStats();
          if (this.modalCloseAdd) {
            this.modalCloseAdd.nativeElement.click();
          }
        }),
        catchError((error) => {
          console.error('Error al agregar compra:', error);
          this.errorAgregarCompra = true;
          setTimeout(() => {
            this.errorAgregarCompra = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarCompra(): void {
    this.shoppingService
      .modificarCompra(this.compra)
      .pipe(
        tap(() => {
          this.router.navigate(['/compras']);
          this.getCompras();
          this.getAllComprasForStats();
          if (this.modalCloseUpdate) {
            this.modalCloseUpdate.nativeElement.click();
          }
        }),
        catchError((error) => {
          console.error('Error al modificar compra:', error);
          this.errorModificarCompra = true;
          setTimeout(() => {
            this.errorModificarCompra = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  abrirModalModificacion(compraId: string, compraNombre: string) {
    this.compra.id = compraId;
    this.compra.nombre = compraNombre;
  }

  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
