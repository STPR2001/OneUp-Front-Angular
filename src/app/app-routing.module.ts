import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { ProvidersComponent } from './Components/providers/providers.component';
import { RepairsComponent } from './Components/repairs/repairs.component';
import { AddRepairComponent } from './Components/repairs/add-repair/add-repair.component';
import { RepuestosComponent } from './Components/repuestos/repuestos.component';
import { ModifyRepairComponent } from './Components/repairs/modify-repair/modify-repair.component';
import { EquipmentsComponent } from './Components/equipments/equipments.component';
import { LoginComponent } from './Components/login/login.component';
import { AuthGuard } from './services/auth/auth.guard';
import { RoleGuard } from './services/auth/role.guard';
import { HomeComponent } from './Components/home/home.component';
import { ShoppingComponent } from './Components/shopping/shopping.component';
import { NewShoppingComponent } from './Components/shopping/new-shopping/new-shopping.component';
import { ConfigComponent } from './Components/config/config.component';
import { StatisticComponent } from './Components/statistic/statistic.component';
import { SeguimientoComponent } from './Components/seguimiento/seguimiento.component';
import { RestoreDataComponent } from './Components/restore-data/restore-data.component';
import { ProductsComponent } from './Components/products/products.component';
import { AccessDeniedComponent } from './Components/access-denied/access-denied.component';

const routes: Routes = [
  { 
    path: 'clients', 
    component: ClientsComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'tecnicos', 
    component: TecnicsComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'proveedores', 
    component: ProvidersComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'compras', 
    component: ShoppingComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'productos', 
    component: ProductsComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'estadisticas', 
    component: StatisticComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  { 
    path: 'compras/new', 
    component: NewShoppingComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'reparaciones', 
    component: RepairsComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'agregarReparacion', 
    component: AddRepairComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'modificarReparacion/:id', 
    component: ModifyRepairComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'equipos', 
    component: EquipmentsComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'repuestos', 
    component: RepuestosComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN', 'TECNICO'] }
  },
  { 
    path: 'configuracion', 
    component: ConfigComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  { 
    path: 'restore', 
    component: RestoreDataComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: ['ADMIN'] }
  },
  { path: 'seguimiento', component: SeguimientoComponent},
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'acceso-denegado', component: AccessDeniedComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
