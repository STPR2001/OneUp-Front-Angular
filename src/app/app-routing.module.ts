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
import { HomeComponent } from './Components/home/home.component';
import { ShoppingComponent } from './Components/shopping/shopping.component';
import { NewShoppingComponent } from './Components/shopping/new-shopping/new-shopping.component';
import { ConfigComponent } from './Components/config/config.component';
import { StatisticComponent } from './Components/statistic/statistic.component';
import { SeguimientoComponent } from './Components/seguimiento/seguimiento.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard] },
  { path: 'tecnicos', component: TecnicsComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProvidersComponent, canActivate: [AuthGuard] },
  { path: 'compras', component: ShoppingComponent, canActivate: [AuthGuard] },
  { path: 'estadisticas', component: StatisticComponent, canActivate: [AuthGuard] },
  { path: 'compras/new', component: NewShoppingComponent, canActivate: [AuthGuard] },
  { path: 'reparaciones', component: RepairsComponent, canActivate: [AuthGuard] },
  { path: 'agregarReparacion', component: AddRepairComponent, canActivate: [AuthGuard] },
  { path: 'modificarReparacion/:id', component: ModifyRepairComponent, canActivate: [AuthGuard] },
  { path: 'equipos', component: EquipmentsComponent, canActivate: [AuthGuard] },
  { path: 'repuestos', component: RepuestosComponent, canActivate: [AuthGuard] },
  { path: 'configuracion', component: ConfigComponent, canActivate: [AuthGuard] },
  { path: 'seguimiento', component: SeguimientoComponent},
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
