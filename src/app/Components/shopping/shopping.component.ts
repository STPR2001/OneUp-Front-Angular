import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ShoppingService } from 'src/app/services/shopping.service';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit {
  @ViewChild('agregarCompraModal') modalCloseAdd: any;
  @ViewChild('ModificarCompraModal') modalCloseUpdate: any;

  compra: any = {};
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  errorModificarCompra = false;
  nuevoCompra: any = {};
  compras: any[] = [];
  compraSeleccionado: any = {};
  errorAgregarCompra = false;
  startDate: string = '';
  endDate: string = '';
  today: string = '';

  constructor(
    private shoppingService: ShoppingService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getCompras();
    this.today = this.getToday();
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
    return compra.compraRepuesto.reduce(
      (sum: number, repuesto: any) => sum + repuesto.cant,
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
