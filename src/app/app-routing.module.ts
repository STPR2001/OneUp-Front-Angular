import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'add-client', component: AgregarClienteComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
