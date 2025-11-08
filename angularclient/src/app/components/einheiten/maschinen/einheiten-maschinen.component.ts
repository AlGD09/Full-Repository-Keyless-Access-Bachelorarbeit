import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RcuService } from '../../../services/rcu.service';
import { Rcu } from '../../../model/rcu';

@Component({
  selector: 'app-einheiten-maschinen',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './einheiten-maschinen.component.html'
})
export class EinheitenMaschinenComponent {

   // RCUs
    rcus: Rcu[] = [];

    // Status
    loading = false;
    errorMsg = '';

    constructor(
      private rcuService: RcuService,
      private router: Router
    ) {
      this.loadData();
    }

    loadData(): void {
      this.loading = true;


      this.rcuService.getAllRcus().subscribe({
        next: (data: Rcu[]) => {
          this.rcus = data;
          this.loading = false;
        },
        error: (err: any) => {
          this.errorMsg = err.message || 'Fehler beim Laden der RCUs';
          this.loading = false;
        }
      });

    }


      deleteRcu(id: number): void {
        if (confirm('Möchten Sie diese RCU wirklich löschen?')) {
          this.rcuService.deleteRcu(id).subscribe({
            next: () => {
              this.loadData(); // Nach dem Löschen neu laden
            },
            error: () => {
              this.errorMsg = 'Fehler beim Löschen der RCU.';
            }
          });
        }
      }






}
