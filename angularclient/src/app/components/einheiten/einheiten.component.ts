import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartphoneService } from '../../services/smartphone.service';
import { RcuService } from '../../services/rcu.service';
import { UserService } from '../../services/user.service';
import { Smartphone } from '../../model/smartphone';
import { Rcu } from '../../model/rcu';
import { User } from '../../model/user';

@Component({
  selector: 'app-einheiten',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './einheiten.component.html'
})
export class EinheitenComponent {
  // Smartphones
  smartphones: Smartphone[] = [];
  // RCUs
  rcus: Rcu[] = [];

  users: User[] = [];

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



}
