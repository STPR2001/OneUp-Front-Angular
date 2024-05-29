import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { ProvidersComponent } from './Components/providers/providers.component';
import { RepairsComponent } from './Components/repairs/repairs.component';
import { AddRepairComponent } from './Components/repairs/add-repair/add-repair.component';
import { ModifyRepairComponent } from './Components/repairs/modify-repair/modify-repair.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'tecnicos', component: TecnicsComponent },
  { path: 'proveedores', component: ProvidersComponent },
  { path: 'reparaciones', component: RepairsComponent },
  { path: 'agregarReparacion', component: AddRepairComponent },
  { path: 'modificarReparacion/:id', component: ModifyRepairComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
