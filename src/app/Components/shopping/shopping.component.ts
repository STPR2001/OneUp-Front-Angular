import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ShoppingService } from 'src/app/services/shopping.service';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css']
})
export class ShoppingComponent implements OnInit {

  @ViewChild('agregarCompraModal') modalCloseAdd: any;
  @ViewChild('ModificarCompraModal') modalCloseUpdate: any;

  compra: any = {};
  errorModificarCompra = false;
  nuevoCompra: any = {};
  compras: any[] = [];
  compraSeleccionado: any = {};
  errorAgregarCompra = false;
  startDate: string = '';
  endDate: string = '';
  today: string = '';

  constructor(private shoppingService: ShoppingService, private router: Router) { }

  ngOnInit(): void {
    this.getCompras();
    this.today = this.getToday();
  }

  getCompras(): void {
    this.shoppingService.getCompras().subscribe(
      (data) => {
        console.log(data)
        this.compras = data;
      },
      (error) => {
        console.error('Error al obtener la lista de compras:', error);
      }
    );
  }

  seleccionarCompra(compra: any): void {
    this.compraSeleccionado = { ...compra };
  }

  navigateToUpdateCompra(id: string, nombre: string): void {
    this.router.navigateByUrl(`/compras/update`, { state: { nombre: nombre, id: id } });
  }

  eliminarCompra(id: number): void {
    this.shoppingService.eliminarCompra(id).subscribe(
      () => {
        this.getCompras();
      },
      (error) => {
        console.error('Error al eliminar compra:', error);
      }
    );
  }

  get filteredCompras() {
    const start = new Date(this.startDate).getTime();
    const end = new Date(this.endDate).getTime();

    return this.compras
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .filter(compra => {
        const compraDate = new Date(compra.fecha).getTime();
        return (!this.startDate || compraDate >= start) && (!this.endDate || compraDate <= end);
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
      second: '2-digit'
    });
  }

  getTotalCantidad(compra: any): number {
    return compra.compraRepuesto.reduce((sum: number, repuesto: any) => sum + repuesto.cant, 0);
  }


  agregarCompra(): void {
    this.shoppingService.agregarCompra(this.nuevoCompra).pipe(
      tap(() => {
        this.router.navigate(['/compras']);
        this.nuevoCompra = {};
        this.getCompras();
        this.modalCloseAdd.nativeElement.click();
      }),
      catchError((error) => {
        console.error('Error al agregar compra:', error);
        this.errorAgregarCompra = true;
        setTimeout(() => {
          this.errorAgregarCompra = false;
        }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  modificarCompra(): void {
    this.shoppingService.modificarCompra(this.compra).pipe(
      tap(() => {
        this.router.navigate(['/compras']);
        this.getCompras();
        this.modalCloseUpdate.nativeElement.click();
      }),
      catchError((error) => {
        console.error('Error al modificar compra:', error);
        this.errorModificarCompra = true;
        setTimeout(() => {
          this.errorModificarCompra = false;
        }, 5000);
        return of(error);
      })
    ).subscribe();
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
