import { Component, OnInit, ViewChild } from '@angular/core';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-tecnics',
  templateUrl: './tecnics.component.html',
  styleUrls: ['./tecnics.component.css'],
})
export class TecnicsComponent implements OnInit {
  @ViewChild('agregarTecnicoModal') modalCloseAdd: any;
  @ViewChild('ModificarTecnicoModal') modalCloseUpdate: any;

  tecnico: any = {};
  errorModificarTecnico = false;
  nuevoTecnico: any = {};
  tecnicos: any[] = [];
  tecnicoSeleccionado: any = {};
  errorAgregarTecnico = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private tecnicsService: TecnicsService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getTecnicos();
  }

  getTecnicos(): void {
    this.tecnicsService
      .getTecnicos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.tecnicos = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de tecnicos:', error);
        }
      );
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getTecnicos();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getTecnicos();
  }

  seleccionarTecnico(tecnico: any): void {
    this.tecnicoSeleccionado = { ...tecnico };
  }

  navigateToUpdateTecnico(id: string, nombre: string): void {
    this.router.navigateByUrl(`/tecnicos/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  eliminarTecnico(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tecnicsService.eliminarTecnico(id).subscribe(
          () => {
            this.getTecnicos();
          },
          (error) => {
            console.error('Error al eliminar tecnico:', error);
          }
        );
      }
    });
  }

  agregarTecnico(): void {
    this.tecnicsService
      .agregarTecnico(this.nuevoTecnico)
      .pipe(
        tap(() => {
          this.router.navigate(['/tecnicos']);
          this.nuevoTecnico = {};
          this.getTecnicos();
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar tecnico:', error);
          this.errorAgregarTecnico = true;
          setTimeout(() => {
            this.errorAgregarTecnico = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarTecnico(): void {
    this.tecnicsService
      .modificarTecnico(this.tecnico)
      .pipe(
        tap(() => {
          this.router.navigate(['/tecnicos']);
          this.getTecnicos();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar tecnico:', error);
          this.errorModificarTecnico = true;
          setTimeout(() => {
            this.errorModificarTecnico = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
  abrirModalModificacion(tecnicoId: string, tecnicoNombre: string) {
    this.tecnico.id = tecnicoId;
    this.tecnico.nombre = tecnicoNombre;
  }
}
