import { Component, OnInit, ViewChild } from '@angular/core';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-tecnics',
  templateUrl: './tecnics.component.html',
  styleUrls: ['./tecnics.component.css']
})

export class TecnicsComponent implements OnInit { 
  @ViewChild('agregarTecnicoModal') modalCloseAdd: any;
  @ViewChild('ModificarTecnicoModal') modalCloseUpdate: any;

  tecnico: any = {};
  errorModificarTecnico = false;
  nuevoTecnico: any = {};
  tecnicos: any[] = [];
  tecnicoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarTecnico = false;

  constructor(private tecnicsService: TecnicsService, private router: Router, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getTecnicos();
  }

  getTecnicos(): void {
    this.tecnicsService.getTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
      },
      (error) => {
        console.error('Error al obtener la lista de tecnicos:', error);
      }
    );
  }

  seleccionarTecnico(tecnico: any): void {
    this.tecnicoSeleccionado = { ...tecnico };
  }

  navigateToUpdateTecnico(id: string, nombre: string): void {
    this.router.navigateByUrl(`/tecnicos/update`, { state: { nombre: nombre, id: id } });
  }

  eliminarTecnico(id: number): void {
    this.tecnicsService.eliminarTecnico(id).subscribe(
      () => {
        this.getTecnicos();
      },
      (error) => {
        console.error('Error al eliminar tecnico:', error);
      }
    );
  }

  get filteredTecnicos() {
    return this.tecnicos.filter((tecnico) =>
      tecnico.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  agregarTecnico(): void {
    this.tecnicsService.agregarTecnico(this.nuevoTecnico).pipe(
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
    ).subscribe();
  }

  modificarTecnico(): void {
    this.tecnicsService.modificarTecnico(this.tecnico).pipe(
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
    ).subscribe();
  }
  abrirModalModificacion(tecnicoId: string, tecnicoNombre: string) {
    this.tecnico.id = tecnicoId;
    this.tecnico.nombre = tecnicoNombre;
  }

}  