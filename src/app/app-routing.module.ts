import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component';
import { TecnicsComponent } from './components/tecnics/tecnics.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'add-client', component: AgregarClienteComponent },
  { path: 'tecnicos', component: TecnicsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
