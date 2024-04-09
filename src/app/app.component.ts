import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InventarioComponent } from './features/inventario/inventario.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InventarioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'inventario';
}
