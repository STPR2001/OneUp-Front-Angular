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
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private EquipoService: EquipoService,
    private RepuestosService: RepuestosService,
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
    this.RepairsService.getReparaciones().subscribe(
      (data) => {
        this.reparaciones = data;
        console.log(this.reparaciones);
      },
      (error) => {
        console.error('Error al obtener reparaciones:', error);
      }
    );
  }

  eliminarReparacion(id: number): void {
    this.RepairsService.eliminarReparacion(id).subscribe(
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
    this.ClientsService.getClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.TecnicsService.getTecnicos().subscribe(
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
    this.RepuestosService.getRepuestos().subscribe(
      (data) => {
        this.repuestos = data;
        console.log(this.repuestos);
      },
      (error) => {
        console.error('Error al obtener los repuestos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.EquipoService.getEquipos().subscribe(
      (data) => {
        this.equipos = data;
        console.log(this.equipos);
      },
      (error) => {
        console.error('Error al obtener los equipos:', error);
      }
    );
  }

  get filteredReparaciones() {
    return this.reparaciones.filter((reparacion) =>
      reparacion.cliente.nombre
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredReparacionesForStatus() {
    return this.reparaciones.filter((reparacion) => {
      const matchesCliente = reparacion.cliente.nombre
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());
      const matchesEstado =
        this.estadoFiltro === 'Todos' ||
        reparacion.estado === this.estadoFiltro;
      return matchesCliente && matchesEstado;
    });
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

        //SI EL REPUESTO YA ESTA AGREGADO EN LA REPARACION NO SE AGREGARSE DE NUEVO!
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

    this.RepairsService.modificarReparacion(
      this.reparacionSeleccionada
    ).subscribe(
      () => {
        console.log('Nota agregada correctamente');
        this.obtenerReparaciones();
        if (this.modalCloseUpdate) {
          this.modalCloseUpdate.nativeElement.click();
        }
      },
      (error) => {
        this.errorAgregarNotaReparacion = true;
        console.error('Error al agregar nota de reparación', error);
      }
    );
  }

  modificarRepuesto(repuestoModificado: any): void {
    this.RepuestosService.modificarRepuesto(repuestoModificado)
      .pipe(
        tap(() => {
          this.obtenerRepuestos();
          console.log('Repuesto modificado exitosamente');
        }),
        catchError((error) => {
          console.error('Error al modificar repuesto:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  setFechaActual(): void {
    const fechaActual = new Date().toISOString().split('T')[0];
    this.nuevaReparacion.fechaIngreso = fechaActual;
    this.reparacion.fechaIngreso = fechaActual;
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
    const pdfContent = `
    <div style="margin-left: 20px; font-size: 16px;">
      <h1>Detalles de Reparación</h1>
      <p><strong>Cliente:</strong> ${reparacion.cliente.nombre}</p>
      <p><strong>Equipo:</strong> ${reparacion.equipo.marca.nombre} ${reparacion.equipo.modelo.nombre}</p>
      <p><strong>Falla:</strong> ${reparacion.falla}</p>
      <p><strong>Técnico:</strong> ${reparacion.tecnico.nombre}</p>
      <p><strong>Código de seguimiento:</strong> ${reparacion.codigoSeguimiento}</p>
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
