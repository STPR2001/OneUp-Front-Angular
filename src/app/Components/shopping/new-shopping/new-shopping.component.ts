import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProvidersService } from 'src/app/services/providers.service';
import { ShoppingService } from 'src/app/services/shopping.service';
import { catchError, of, tap } from 'rxjs';

function minArrayLength(min: number) {
  return (control: AbstractControl) => {
    if (control instanceof FormArray) {
      return control.length >= min ? null : { minArrayLength: { valid: false, min } };
    }
    return null;
  };
}

@Component({
  selector: 'app-new-shopping',
  templateUrl: './new-shopping.component.html',
  styleUrls: ['./new-shopping.component.css']
})
export class NewShoppingComponent implements OnInit {
  @ViewChild('agregarProveedorModal') modalCloseAdd: any;

  nuevoProveedor: any = {};
  errorAgregarProveedor = false;
  proveedores: any[] = [];
  compraForm: FormGroup;
  repuestosDisponibles: any[] = [];
  maxFecha: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private providersService: ProvidersService,
    private shoppingService: ShoppingService
  ) {
    this.compraForm = this.fb.group({
      total: [0, [Validators.required, Validators.min(0)]],
      fecha: ['', [Validators.required]],
      repuestos: this.fb.array([], minArrayLength(1)),
      id_proveedor: [0, [Validators.required, Validators.min(1)]]
    });
    this.maxFecha = this.formatDate(new Date());
  }

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarRepuestos();
  }

  get repuestos(): FormArray {
    return this.compraForm.get('repuestos') as FormArray;
  }
  cargarProveedores(): void {
    this.providersService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (error) => {
        console.error('Error al cargar los proveedores:', error);
      }
    });
  }

  onRepuestoChange(event: any, index: number): void {
    const repuestoId = event.target.value;
    const repuestoSeleccionado = this.repuestosDisponibles.find(repuesto => repuesto.id == repuestoId);
    if (repuestoSeleccionado) {
      this.repuestos.at(index).get('precio')?.setValue(repuestoSeleccionado.precioCosto);
    }
    this.calcularTotal();
  }

  cargarRepuestos(): void {
    this.providersService.getRepuestos().subscribe({
      next: (data) => {
        this.repuestosDisponibles = data;
      },
      error: (error) => {
        console.error('Error al cargar los repuestos:', error);
      }
    });
  }
  agregarRepuesto(): void {
    const repuestoGroup = this.fb.group({
      precio: [0, [Validators.required, Validators.min(0.01)]],
      cant: [0, [Validators.required, Validators.min(1)]],
      id: [0, [Validators.required, Validators.min(1)]]
    });
    this.repuestos.push(repuestoGroup);
    this.suscribirseACambiosEnRepuestos(repuestoGroup);
  }


  suscribirseACambiosEnRepuestos(repuestoGroup: FormGroup): void {
    repuestoGroup.get('id')?.valueChanges.subscribe(() => this.calcularTotal());
    repuestoGroup.get('cant')?.valueChanges.subscribe(() => this.calcularTotal());
  }
  eliminarRepuesto(index: number): void {
    this.repuestos.removeAt(index);
  }

  calcularTotal(): void {
    const total = this.repuestos.controls.reduce((acc, repuestoGroup) => {
      const precio = repuestoGroup.get('precio')?.value || 0;
      const cant = repuestoGroup.get('cant')?.value || 0;
      return acc + (precio * cant);
    }, 0);
    this.compraForm.get('total')?.setValue(total);
  }
  crearCompra(): void {
    if (this.compraForm.valid) {
      console.log(this.compraForm.value);
      this.shoppingService.agregarCompra(this.compraForm.value).pipe(
        tap(() => {
          this.router.navigate(['/compras']);
        }),
        catchError((error) => {
          console.error('Error al agregar proveedor:', error);
          return of(error);
        })
      ).subscribe();
    } else {
      this.compraForm.markAllAsTouched();
    }
  }
  agregarProveedor(): void {
    this.providersService.agregarProveedor(this.nuevoProveedor).pipe(
      tap(() => {
        this.nuevoProveedor = {};
        this.modalCloseAdd.nativeElement.click();
        this.cargarProveedores();
      }),
      catchError((error) => {
        console.error('Error al agregar proveedor:', error);
        this.errorAgregarProveedor = true;
        setTimeout(() => {
          this.errorAgregarProveedor = false;
        }, 5000);
        return of(error);
      })
    ).subscribe();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
