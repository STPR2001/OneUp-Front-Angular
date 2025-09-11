import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { RepairsService } from 'src/app/services/repairs.service';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
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
  repuestos: any[] = [];
  equipos: any[] = [];
  clientes: any[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  
  nombreCliente?: string;
  usarPuntos: boolean = false;
  puntosAUsar: number = 0;
  valorPunto: number = 5;
  viewMode: 'cards' | 'table' = 'cards';
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
  estadoFiltro: string = 'Todos';
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
    public dialog: MatDialog,
    private pointsService: PointsService
  ) {
    this.valorPunto = this.pointsService.calculatePointsValue(1);
  }

  ngOnInit(): void {
    this.initializeDarkMode();
    this.setupSearchSubscription();
    this.loadAllReparaciones();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    this.obtenerRepuestos();
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
    this.repairsService.getReparacionesActivas(0, 1000, '', '').subscribe(
      (data) => {
        this.allReparaciones = data.content;
        this.filterReparaciones();
      },
      (error) => {
        console.error('Error al obtener reparaciones:', error);
      }
    );
  }

  private filterReparaciones(): void {
    let filtered = [...this.allReparaciones];
    
    const searchTerm = this.nombreCliente || '';
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(repair => 
        repair.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (this.estadoFiltro !== 'Todos') {
      filtered = filtered.filter(repair => repair.estado === this.estadoFiltro);
    }

    this.filteredReparaciones = filtered;
    
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.reparaciones = this.filteredReparaciones.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredReparaciones.length / this.pageSize);
  }

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
    this.filterReparaciones();
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
            this.loadAllReparaciones();
          },
          (error) => {
            console.error('Error al eliminar reparacion', error);
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
          if (this.modalCloseUpdate) {
            this.modalCloseUpdate.nativeElement.click();
          }
        },
        (error) => {
          this.errorAgregarNotaReparacion = true;
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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Dir:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.direccion || '---'}`, 15, y);
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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('NS:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.numeroSerie}`, 15, y);
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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Fecha entrega:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate2(new Date())}`, 30, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costos:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo MO:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`$ ${reparacion.manoDeObra}`, 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo reps.:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(this.formatMoney(reparacion.entrega || 0), 25, y);
    y += lineHeight;

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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo total:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`$ ${this.getTotal()}`, 25, y);
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
    pdf.text('Dir:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.cliente.direccion || '---'}`, 15, y);
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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('NS:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.equipo.numeroSerie}`, 15, y);
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

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Fecha entrega:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate2(new Date())}`, 30, y);
    y += lineHeight;
    y += 2;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costos:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo MO:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(formatMoney(reparacion.manoDeObra || 0), 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo reps.:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(formatMoney(reparacion.entrega || 0), 25, y);
    y += lineHeight;

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
    pdf.text(`$ ${this.getTotal()}`, 25, y);
    y += lineHeight;
    y += 2;

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
}
