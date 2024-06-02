import { Component, OnInit, ViewChild } from '@angular/core';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-repuestos',
  templateUrl: './repuestos.component.html',
  styleUrls: ['./repuestos.component.css']
})
export class RepuestosComponent implements OnInit {
  @ViewChild('agregarRepuestoModal') modalCloseAdd: any;
  @ViewChild('ModificarRepuestoModal') modalCloseUpdate: any;

  repuesto: any = {};
  errorModificarRepuesto = false;
  nuevoRepuesto: any = {};
  repuestos: any[] = [];
  repuestoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarRepuesto = false;

  constructor(private repuestosService: RepuestosService, private router: Router, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getRepuestos();
  }

  getRepuestos(): void {
    this.repuestosService.getRepuestos().subscribe(
      (data) => {
        this.repuestos = data;
      },
      (error) => {
        console.error('Error al obtener la lista de repuestos:', error);
      }
    );
  }

  seleccionarRepuesto(repuesto: any): void {
    this.repuestoSeleccionado = { ...repuesto };
  }

  navigateToUpdateRepuesto(id: string, nombre: string): void {
    this.router.navigateByUrl(`/repuestos/update`, { state: { nombre: nombre, id: id } });
  }

  eliminarRepuesto(id: number): void {
    this.repuestosService.eliminarRepuesto(id).subscribe(
      () => {
        this.getRepuestos();
      },
      (error) => {
        console.error('Error al eliminar repuesto:', error);
      }
    );
  }

  get filteredRepuestos() {
    return this.repuestos.filter((repuesto) =>
      repuesto
    );
  }

  agregarRepuesto(): void {
    this.repuestosService.agregarRepuesto(this.nuevoRepuesto).subscribe({
      next: (response) => {
        console.log(response);
        this.router.navigate(['/repuestos']);
        this.nuevoRepuesto = {};
        this.getRepuestos();
        this.modalCloseAdd.nativeElement.click();
      },
      error: (error) => {
        console.log('Error al agregar repuesto:', error);
        this.errorAgregarRepuesto = true;
        setTimeout(() => {
          this.errorAgregarRepuesto = false;
        }, 5000);
        return of(error);
      }
    }
    );
  }

  modificarRepuesto(): void {
    this.repuestosService.modificarRepuesto(this.repuesto).pipe(
      tap(() => {
        this.router.navigate(['/repuestos']);
        this.getRepuestos();
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
    ).subscribe();
  }
  abrirModalModificacion(repuestoId: string, repuestoNumeroDeParte: string, repuestoDescripcion: string, repuestoPrecioCosto: number, repuestoPrecioVenta: number, repuestoStock: number) {
    this.repuesto.id = repuestoId;
    this.repuesto.numeroDeParte = repuestoNumeroDeParte;
    this.repuesto.descripcion = repuestoDescripcion;
    this.repuesto.precioCosto = repuestoPrecioCosto;
    this.repuesto.precioVenta = repuestoPrecioVenta;
    this.repuesto.stock = repuestoStock;
  }
}
