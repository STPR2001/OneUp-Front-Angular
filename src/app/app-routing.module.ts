import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { NewTecnicoComponent } from './Components/tecnics/new-tecnico/new-tecnico.component';
import { UpdateTecnicoComponent } from './Components/tecnics/update-tecnico/update-tecnico.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'add-client', component: AgregarClienteComponent },
  { path: 'tecnicos', component: TecnicsComponent },
  { path: 'tecnicos/new', component: NewTecnicoComponent },
  { path: 'tecnicos/update', component: UpdateTecnicoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
