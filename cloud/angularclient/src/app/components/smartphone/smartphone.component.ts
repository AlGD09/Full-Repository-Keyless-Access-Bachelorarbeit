import { Component } from '@angular/core';
import { SmartphoneService } from '../../services/smartphone.service';
import { Smartphone } from '../../model/smartphone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../model/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-smartphone',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smartphone.component.html',
  styleUrls: ['./smartphone.component.scss']
})
export class SmartphoneComponent {
  // Formularfelder Registrierung
  regDeviceId = '';
  regName = '';
  registered: boolean = false;
  updated: boolean = false;

  // Formularfelder Auth
  authToken: string | null = null;
  selectedSmartphone: Smartphone | null = null;
  empty: boolean = false;

  // Liste
  phones: Smartphone[] = [];
  loading = false;
  errorMsg = '';

  constructor(
    private smartphoneService: SmartphoneService,
    private router: Router
    ) {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.smartphoneService.getAll().subscribe({
      next: data => {
        this.phones = data;

        this.phones.forEach(phone => {
          if (phone.id) {
            this.smartphoneService.getAssignedUsers(phone.id).subscribe({
              next: (users: User[]) => {
                phone.users = users ?? [];
              },
              error: () => {
                phone.users = []; // Kein Problem, wenn keine Zuordnung existiert
              }
            });
          }
        });

        this.loading = false;
      },
      error: err => { this.errorMsg = err.message || 'Fehler beim Laden'; this.loading = false; }
    });
  }

  register(): void {
    const body: Smartphone = {
      deviceId: this.regDeviceId.trim(),
      name: this.regName.trim(),
    };
    if (!body.deviceId || !body.name) {
      const result = Swal.fire({
        text: `Bitte Name und ID eingeben`,
        icon: 'warning',
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'OK',
        color: '#002B49', //Textfarbe
        buttonsStyling: false,
        customClass: {
          // actions: 'space-x-4 justify-center',
          cancelButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition focus:outline-none focus:ring-0'
        }
      });
      // alert('Bitte alle Felder ausfüllen');
      return;
    }

    if (this.phones.some(p => p.deviceId === body.deviceId)) {
      this.updated = true; this.registered = false;
      return;
    } else {
      this.registered = true; this.updated = false;
    }

    this.smartphoneService.registerSmartphone(body).subscribe({
      next: async smart => {
        this.clearRegForm(); this.loadList();
        const result = await Swal.fire({
          text: `Möchten Sie einen Benutzer dem Gerät ${smart.name} zuordnen?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ja, zuweisen',
          cancelButtonText: 'Nein, später',
          color: '#002B49', //Textfarbe
          buttonsStyling: false, // <— deaktiviert Standard-Button-Styling
          customClass: {
            actions: 'space-x-4 justify-center',
            confirmButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
            cancelButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
          }
        });

        if (result.isConfirmed) {
          this.router.navigate(['/smartphone/assign'], { queryParams: { id: smart.id, name: smart.name } });
        }

      },
      error: err => { this.errorMsg = err.error?.message || 'Registrierung fehlgeschlagen'; }
    });
  }

  requestToken(): void {
    if (!this.selectedSmartphone) {
      const result = Swal.fire({
        text: `Bitte ein Smartphone auswählen`,
        icon: 'warning',
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'OK',
        color: '#002B49', //Textfarbe
        buttonsStyling: false,
        customClass: {
          // actions: 'space-x-4 justify-center',
          cancelButton: 'text-[#0002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition focus:outline-none focus:ring-0'
        }
      });
      // alert('Bitte ein Smartphone auswählen.');
      return;
    }

    const { deviceId } = this.selectedSmartphone;
    const { id } = this.selectedSmartphone;
    const { name } = this.selectedSmartphone;
    if (!this.selectedSmartphone.users || this.selectedSmartphone.users.length === 0) {
        this.empty = true; this.authToken = null;
        Swal.fire({
            text: `Für die Token-Generierung muss dem ausgewählten Gerät mindestens ein Benutzer zugewiesen sein.\n\nMöchten Sie jetzt einen Benutzer zuweisen?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ja',
            cancelButtonText: 'Nein',
            color: '#002B49',
            buttonsStyling: false,
            customClass: {
              actions: 'space-x-4 justify-center',
              confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition',
              cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
            }
          }).then(result => {
            if (result.isConfirmed) {
              this.router.navigate(['/smartphone/assign'], { queryParams: { id: id, name: name } });
            }
          });
        return;
    }

    const user = this.selectedSmartphone.users[0];
    const { username, secretHash } = user;


    this.smartphoneService.requestToken(deviceId, username, secretHash).subscribe({
      next: res => { this.authToken = res.auth_token; this.clearAuthForm(); this.empty = false;},
      error: _ => { this.authToken = null; alert('Auth fehlgeschlagen'); }
    });
  }


  clearRegForm(): void {
    this.regDeviceId = ''; this.regName = '';
  }

  clearAuthForm(): void {
    this.selectedSmartphone = null;
  }



}

