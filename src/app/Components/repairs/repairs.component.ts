import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { RepairsService } from 'src/app/services/repairs.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription, forkJoin } from 'rxjs';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddRepairComponent } from './add-repair/add-repair.component';
import { ModifyRepairComponent } from './modify-repair/modify-repair.component';
import * as QRCode from 'qrcode';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.css'],
})
export class RepairsComponent implements OnInit, OnDestroy {
  @ViewChild('modalCloseUpdate', { static: false })
  modalCloseUpdate!: ElementRef;
  @ViewChild('finalizarReparacionModal') modalCloseAdd: any;
  
  reparaciones: any[] = [];
  tecnicos: any[] = [];
  // UI messages (estilo igual a Productos)
  repairMessage: string | null = null;
  isRepairSuccess: boolean = true;
  repuestos: any[] = [];
  equipos: any[] = [];
  clientes: any[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  // Contadores globales por estado (independientes del filtro/paginación)
  totalEnTallerCount: number = 0;
  totalFinalizadasCount: number = 0;
  totalEntregadasCount: number = 0;
  
  nombreCliente?: string;
  usarPuntos: boolean = false;
  puntosAUsar: number = 0;
  valorPunto: number = 5;
  viewMode: 'cards' | 'table' = 'table';
  darkMode: boolean = false;
  
  reparacionSeleccionada: any = {
    id: '',
    fechaIngreso: '',
    cliente: { nombre: '' },
    equipo: {
      marca: { nombre: '' },
      modelo: { nombre: '' },
      tipo_equipo: { nombre: '' },
    },
    falla: '',
    tecnico: { nombre: '' },
    estado: '',
    notasreparacion: [],
    repuesto: [],
  };
  
  searchTerm: string = '';
  estadoFiltro: string = 'En taller';
  estados: string[] = ['Todos', 'En taller', 'Finalizada', 'Entregada'];
  
  nuevaReparacion: any = {
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
  
  reparacion: any = {
    fechaIngreso: '',
    tecnico: { id: '' },
    cliente: { id: '' },
    equipo: { id: '' },
    repuesto: { id: '' },
    accesorios: '',
    falla: '',
    codigoSeguimiento: '',
    estado: '',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
    notasreparacion: {
      reparacion: '',
      fecha: '',
      informe: '',
    },
  };

  nuevaNota: any = {
    reparacionId: '',
    fecha: '',
    informe: '',
  };

  errorAgregarReparacion = false;
  errorAgregarNotaReparacion = false;
  errorModificarReparacion = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  allReparaciones: any[] = [];
  filteredReparaciones: any[] = [];

  constructor(
    private repairsService: RepairsService,
    private tecnicsService: TecnicsService,
    private clientsService: ClientsService,
    private equipoService: EquipoService,
    private repuestosService: RepuestosService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private pointsService: PointsService
  ) {
    this.valorPunto = this.pointsService.calculatePointsValue(1);
  }

  ngOnInit(): void {
    this.initializeDarkMode();
    this.setupSearchSubscription();
    this.loadAllReparaciones();
    this.loadCounts();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    this.obtenerRepuestos();

    // Si viene desde el dashboard con query param, abrir el popup automáticamente
    this.route.queryParamMap.subscribe(params => {
      const openAdd = params.get('openAdd');
      if (openAdd === '1') {
        // Limpiar el query param de la URL después de abrir
        setTimeout(() => {
          this.abrirAgregarReparacion();
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { openAdd: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }, 0);
      }

      // Si viene q=#ID, prefijar el buscador por número de reparación
      const q = params.get('q');
      if (q && q.startsWith('#')) {
        this.searchTerm = q.substring(1);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchSubscription(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterReparaciones();
    });
  }

  private loadAllReparaciones(): void {
    // Optimización: paginar en backend; por defecto solo "En taller"
    const estado = this.estadoFiltro === 'Todos' ? undefined : this.estadoFiltro;
    const nombre = (this.nombreCliente || '').trim() || undefined;
    this.repairsService.getReparacionesActivas(0, this.pageSize, nombre, estado).subscribe(
      (page) => {
        const content = (page && page.content) ? page.content : [];
        this.allReparaciones = content;
        this.totalPages = (page && page.totalPages) ? page.totalPages : 1;
        this.currentPage = (page && page.number) ? page.number : 0;
        this.reparaciones = content;
      },
      (error) => {
        console.error('Error al obtener reparaciones:', error);
      }
    );
  }

  // Cargar contadores globales por estado usando totalElements del backend
  private loadCounts(): void {
    const estados = ['En taller', 'Finalizada', 'Entregada'];
    const requests = estados.map(estado => this.repairsService.getReparacionesActivas(0, 1, undefined, estado));
    forkJoin(requests).subscribe({
      next: ([enTallerPage, finalizadasPage, entregadasPage]) => {
        this.totalEnTallerCount = (enTallerPage && typeof enTallerPage.totalElements === 'number') ? enTallerPage.totalElements : 0;
        this.totalFinalizadasCount = (finalizadasPage && typeof finalizadasPage.totalElements === 'number') ? finalizadasPage.totalElements : 0;
        this.totalEntregadasCount = (entregadasPage && typeof entregadasPage.totalElements === 'number') ? entregadasPage.totalElements : 0;
      },
      error: (err) => {
        console.error('Error al cargar contadores de reparaciones:', err);
        this.totalEnTallerCount = 0;
        this.totalFinalizadasCount = 0;
        this.totalEntregadasCount = 0;
      }
    });
  }

  private filterReparaciones(): void { this.loadAllReparaciones(); }

  onSearchInput(event: any): void {
    const searchValue = event.target.value || '';
    this.nombreCliente = searchValue;
    this.currentPage = 0;
    this.searchSubject.next(searchValue);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadAllReparaciones();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Consulta la página pedida
    const estado = this.estadoFiltro === 'Todos' ? undefined : this.estadoFiltro;
    const nombre = (this.nombreCliente || '').trim() || undefined;
    this.repairsService.getReparacionesActivas(page, this.pageSize, nombre, estado).subscribe(
      (pageData) => {
        this.reparaciones = (pageData && pageData.content) ? pageData.content : [];
        this.totalPages = (pageData && pageData.totalPages) ? pageData.totalPages : 1;
      }
    );
  }

  abrirAgregarReparacion(): void {
    const dialogRef = this.dialog.open(AddRepairComponent, {
      width: '900px',
      panelClass: 'app-dialog',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.refresh) {
        this.currentPage = 0;
        this.loadAllReparaciones();
        this.loadCounts();
        this.isRepairSuccess = true;
        this.repairMessage = 'Reparación agregada exitosamente';
        this.clearRepairMessage();
      }
    });
  }

  abrirModificarReparacion(reparacion: any): void {
    const dialogRef = this.dialog.open(ModifyRepairComponent, {
      width: '900px',
      panelClass: 'app-dialog',
      disableClose: true,
      data: { id: reparacion.id },
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadAllReparaciones();
      this.loadCounts();
    });
  }

  desactivarReparacion(reparacion: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repairsService
          .desactivarReparacion(reparacion)
          .pipe(
            tap(() => {
              console.log('Reparacion desactivada exitosamente');
              this.loadAllReparaciones();
              this.loadCounts();
              this.isRepairSuccess = true;
              this.repairMessage = 'Reparación desactivada exitosamente';
              this.clearRepairMessage();
            }),
            catchError((error) => {
              console.error('Error al desactivar reparacion:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  eliminarReparacion(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repairsService.eliminarReparacion(id).subscribe(
          () => {
            this.currentPage = 0;
            this.loadAllReparaciones();
            this.loadCounts();
            this.isRepairSuccess = true;
            this.repairMessage = 'Reparación eliminada exitosamente';
            this.clearRepairMessage();
          },
          (error) => {
            console.error('Error al eliminar reparacion', error);
            this.isRepairSuccess = false;
            this.repairMessage = 'Error al eliminar la reparación';
            this.clearRepairMessage();
          }
        );
      }
    });
  }

  seleccionaReparacion(reparacion: any): void {
    this.reparacionSeleccionada = { ...reparacion };
  }

  obtenerClientes(): void {
    this.clientsService.getAllClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.tecnicsService.getAllTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerRepuestos(): void {
    this.repuestosService.getRepuestosActivosParaFormularios().subscribe(
      (data) => {
        this.repuestos = data.content;
      },
      (error) => {
        console.error('Error al obtener los repuestos:', error);
      }
    );
  }

  getRepuestosConStock(): any[] {
    return this.repuestos.filter((repuesto) => repuesto.stock > 0);
  }

  obtenerEquipos(): void {
    this.equipoService.getAllEquipos().subscribe(
      (data) => {
        this.equipos = data;
      },
      (error) => {
        console.error('Error al obtener los equipos:', error);
      }
    );
  }

  verDetallesReparacion(reparacion: any): void {
    this.reparacionSeleccionada = { ...reparacion };
    const modalElement = document.getElementById('verDetallesModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('verDetallesModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  }

  agregarNotaReparacion(): void {
    const nuevaNota = {
      fecha: this.reparacion.fechaIngreso,
      informe: this.reparacion.notasreparacion.informe,
    };

    for (let i = 0; i < this.repuestos.length; i++) {
      if (this.repuestos[i].id == this.reparacion.repuesto.id) {
        const repuestoModificado = {
          id: this.repuestos[i].id,
          numeroDeParte: this.repuestos[i].numeroDeParte,
          descripcion: this.repuestos[i].descripcion,
          precioCosto: this.repuestos[i].precioCosto,
          precioVenta: this.repuestos[i].precioVenta,
          stock: this.repuestos[i].stock - 1,
        };
        this.modificarRepuesto(repuestoModificado);

        let yaExiste = false;
        for (let k = 0; k < this.reparacionSeleccionada.repuesto.length; k++) {
          if (
            this.reparacionSeleccionada.repuesto[k].id ==
            this.reparacion.repuesto.id
          ) {
            yaExiste = true;
          }
        }
        if (!yaExiste) {
          this.reparacionSeleccionada.repuesto.push(repuestoModificado);
        }
      }
    }

    this.reparacionSeleccionada.notasreparacion.push(nuevaNota);

    this.repairsService
      .modificarReparacion(this.reparacionSeleccionada)
      .subscribe(
        () => {
          console.log('Nota agregada correctamente');
          this.loadAllReparaciones();
          this.isRepairSuccess = true;
          this.repairMessage = 'Nota agregada exitosamente';
          this.clearRepairMessage();
          if (this.modalCloseUpdate) {
            this.modalCloseUpdate.nativeElement.click();
          }
        },
        (error) => {
          this.errorAgregarNotaReparacion = true;
          this.isRepairSuccess = false;
          this.repairMessage = 'Error al agregar la nota';
          this.clearRepairMessage();
          console.error('Error al agregar nota a la reparación', error);
        }
      );
  }

  modificarRepuesto(repuestoModificado: any): void {
    this.repuestosService.modificarRepuesto(repuestoModificado).subscribe(
      () => {
        console.log('Repuesto modificado correctamente');
      },
      (error) => {
        console.error('Error al modificar repuesto', error);
      }
    );
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('es-UY', {
      month: 'long',
      day: 'numeric',
    });
  }

  formatDate2(date: Date): string {
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate());
    return adjustedDate.toLocaleDateString('es-UY', {
      month: 'long',
      day: 'numeric',
    });
  }

  abrirModalAgregarNota(reparacion: any): void {
    this.reparacionSeleccionada = { ...reparacion };
    this.reparacion.fechaIngreso = new Date().toISOString().split('T')[0];
    this.reparacion.notasreparacion.informe = '';

    const modalElement = document.getElementById('agregarNotaModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  abrirFinalizarReparacionModal(reparacion: any): void {
    this.reparacionSeleccionada = { ...reparacion };
    if (!this.reparacionSeleccionada.cliente.puntos || this.reparacionSeleccionada.cliente.puntos <= 0) {
      this.usarPuntos = false;
    }
    const modalElement = document.getElementById('finalizarReparacionModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  async agregarQRAlPDF(pdf: any, y: number): Promise<number> {
    try {
      const qrUrl = 'https://app.oneupsoluciones.com/seguimiento';
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 100,
        margin: 1,
      });

      const qrX = 5;
      const qrWidth = 30;
      const qrHeight = 30;
      pdf.addImage(qrDataUrl, 'PNG', qrX, y, qrWidth, qrHeight);

      y += qrHeight + 2;
      pdf.setFontSize(6);
      pdf.setFont('Helvetica', 'normal');
      const textoExplicativo = [
        'Escanea este código QR para acceder a',
        'nuestro portal de seguimiento donde',
        'podrás ver el estado de tu reparación,',
        'tus puntos acumulados y más.'
      ];

      const textX = 5;
      textoExplicativo.forEach((linea, index) => {
        pdf.text(linea, textX, y + (index * 3));
      });

      y += (textoExplicativo.length * 3) + 2;
      pdf.setFontSize(5);
      pdf.setFont('Helvetica', 'bold');
      const urlText = 'URL: ' + qrUrl;
      pdf.text(urlText, textX, y);

      return y + 3;
    } catch (err) {
      console.error('Error al generar el código QR:', err);
      return y;
    }
  }

  async generarPDFPrueba2(reparacion: any): Promise<void> {
    const lineHeight = 5;
    const maxWidth = 25;
    let y = 10;
    let totalHeight = 0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [163, totalHeight > 800 ? totalHeight : 800],
    });

    pdf.setFontSize(8);

    totalHeight += 4 * lineHeight + 2;
    totalHeight += 8 * lineHeight + 4;
    const fallaLines = pdf.splitTextToSize(reparacion.falla, maxWidth);
    totalHeight += fallaLines.length * lineHeight + 2;
    const informeLines = pdf.splitTextToSize(
      (reparacion.notasreparacion?.length
        ? reparacion.notasreparacion[reparacion.notasreparacion.length - 1]
            .informe
        : '---') || '---',
      maxWidth
    );
    totalHeight += informeLines.length * lineHeight + 2;
    totalHeight += 4 * lineHeight + 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Oneup Soluciones', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('Leandro Gomez 1540', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('Paysandu', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('29992 - 091896948', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('¡Gracias por elegirnos!', 29, y, { align: 'center' });
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'normal');

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Orden:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.id}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Ingreso:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate(reparacion.fechaIngreso)}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('CS:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.codigoSeguimiento}`, 15, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Cliente:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Nom:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.nombre}`, 15, y);
    y += lineHeight;

    // Dirección removida para todos los tickets

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Cel:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.telefono}`, 15, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Equipo:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Tipo eq:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.tipo_equipo.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Marca:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.marca.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Modelo:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.modelo.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Falla:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(fallaLines, 15, y);
    y += fallaLines.length * lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Informe:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(informeLines, 15, y);
    y += informeLines.length * lineHeight;
    y += 2;

    // Mostrar secciones solo si la reparación está ENTREGADA
    const isEntregadaPrint = String(reparacion.estado || '').toLowerCase() === 'entregada';
    if (isEntregadaPrint) {
      // Fecha de entrega
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Fecha entrega:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      const fechaEnt = reparacion.fechaEntrega ? new Date(reparacion.fechaEntrega) : new Date();
      pdf.text(`${this.formatDate2(fechaEnt)}`, 30, y);
      y += lineHeight;
      y += 2;

      // Costos detallados removidos para todos los tickets; se mostrará solo el total más abajo

      if (this.usarPuntos && this.puntosAUsar > 0) {
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Puntos usados:', 2, y);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(`${this.puntosAUsar}`, 25, y);
        y += lineHeight;

        pdf.setFont('Helvetica', 'bold');
        pdf.text('Descuento:', 2, y);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(this.formatMoney(this.puntosAUsar * this.valorPunto), 25, y);
        y += lineHeight;
      }

      // Totales y puntos
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Costo total:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(this.formatMoney(this.getTotal()), 25, y);
      y += lineHeight;

      pdf.setFont('Helvetica', 'bold');
      pdf.text('Puntos gen:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      const puntosGeneradosImp = this.calcularPuntosDesdePesos((reparacion.manoDeObra || 0) + (reparacion.entrega || 0));
      pdf.text(`${puntosGeneradosImp}`, 25, y);
      y += lineHeight;

      pdf.setFont('Helvetica', 'bold');
      pdf.text('Total puntos:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      const totalPuntosImp = reparacion.cliente.puntos || 0;
      pdf.text(`${totalPuntosImp} ($${totalPuntosImp * 5})`, 25, y);
      y += lineHeight;
    }

    pdf.setFontSize(6);
    pdf.setFont('Helvetica', 'italic');
    const mensajePuntos = '¡Tus puntos tienen valor! Descuentos de hasta 100%';
    const mensajePuntos2 = 'en tu próxima reparación o accesorios seleccionados.';
    pdf.text(mensajePuntos, 2, y);
    y += lineHeight - 1;
    pdf.text(mensajePuntos2, 2, y);
    y += lineHeight;
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Firma:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text('_________________________', 20, y);
    y += lineHeight;
    y += 2;

    y = await this.agregarQRAlPDF(pdf, y);

    pdf.save(
      `${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre} ${reparacion.cliente.nombre}.pdf`
    );
  }

  async generarPDFPrueba2SinNotaFinal(reparacion: any): Promise<void> {
    const lineHeight = 5;
    const maxWidth = 25;
    let y = 10;
    let totalHeight = 0;

    const formatMoney = (amount: number): string => {
      return `$ ${amount.toFixed(2)}`;
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [163, totalHeight > 800 ? totalHeight : 800],
    });

    pdf.setFontSize(8);

    totalHeight += 4 * lineHeight + 2;
    totalHeight += 8 * lineHeight + 4;
    const fallaLines = pdf.splitTextToSize(reparacion.falla, maxWidth);
    totalHeight += fallaLines.length * lineHeight + 2;
    const informeLines = pdf.splitTextToSize(
      (reparacion.notasreparacion?.length
        ? reparacion.notasreparacion[reparacion.notasreparacion.length - 1]
            .informe
        : '---') || '---',
      maxWidth
    );
    totalHeight += informeLines.length * lineHeight + 2;
    totalHeight += 4 * lineHeight + 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Oneup Soluciones', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('Leandro Gomez 1540', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('Paysandu', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('29992 - 091896948', 29, y, { align: 'center' });
    y += lineHeight;
    pdf.text('¡Gracias por elegirnos!', 29, y, { align: 'center' });
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'normal');

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Orden:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.id}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Ingreso:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate(reparacion.fechaIngreso)}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('CS:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.codigoSeguimiento}`, 15, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Cliente:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Nom:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Cel:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.telefono}`, 15, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Equipo:', 2, y);
    y += lineHeight;

    // NS removido del ticket de finalización

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Tipo eq:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.tipo_equipo.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Marca:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.marca.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Modelo:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.modelo.nombre}`, 15, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Falla:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(fallaLines, 15, y);
    y += fallaLines.length * lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Informe:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(informeLines, 15, y);
    y += informeLines.length * lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Fecha entrega:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate2(new Date())}`, 30, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costos:', 2, y);
    y += lineHeight;

    // Costos detallados removidos; se mostrará solo el total

    if (this.usarPuntos && this.puntosAUsar > 0) {
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Puntos usados:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`${this.puntosAUsar}`, 25, y);
      y += lineHeight;

      pdf.setFont('Helvetica', 'bold');
      pdf.text('Descuento:', 2, y);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(formatMoney(this.puntosAUsar * this.valorPunto), 25, y);
      y += lineHeight;
    }

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo total:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(formatMoney(this.getTotal()), 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Puntos gen:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    const puntosGenerados = reparacion.estado === 'Entregada' ? 
      this.calcularPuntosDesdePesos(reparacion.manoDeObra + reparacion.entrega) : 0;
    pdf.text(`${puntosGenerados}`, 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Total puntos:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    const totalPuntos = reparacion.cliente.puntos || 0;
    pdf.text(`${totalPuntos} ($${totalPuntos * 5})`, 25, y);
    y += lineHeight;

    pdf.setFontSize(6);
    pdf.setFont('Helvetica', 'italic');
    const mensajePuntos = '¡Tus puntos tienen valor! Descuentos de hasta 100%';
    const mensajePuntos2 = 'en tu próxima reparación o accesorios seleccionados.';
    pdf.text(mensajePuntos, 2, y);
    y += lineHeight - 1;
    pdf.text(mensajePuntos2, 2, y);
    y += lineHeight;
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Firma:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text('_________________________', 20, y);
    y += lineHeight;
    y += 2;

    y = await this.agregarQRAlPDF(pdf, y);

    pdf.save(
      `${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre} ${reparacion.cliente.nombre}.pdf`
    );
  }

  getTotal(): number {
    const manoDeObra = this.reparacionSeleccionada.manoDeObra || 0;
    const entrega = this.reparacionSeleccionada.entrega || 0;
    const descuentoPuntos = this.usarPuntos ? this.pointsService.calculatePointsValue(this.puntosAUsar) : 0;
    return manoDeObra + entrega - descuentoPuntos;
  }

  getPuntosDisponibles(): number {
    return this.reparacionSeleccionada.cliente?.puntos || 0;
  }

  calcularMaximoPuntosAUsar(): number {
    const total = (this.reparacionSeleccionada.manoDeObra || 0) + (this.reparacionSeleccionada.entrega || 0);
    return this.pointsService.calculateMaxPointsToUse(total, this.getPuntosDisponibles());
  }

  superaMaximoDescuento(): boolean {
    const total = (this.reparacionSeleccionada.manoDeObra || 0) + (this.reparacionSeleccionada.entrega || 0);
    return this.pointsService.exceedsMaxDiscount(total, this.puntosAUsar);
  }

  onUsarPuntosChange(): void {
    if (!this.usarPuntos) {
      this.puntosAUsar = 0;
    } else {
      this.puntosAUsar = this.calcularMaximoPuntosAUsar();
    }
  }

  onPuntosAUsarChange(): void {
    const maximoPuntos = this.calcularMaximoPuntosAUsar();
    if (this.puntosAUsar > maximoPuntos) {
      this.puntosAUsar = maximoPuntos;
    }
    if (this.puntosAUsar < 0) {
      this.puntosAUsar = 0;
    }
  }

  terminarReparacion(): void {
    if (!this.reparacionSeleccionada.notasreparacion.informe || 
        this.reparacionSeleccionada.notasreparacion.informe.trim() === '') {
      return;
    }

    const nuevaNota = {
      fecha: this.reparacionSeleccionada.fechaIngreso,
      informe: this.reparacionSeleccionada.notasreparacion.informe,
    };
    this.reparacionSeleccionada.notasreparacion.push(nuevaNota);
    this.reparacionSeleccionada.estado = 'Entregada';

    if (this.usarPuntos && this.puntosAUsar > 0) {
      this.reparacionSeleccionada.descuentoPuntos = this.pointsService.calculatePointsValue(this.puntosAUsar);
    }

    const totalPesos = this.reparacionSeleccionada.manoDeObra + this.reparacionSeleccionada.entrega;
    const puntosGanados = this.calcularPuntosDesdePesos(totalPesos);

    this.reparacionSeleccionada.fechaEntrega = new Date().toISOString();

    const clienteActualizado = { ...this.reparacionSeleccionada.cliente };
    clienteActualizado.puntos = (clienteActualizado.puntos || 0) - (this.usarPuntos ? this.puntosAUsar : 0) + puntosGanados;

    this.reparacionSeleccionada.cliente.puntos = clienteActualizado.puntos;

    this.clientsService.modificarCliente(clienteActualizado).pipe(
      tap(() => {
        console.log('Cliente actualizado con nuevos puntos:', clienteActualizado.puntos);
        
        this.repairsService.modificarReparacion(this.reparacionSeleccionada).pipe(
          tap(() => {
            console.log('Reparación finalizada exitosamente');
            this.loadAllReparaciones();
            this.isRepairSuccess = true;
            this.repairMessage = 'Reparación finalizada exitosamente';
            this.clearRepairMessage();
            setTimeout(() => {
              this.generarPDFPrueba2SinNotaFinal(this.reparacionSeleccionada);
              this.modalCloseAdd.nativeElement.click();
            }, 500);
          }),
          catchError((error) => {
            console.error('Error al finalizar reparación:', error);
            this.errorModificarReparacion = true;
            setTimeout(() => {
              this.errorModificarReparacion = false;
            }, 5000);
            return of(error);
          })
        ).subscribe();
      }),
      catchError((error) => {
        console.error('Error al actualizar puntos del cliente:', error);
        return of(error);
      })
    ).subscribe();
  }

  calcularPuntosDesdePesos(pesos: number): number {
    return this.pointsService.calculatePointsFromAmount(pesos);
  }

  formatMoney(amount: number): string {
    return `$ ${amount.toFixed(2)}`;
  }

  // Cost helpers for details modal
  getCostoTotal(reparacion: any): number {
    const mo = Number(reparacion?.manoDeObra || 0);
    const rep = Number(reparacion?.entrega || 0);
    return mo + rep;
  }

  getTotalFinal(reparacion: any): number {
    const descuento = Number(reparacion?.descuentoPuntos || 0);
    return Math.max(0, this.getCostoTotal(reparacion) - descuento);
  }

  getPendingCount(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'En taller').length;
  }

  getInProgressCount(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'Finalizada').length;
  }

  getCompletedCount(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'Entregada').length;
  }

  getTotalEnTaller(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'En taller').length;
  }

  getTotalFinalizadas(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'Finalizada').length;
  }

  getTotalEntregadas(): number {
    return this.allReparaciones.filter(repair => repair.estado === 'Entregada').length;
  }

  // Funcionalidad de modo oscuro
  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('repairsDarkMode', this.darkMode.toString());
  }

  initializeDarkMode(): void {
    const savedDarkMode = localStorage.getItem('repairsDarkMode');
    if (savedDarkMode !== null) {
      this.darkMode = savedDarkMode === 'true';
    }
  }

  private clearRepairMessage(): void {
    setTimeout(() => {
      this.repairMessage = null;
    }, 5000);
  }
}
