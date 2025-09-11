import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { Router } from '@angular/router';
import { tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

declare var bootstrap: any;

@Component({
  selector: 'app-tecnics',
  templateUrl: './tecnics.component.html',
  styleUrls: ['./tecnics.component.css'],
})
export class TecnicsComponent implements OnInit, OnDestroy {
  @ViewChild('agregarTecnicoModal') modalCloseAdd: any;
  @ViewChild('ModificarTecnicoModal') modalCloseUpdate: any;

  tecnico: any = {};
  errorModificarTecnico = false;
  nuevoTecnico: any = {
    nombre: '',
    email: '',
    telefono: '',
    especialidad: '',
    nivel: ''
  };
  tecnicos: any[] = [];
  allTecnicos: any[] = []; // Array con todos los técnicos para estadísticas
  tecnicoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarTecnico = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private tecnicsService: TecnicsService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getTecnicos();
    this.getAllTecnicosForStats();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.nombre = searchTerm;
        this.currentPage = 0;
        this.getTecnicos();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getTecnicos(): void {
    this.tecnicsService
      .getTecnicosActivos(this.currentPage, this.pageSize, this.nombre)
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

  getAllTecnicosForStats(): void {
    // Obtener todos los técnicos para las estadísticas
    this.tecnicsService
      .getTecnicosActivos(0, 1000, '') // Obtener muchos técnicos para estadísticas
      .subscribe(
        (data) => {
          this.allTecnicos = data.content;
        },
        (error) => {
          console.error('Error al obtener técnicos para estadísticas:', error);
        }
      );
  }

  // Métodos de estadísticas
  getTotalTecnicos(): number {
    return this.allTecnicos.length;
  }

  getTecnicosActivos(): number {
    return this.allTecnicos.filter(tecnico => tecnico.activo !== false).length;
  }

  getReparacionesAsignadas(): number {
    // Simulando reparaciones asignadas - esto debería venir del backend
    return this.allTecnicos.reduce((total, tecnico) => 
      total + (tecnico.reparacionesAsignadas || Math.floor(Math.random() * 15) + 1), 0);
  }

  getRendimientoPromedio(): number {
    if (this.allTecnicos.length === 0) return 0;
    const totalRendimiento = this.allTecnicos.reduce((total, tecnico) => 
      total + this.getTecnicoRendimiento(tecnico), 0);
    return Math.round(totalRendimiento / this.allTecnicos.length);
  }

  // Métodos de utilidad
  trackByTecnicoId(index: number, tecnico: any): any {
    return tecnico.id;
  }

  getEstadoClass(tecnico: any): string {
    const activo = tecnico.activo !== false;
    const reparaciones = this.getTecnicoReparaciones(tecnico);
    
    if (!activo) return 'inactivo';
    if (reparaciones > 10) return 'muy-activo';
    if (reparaciones > 5) return 'activo';
    return 'disponible';
  }

  getEstadoIcon(tecnico: any): string {
    const activo = tecnico.activo !== false;
    const reparaciones = this.getTecnicoReparaciones(tecnico);
    
    if (!activo) return 'person_off';
    if (reparaciones > 10) return 'trending_up';
    if (reparaciones > 5) return 'task_alt';
    return 'person';
  }

  getEstadoText(tecnico: any): string {
    const activo = tecnico.activo !== false;
    const reparaciones = this.getTecnicoReparaciones(tecnico);
    
    if (!activo) return 'Inactivo';
    if (reparaciones > 10) return 'Muy Activo';
    if (reparaciones > 5) return 'Activo';
    return 'Disponible';
  }

  getTecnicoReparaciones(tecnico: any): number {
    // Simulando reparaciones - esto debería venir del backend
    return tecnico.reparacionesCompletadas || Math.floor(Math.random() * 20) + 1;
  }

  getTecnicoRendimiento(tecnico: any): number {
    // Simulando rendimiento - esto debería venir del backend
    return tecnico.rendimiento || Math.floor(Math.random() * 40) + 60; // Entre 60-100%
  }

  getUltimaActividad(tecnico: any): string {
    // Simulando última actividad - esto debería venir del backend
    if (tecnico.ultimaActividad) {
      return tecnico.ultimaActividad;
    }
    const opciones = ['Hace 1 hora', 'Hace 2 horas', 'Hoy', 'Ayer', 'Hace 2 días', 'Esta semana'];
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  verDetallesTecnico(tecnico: any): void {
    this.tecnicoSeleccionado = { ...tecnico };
    const modalElement = document.getElementById('verDetallesTecnicoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal(): void {
    this.tecnicoSeleccionado = {};
  }

  exportarTecnicos(): void {
    if (this.tecnicos.length === 0) {
      return;
    }

    const csvHeaders = ['Nombre', 'Email', 'Teléfono', 'Especialidad', 'Nivel', 'Reparaciones', 'Rendimiento %', 'Estado'];
    const csvData = this.tecnicos.map(tecnico => [
      tecnico.nombre || '',
      tecnico.email || '',
      tecnico.telefono || '',
      tecnico.especialidad || '',
      tecnico.nivel || '',
      this.getTecnicoReparaciones(tecnico),
      this.getTecnicoRendimiento(tecnico),
      this.getEstadoText(tecnico)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tecnicos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getTecnicos();
    this.getAllTecnicosForStats();
  }

  desactivarTecnicos(tecnico: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.tecnicsService.desactivarTecnico(tecnico).pipe(
          tap(() => {
            console.log('Tecnico desactivado exitosamente');
            this.getTecnicos();
            this.getAllTecnicosForStats();
          }),
          catchError((error) => {
            console.error('Error al desactivar tecnico:', error);
            return of(error);
          })
        ).subscribe();
      }
    });
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
            this.getAllTecnicosForStats();
          },
          (error) => {
            console.error('Error al eliminar tecnico:', error);
          }
        );
      }
    });
  }

  agregarTecnico(): void {
    // Validaciones
    if (!this.nuevoTecnico.nombre || this.nuevoTecnico.nombre.trim() === '') {
      this.errorAgregarTecnico = true;
      setTimeout(() => {
        this.errorAgregarTecnico = false;
      }, 5000);
      return;
    }

    this.tecnicsService.agregarTecnico(this.nuevoTecnico).subscribe({
      next: (response) => {
        console.log(response);
        this.router.navigate(['/tecnicos']);
        this.nuevoTecnico = {
          nombre: '',
          email: '',
          telefono: '',
          especialidad: '',
          nivel: ''
        };
        this.getTecnicos();
        this.getAllTecnicosForStats();
        this.modalCloseAdd.nativeElement.click();
      },
      error: (error) => {
        console.log('Error al agregar técnico:', error);
        this.errorAgregarTecnico = true;
        setTimeout(() => {
          this.errorAgregarTecnico = false;
        }, 5000);
        return of(error);
      },
    });
  }

  modificarTecnico(): void {
    // Validaciones
    if (!this.tecnico.nombre || this.tecnico.nombre.trim() === '') {
      this.errorModificarTecnico = true;
      setTimeout(() => {
        this.errorModificarTecnico = false;
      }, 5000);
      return;
    }

    this.tecnicsService
      .modificarTecnico(this.tecnico)
      .pipe(
        tap(() => {
          this.router.navigate(['/tecnicos']);
          this.getTecnicos();
          this.getAllTecnicosForStats();
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
    // Buscar el técnico completo para obtener todos sus datos
    const tecnicoCompleto = this.tecnicos.find(t => t.id === tecnicoId);
    if (tecnicoCompleto) {
      this.tecnico = { ...tecnicoCompleto };
    }
  }
}
