import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartphoneService } from '../../services/smartphone.service';
import { RcuService } from '../../services/rcu.service';
import { UserService } from '../../services/user.service';
import { Smartphone } from '../../model/smartphone';
import { Rcu } from '../../model/rcu';
import { User } from '../../model/user';
import { CascadeGraphComponent } from '../../components/graph/cascade-graph.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CascadeGraphComponent
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  // Smartphones
  smartphones: Smartphone[] = [];
  // RCUs
  rcus: Rcu[] = [];

  users: User[] = [];

  assignments: { rid: number; rcuId: string; rcuName: string; smartphones: Smartphone[] }[] = [];
  zuweisungen: { sid: number; smartphoneId: string; smartphoneName: string; users: User[] }[] = [];

  // Status
  loading = false;
  errorMsg = '';

  constructor(
    private smartphoneService: SmartphoneService,
    private rcuService: RcuService,
    private userService: UserService,
    private router: Router
  ) {
    this.loadData();
  }

  // Lädt beide Tabellen gleichzeitig
  loadData(): void {
    this.loading = true;

    // Users abrufen
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = err.message || 'Fehler beim Laden der Users';
        this.loading = false;
      }
    });

    // Smartphones abrufen
    this.smartphoneService.getAll().subscribe({
      next: (data: Smartphone[]) => {
        this.smartphones = data;
        this.zuweisungen = [];
        this.smartphones.forEach(smartphone => {
          if (smartphone.id) {
            this.smartphoneService.getAssignedUsers(smartphone.id).subscribe({
              next: (users: User[]) => {
                // Prüfen, ob gültiges Smartphone-Objekt vorhanden ist
                const zugewiesen = users ?? [];
                this.zuweisungen.push({
                  sid: smartphone.id ?? 0,
                  smartphoneId: smartphone.deviceId || '–',
                  smartphoneName: smartphone.name || '–',
                  users: zugewiesen
                });
              },
              error: () => {
                this.zuweisungen.push({
                  sid: smartphone.id ?? 0,
                  smartphoneId: smartphone.deviceId || '–',
                  smartphoneName: smartphone.name || '–',
                  users: []
                });
              }
            });
          }
        });
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
                  this.rcuService.getAssignedSmartphones(rcu.rcuId).subscribe({
                    next: (smartphones: Smartphone[]) => {
                      // Prüfen, ob gültiges Smartphone-Objekt vorhanden ist
                      const assigned = smartphones ?? [];
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

  deleteUser(id: number): void {
    if (confirm('Möchten Sie diesen User wirklich löschen?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadData(); // Nach dem Löschen neu laden
        },
        error: () => {
          this.errorMsg = 'Fehler beim Löschen des Users.';
        }
      });
    }
  }

  openAssignPage(id: number, name: string): void{
    this.router.navigate(['/maschine/assign'], { queryParams: { id: id, name: name } });
  }

  openAssignSmartphone(id: number, name: string): void{
    this.router.navigate(['/smartphone/assign'], { queryParams: { id: id, name: name } });
  }

  removeSmartphone(rcuId: string, smartphoneId: number): void{
    this.smartphoneService.removeSmartphone(rcuId, smartphoneId).subscribe({
      next: () => {
        this.loadData(); // Nach dem Löschen neu laden
      },
      error: () => {
        this.errorMsg = 'Fehler beim Entfernen der Smartphonezuweisung.';
      }

    });

  }

  removeUser(smartphoneId: string, userId: number): void{
    this.userService.removeUser(smartphoneId, userId).subscribe({
      next: () => {
        this.loadData(); // Nach dem Löschen neu laden
      },
      error: () => {
        this.errorMsg = 'Fehler beim Entfernen der Userzuweisung.';
      }

    });

  }


}
