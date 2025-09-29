import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { ShoppingService } from 'src/app/services/shopping.service';
import { ProvidersService } from 'src/app/services/providers.service';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

declare var bootstrap: any;

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit, OnDestroy {
  @ViewChild('agregarCompraModal') agregarCompraModalTpl: any;
  @ViewChild('ModificarCompraModal') modalCloseUpdate: any;
  @ViewChild('agregarProveedorModal') agregarProveedorModalTpl: any;
  @ViewChild('agregarRepuestoModal') agregarRepuestoModalTpl: any;
  @ViewChild('modificarCompraModal') modificarCompraModalTpl: any;

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
  todayMaxDatetime: string = '';
  searchTerm: string = '';

  compraForm!: FormGroup;
  proveedores: any[] = [];
  repuestosDisponibles: any[] = [];
  agregarCompraModalRef?: NgbModalRef;
  modificarCompraModalRef?: NgbModalRef;
  agregarProveedorModalRef?: NgbModalRef;
  nuevoProveedor: any = { nombre: '', direccion: '', telefono: '', email: '' };
  errorAgregarProveedor = false;
  agregarRepuestoModalRef?: NgbModalRef;
  nuevoRepuesto: any = { descripcion: '', numeroDeParte: '', precioCosto: 0, precioVenta: 0, stock: 0 };
  errorAgregarRepuesto = false;

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private shoppingService: ShoppingService,
    private router: Router,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private providersService: ProvidersService,
    private repuestosService: RepuestosService
  ) {}

  ngOnInit(): void {
    this.getCompras();
    this.getAllComprasForStats();
    this.today = this.getToday();
    this.todayMaxDatetime = this.getTodayMaxDatetime();
    this.setupSearchDebounce();
    this.initForm();
    this.cargarProveedoresYRepuestos();
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

  // Form helpers
  initForm(): void {
    this.compraForm = this.fb.group({
      fecha: ['', Validators.required],
      id_proveedor: ['', Validators.required],
      repuestos: this.fb.array([], Validators.minLength(1)),
      total: [{ value: '', disabled: false }, Validators.required],
    });

    // Recalcular total cuando cambien los repuestos
    this.compraForm.get('repuestos')?.valueChanges.subscribe(() => {
      this.recalcularTotal();
    });
  }

  get repuestos(): FormArray { return this.compraForm.get('repuestos') as FormArray; }

  agregarRepuesto(): void {
    this.repuestos.push(
      this.fb.group({
        id: ['', Validators.required],
        precio: [0, [Validators.required, Validators.min(0.01)]],
        cant: [1, [Validators.required, Validators.min(1)]],
      })
    );
  }

  eliminarRepuesto(i: number): void {
    this.repuestos.removeAt(i);
  }

  cargarProveedoresYRepuestos(): void {
    this.providersService.getProveedoresActivosParaFormularios().subscribe((data: any) => {
      this.proveedores = data?.content || data || [];
    });
    this.repuestosService.getRepuestosActivosParaFormularios().subscribe((data: any) => {
      this.repuestosDisponibles = data?.content || data || [];
    });
  }

  onRepuestoChange(_event: any, _index: number): void {
    // En este contexto solo mantenemos la firma para compatibilidad del template
  }

  abrirAgregarCompra(): void {
    if (this.repuestos.length === 0) { this.agregarRepuesto(); }
    this.compraForm.patchValue({ fecha: this.getNowLocalDatetimeString() });
    this.agregarCompraModalRef = this.modalService.open(this.agregarCompraModalTpl, { size: 'lg' });
  }

  abrirModificarCompra(compra: any): void {
    // Guardamos referencia del ID a modificar
    this.compra = { id: compra?.id };
    // Reseteamos y cargamos datos en el mismo formulario reutilizado
    this.compraForm.reset();
    this.repuestos.clear();
    const fecha = compra?.fecha ? this.getLocalDatetimeFromIso(compra.fecha) : this.getNowLocalDatetimeString();
    const proveedorId = compra?.id_proveedor || compra?.proveedor?.id || '';
    this.compraForm.patchValue({ fecha: fecha, id_proveedor: proveedorId, total: compra?.total || 0 });

    const items = compra?.compraRepuesto || [];
    items.forEach((it: any) => {
      this.repuestos.push(this.fb.group({
        id: it?.repuesto?.id ?? it?.id_repuesto ?? it?.id ?? '',
        precio: it?.precio ?? it?.repuesto?.precioCosto ?? 0,
        cant: it?.cant ?? it?.cantidad ?? 1,
      }));
    });
    if (this.repuestos.length === 0) { this.agregarRepuesto(); }
    this.recalcularTotal();
    this.modificarCompraModalRef = this.modalService.open(this.modificarCompraModalTpl, { size: 'lg' });
  }

  crearCompraDesdePopup(modal: any): void {
    if (this.compraForm.invalid) { this.compraForm.markAllAsTouched(); return; }
    const payload = this.compraForm.value;
    this.shoppingService.agregarCompra(payload).pipe(
      tap(() => {
        this.getCompras();
        this.getAllComprasForStats();
        modal.close();
        this.compraForm.reset();
        this.repuestos.clear();
      }),
      catchError((error) => {
        console.error('Error al agregar compra:', error);
        this.errorAgregarCompra = true;
        setTimeout(() => { this.errorAgregarCompra = false; }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  guardarModificacionDesdePopup(modal: any): void {
    if (this.compraForm.invalid) { this.compraForm.markAllAsTouched(); return; }
    const payload = { id: this.compra?.id, ...this.compraForm.value };
    this.shoppingService.modificarCompra(payload).pipe(
      tap(() => {
        this.getCompras();
        this.getAllComprasForStats();
        modal.close();
        this.compraForm.reset();
        this.repuestos.clear();
      }),
      catchError((error) => {
        console.error('Error al modificar compra:', error);
        this.errorModificarCompra = true;
        setTimeout(() => { this.errorModificarCompra = false; }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  private recalcularTotal(): void {
    const repuestos = this.repuestos.getRawValue() || [];
    const total = repuestos.reduce((acc: number, r: any) => acc + (Number(r.precio) || 0) * (Number(r.cant) || 0), 0);
    this.compraForm.get('total')?.setValue(total);
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
          // ya no usamos cierre por ViewChild; el nuevo popup usa NgbModal
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

  private getTodayMaxDatetime(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}T23:59`;
  }

  private getNowLocalDatetimeString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private getLocalDatetimeFromIso(iso: string): string {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Proveedor modal
  openAgregarProveedorModal(): void {
    this.nuevoProveedor = { nombre: '', direccion: '', telefono: '', email: '' };
    this.agregarProveedorModalRef = this.modalService.open(this.agregarProveedorModalTpl, { size: 'lg' });
  }

  agregarProveedor(): void {
    this.providersService.agregarProveedor(this.nuevoProveedor).pipe(
      tap(() => {
        this.cargarProveedoresYRepuestos();
        if (this.agregarProveedorModalRef) { this.agregarProveedorModalRef.close(); }
      }),
      catchError((error) => {
        console.error('Error al agregar proveedor:', error);
        this.errorAgregarProveedor = true;
        setTimeout(() => { this.errorAgregarProveedor = false; }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  // Repuesto modal
  openAgregarRepuestoModal(): void {
    this.nuevoRepuesto = { descripcion: '', numeroDeParte: '', precioCosto: 0, precioVenta: 0, stock: 0 };
    this.agregarRepuestoModalRef = this.modalService.open(this.agregarRepuestoModalTpl, { size: 'lg' });
  }

  crearRepuestoDesdePopup(modal: any): void {
    this.repuestosService.agregarRepuesto(this.nuevoRepuesto).pipe(
      tap(() => {
        this.cargarProveedoresYRepuestos();
        if (this.agregarRepuestoModalRef) { this.agregarRepuestoModalRef.close(); }
      }),
      catchError((error) => {
        console.error('Error al agregar repuesto:', error);
        this.errorAgregarRepuesto = true;
        setTimeout(() => { this.errorAgregarRepuesto = false; }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  calcularRentabilidadNuevoRepuesto(): number {
    const costo = Number(this.nuevoRepuesto?.precioCosto || 0);
    const venta = Number(this.nuevoRepuesto?.precioVenta || 0);
    if (costo <= 0) { return 0; }
    return Math.round(((venta - costo) / costo) * 100);
  }
}
