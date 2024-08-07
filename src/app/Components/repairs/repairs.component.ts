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

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.css'],
})
export class RepairsComponent implements OnInit {
  @ViewChild('modalCloseUpdate', { static: false })
  modalCloseUpdate!: ElementRef;
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

  constructor(
    private repairsService: RepairsService,
    private tecnicsService: TecnicsService,
    private clientsService: ClientsService,
    private equipoService: EquipoService,
    private repuestosService: RepuestosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerReparaciones();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    this.obtenerRepuestos();
  }

  obtenerReparaciones(): void {
    let estadoParam = this.estadoFiltro !== 'Todos' ? this.estadoFiltro : null;
    this.repairsService
      .getReparaciones(
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

  onPageChange(page: number): void {
    this.currentPage = page;
    this.obtenerReparaciones();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.obtenerReparaciones();
  }

  eliminarReparacion(id: number): void {
    this.repairsService.eliminarReparacion(id).subscribe(
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
        console.log(this.tecnicos);
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerRepuestos(): void {
    this.repuestosService.getAllRepuestos().subscribe(
      (data) => {
        this.repuestos = data;
      },
      (error) => {
        console.error('Error al obtener los repuestos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.equipoService.getAllEquipos().subscribe(
      (data) => {
        this.equipos = data;
        console.log(this.equipos);
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
        console.log(repuestoModificado);
        this.modificarRepuesto(repuestoModificado);

        //SI EL REPUESTO YA ESTA AGREGADO EN LA REPARACION NO SE AGREGA DE NUEVO!
        let yaExiste = false;
        for (let k = 0; k < this.reparacionSeleccionada.repuesto.length; k++) {
          if (
            this.reparacionSeleccionada.repuesto[k].id ==
            this.reparacion.repuesto.id
          ) {
            console.log('EL REPUESTO YA EXISTE EN LA REPARACION');
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

  setFechaActual(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    this.nuevaReparacion.fechaIngreso = currentDate;
    this.reparacion.fechaIngreso = currentDate;
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

  //Imprimir / descargar pdf
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
}
