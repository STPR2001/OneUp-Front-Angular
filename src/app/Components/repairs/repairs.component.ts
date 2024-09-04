import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RepairsService } from 'src/app/services/repairs.service';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.css'],
})
export class RepairsComponent implements OnInit {
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
  estados: string[] = ['En taller', 'Finalizada', 'Entregada'];
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

  constructor(
    private repairsService: RepairsService,
    private tecnicsService: TecnicsService,
    private clientsService: ClientsService,
    private equipoService: EquipoService,
    private repuestosService: RepuestosService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    //this.setFechaActual();
    this.obtenerReparaciones();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    this.obtenerRepuestos();
  }

  obtenerReparaciones(): void {
    let estadoParam = this.estadoFiltro !== 'Todos' ? this.estadoFiltro : null;
    this.repairsService
      .getReparacionesActivas(
        this.currentPage,
        this.pageSize,
        this.nombreCliente,
        estadoParam ?? ''
      )
      .subscribe(
        (data) => {
          this.reparaciones = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener reparaciones:', error);
        }
      );
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
              this.obtenerReparaciones();
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

  onPageChange(page: number): void {
    this.currentPage = page;
    this.obtenerReparaciones();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.obtenerReparaciones();
  }

  eliminarReparacion(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repairsService.eliminarReparacion(id).subscribe(
          () => {
            this.obtenerReparaciones();
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

        //SI EL REPUESTO YA ESTA AGREGADO EN LA REPARACION NO SE AGREGA DE NUEVO!
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
          this.obtenerReparaciones();
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

  //  setFechaActual(): void {
  //    const currentDate = new Date().toISOString().split('T')[0];
  //    this.nuevaReparacion.fechaIngreso = currentDate;
  //    this.reparacion.fechaIngreso = currentDate;
  //  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + 1); // Sumar un día
    return date.toLocaleDateString('es-UY', {
      //year: 'numeric',
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

    const modalElement = document.getElementById('finalizarReparacionModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  //Imprimir / descargar pdf

  /*
  generarPDF(reparacion: any): void {
    const formatFecha = (fecha: string) => {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return new Date(fecha).toLocaleDateString('es-ES', options);
    };

    const pdfContent = `
    <div style="margin-left: 20px; font-size: 40px;">
      <h1 style="font-size: 70px; text-align:center;">Detalles de Reparación</h1>
      <p><strong>Orden:</strong> ${reparacion.id}</p>
      <p><strong>Fecha:</strong> ${formatFecha(reparacion.fechaIngreso)}</p>
      <br/>
      <p><strong>Cliente</strong></p>
      <p><strong>Nombre:</strong> ${reparacion.cliente.nombre}</p>
      <p><strong>Dirección:</strong> ${reparacion.cliente.direccion}</p>
      <p><strong>Teléfono:</strong> ${reparacion.cliente.telefono}</p>
      <p><strong>Email:</strong> ${reparacion.cliente.email}</p>
      <br/>
      <p><strong>Equipo</strong></p>
      <p><strong>Tipo equipo:</strong> ${
        reparacion.equipo.tipo_equipo.nombre
      }</p>
      <p><strong>Marca:</strong> ${reparacion.equipo.marca.nombre}</p>
      <p><strong>Modelo:</strong> ${reparacion.equipo.modelo.nombre}</p>
      <p><strong>Número de serie</strong> ${reparacion.equipo.numeroSerie}</p>
      <br/>
      <p><strong>Falla:</strong> ${reparacion.falla}</p>
      <p><strong>Código de seguimiento:</strong> ${
        reparacion.codigoSeguimiento
      }</p>
    </div>
  `;

    const pdfElement = document.createElement('div');
    pdfElement.innerHTML = pdfContent;
    document.body.appendChild(pdfElement);

    html2canvas(pdfElement).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre} ${reparacion.cliente.nombre}.pdf`
      );

      document.body.removeChild(pdfElement);
    });
  }
    */

  /*
  generarPDF(reparacion: any): void {
    const pdfContent = `
  <div style="font-size: 12px; width: 100mm; padding: 10px";>
    <h2 style="font-size: 12px; text-align:center; margin: 0;"><strong>Oneup Soluciones</strong></h2>
    <p style="text-align: center; margin: 0;"><strong>Leandro Gómez 1540, Paysandú</strong></p>
    <p style="text-align: center; margin: 0;"><strong>29992 - 091896948</strong></p>
    <hr/>
    <p><strong>Orden:</strong> ${reparacion.id}</p>
    <p><strong>Fecha:</strong> ${this.formatDate(reparacion.fechaIngreso)}</p>
    <hr/>
    <p><strong>Cliente:</strong></p>
    <p><strong>Nom:</strong> ${reparacion.cliente.nombre}</p>
    <p><strong>Dir:</strong> ${reparacion.cliente.direccion || '---'}</p>
    <p><strong>Cel:</strong> ${reparacion.cliente.telefono}</p>
    <hr/>
    <p><strong>Equipo:</strong></p>
    <p><strong>NS:</strong> ${reparacion.equipo.numeroSerie}</p>
    <p><strong>Tipo eq:</strong> ${reparacion.equipo.tipo_equipo.nombre}</p>
    <p><strong>Marca:</strong> ${reparacion.equipo.marca.nombre}</p>
    <p><strong>Modelo:</strong> ${reparacion.equipo.modelo.nombre}</p>
    <p><strong>Falla:</strong> ${reparacion.falla}</p>
    <hr/>
    <p><strong>Informe:</strong></p>
    <p>${reparacion.informe || '---'}</p>
    <hr/>
   <p><strong>Fecha entrega:</strong> ${this.formatDate2(new Date())}</p>
    <hr/>
    <p><strong>Costos:</strong></p>
    <p><strong>Costo MO:</strong> ${
      reparacion.costoMO?.toFixed(2) || '0.00'
    }</p>
    <p><strong>Costo reps.:</strong> ${
      reparacion.costoRepuestos?.toFixed(2) || '0.00'
    }</p>
    <p><strong>Costo total:</strong> ${
      (reparacion.costoMO + reparacion.costoRepuestos).toFixed(2) || '0.00'
    }</p>
    <hr/>
    <p><strong>Firma:</strong> _________________________</p>
  </div>
  `;

    const pdfElement = document.createElement('div');
    pdfElement.innerHTML = pdfContent;
    document.body.appendChild(pdfElement);

    html2canvas(pdfElement, { scale: 3 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [163, 460],
      });

      const pdfWidth = 250;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre} ${reparacion.cliente.nombre}.pdf`
      );

      document.body.removeChild(pdfElement);
    });
  }
*/
  generarPDFPrueba2(reparacion: any): void {
    const lineHeight = 5;
    const maxWidth = 25;
    let y = 10;
    let totalHeight = 0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [163, totalHeight > 800 ? totalHeight : 800], // Altura dinámica o mínima
    });

    pdf.setFontSize(8);

    // Calcular la altura necesaria antes de crear el PDF
    totalHeight += 4 * lineHeight + 2; // Altura para el encabezado
    totalHeight += 8 * lineHeight + 4; // Altura para la información del cliente y equipo
    const fallaLines = pdf.splitTextToSize(reparacion.falla, maxWidth);
    totalHeight += fallaLines.length * lineHeight + 2; // Altura para la falla
    const informeLines = pdf.splitTextToSize(
      (reparacion.notasreparacion?.length
        ? reparacion.notasreparacion[reparacion.notasreparacion.length - 1]
            .informe
        : '---') || '---',
      maxWidth
    );
    const notaFinal = pdf.splitTextToSize(
      'Conserve este comprobante y preséntelo al recoger su equipo. No nos hacemos responsables después de 60 días, ni por chips o tarjetas de memoria. Los teléfonos mojados no tienen garantía.',
      maxWidth
    );
    totalHeight += informeLines.length * lineHeight + 2; // Altura para el informe
    totalHeight += 4 * lineHeight + 2; // Altura para la fecha de entrega, costos y firma

    // Encabezado
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

    // Información de la reparación
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

    // Información del cliente
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

    // Información del equipo
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

    // Informe   AQUI ACCEDE A LA ULTIMA NOTA DE REAPRACION
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Informe:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(informeLines, 15, y);
    y += informeLines.length * lineHeight;
    y += 2;

    // Fecha de entrega
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Fecha entrega:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${this.formatDate2(new Date())}`, 30, y);
    y += lineHeight;
    y += 2;

    // Costos
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costos:', 2, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo MO:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.manoDeObra}`, 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo reps.:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.entrega}`, 25, y);
    y += lineHeight;

    pdf.setFont('Helvetica', 'bold');
    pdf.text('Costo total:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(`${reparacion.manoDeObra + reparacion.entrega}`, 25, y);
    y += lineHeight;
    y += 2;

    // Firma
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Firma:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text('_________________________', 20, y);
    y += lineHeight;
    y += 2;

    // Aviso
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Nota:', 2, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(notaFinal, 20, y);
    y += lineHeight;
    y += 2;

    // Guardar PDF
    pdf.save(
      `${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre} ${reparacion.cliente.nombre}.pdf`
    );
  }

  // reparacion.component.ts

  getTotal(): number {
    const manoDeObra = this.reparacionSeleccionada.manoDeObra || 0;
    const entrega = this.reparacionSeleccionada.entrega || 0;
    return manoDeObra + entrega;
  }

  terminarReparacion(): void {
    const nuevaNota = {
      fecha: this.reparacionSeleccionada.fechaIngreso,
      informe: this.reparacionSeleccionada.notasreparacion.informe,
    };
    this.reparacionSeleccionada.notasreparacion.push(nuevaNota);
    this.reparacionSeleccionada.estado = 'Entregada';
    this.repairsService
      .modificarReparacion(this.reparacionSeleccionada)
      .pipe(
        tap(() => {
          console.log('Reparación modificada exitosamente');
          this.obtenerReparaciones();
          this.generarPDFPrueba2(this.reparacionSeleccionada);
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al finalizar reparación:', error);
          this.errorModificarReparacion = true;
          setTimeout(() => {
            this.errorModificarReparacion = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
}
