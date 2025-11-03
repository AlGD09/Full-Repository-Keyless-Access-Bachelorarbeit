import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartphoneService } from '../../services/smartphone.service';
import { RcuService } from '../../services/rcu.service';
import { Smartphone } from '../../model/smartphone';
import { Rcu } from '../../model/rcu';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  // Smartphones
  smartphones: Smartphone[] = [];
  // RCUs
  rcus: Rcu[] = [];

  assignments: { rid: number; rcuId: string; rcuName: string; smartphones: Smartphone[] }[] = [];


  // Status
  loading = false;
  errorMsg = '';

  constructor(
    private smartphoneService: SmartphoneService,
    private rcuService: RcuService,
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

    // RCUs abrufen
    this.rcuService.getAllRcus().subscribe({
      next: (data: Rcu[]) => {
        this.rcus = data;

        this.assignments = [];
              this.rcus.forEach(rcu => {
                if (rcu.id) {
                  this.rcuService.getAssignedSmartphone(rcu.rcuId).subscribe({
                    next: (smartphone: Smartphone | null) => {
                      // Prüfen, ob gültiges Smartphone-Objekt vorhanden ist
                      const assigned = smartphone && smartphone.deviceId ? [smartphone] : [];
                      this.assignments.push({
                        rid: rcu.id ?? 0,
                        rcuId: rcu.rcuId || '–',
                        rcuName: rcu.name || '–',
                        smartphones: assigned
                      });
                    },
                    error: () => {
                      this.assignments.push({
                        rid: rcu.id ?? 0,
                        rcuId: rcu.rcuId || '–',
                        rcuName: rcu.name || '–',
                        smartphones: []
                      });
                    }
                  });
                }
              });
      },
      error: (err: any) => {
        this.errorMsg = err.message || 'Fehler beim Laden der RCUs';
      }
    });
  }

  deleteRcu(id: number): void {
    if (confirm('Willst du diese RCU wirklich löschen?')) {
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

  deleteSmartphone(id: number): void {
    if (confirm('Willst du dieses Smartphone wirklich löschen?')) {
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

  openAssignPage(id: number, name: string): void{
    this.router.navigate(['/maschine/assign'], { queryParams: { id: id, name: name } });
  }

  unassign(rcuId: string, smartphoneId: number): void{
    this.smartphoneService.unassignSmartphone(rcuId, smartphoneId).subscribe({
      next: () => {
        this.loadData(); // Nach dem Löschen neu laden
      },
      error: () => {
        this.errorMsg = 'Fehler beim Entfernen der Smartphonezuweisung.';
      }

    });

  }


}
