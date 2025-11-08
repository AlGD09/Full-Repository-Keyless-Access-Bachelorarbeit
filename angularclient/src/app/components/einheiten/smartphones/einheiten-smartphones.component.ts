import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartphoneService } from '../../../services/smartphone.service';
import { Smartphone } from '../../../model/smartphone';


@Component({
  selector: 'app-einheiten-smartphones',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './einheiten-smartphones.component.html'
})
export class EinheitenSmartphonesComponent {
    // Smartphones
    smartphones: Smartphone[] = [];

    // Status
    loading = false;
    errorMsg = '';

  constructor(
    private smartphoneService: SmartphoneService,
    private router: Router
  ) {
    this.loadData();
  }

  // Lädt beide Tabellen gleichzeitig
  loadData(): void {
    this.loading = true;

    // Smartphones abrufen
    this.smartphoneService.getAll().subscribe({
      next: (data: Smartphone[]) => {
        this.smartphones = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = err.message || 'Fehler beim Laden der Smartphones';
        this.loading = false;
      }
    });
  }

  deleteSmartphone(id: number): void {
    if (confirm('Möchten Sie dieses Smartphone wirklich löschen?')) {
      this.smartphoneService.deleteSmartphone(id).subscribe({
        next: () => {
          this.loadData(); // Nach dem Löschen neu laden
        },
        error: () => {
          this.errorMsg = 'Fehler beim Löschen des Smartphones.';
        }
      });
    }
  }





}
