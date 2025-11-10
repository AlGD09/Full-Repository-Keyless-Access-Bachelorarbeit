import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SmartphoneService } from '../../services/smartphone.service';
import { UserService } from '../../services/user.service';
import { Smartphone } from '../../model/smartphone';
import { User } from '../../model/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {
  // Formularfelder Registrierung
  UserName = '';
  Email = '';
  SecretHash = '';

  // Registrierung
  registered: boolean = false;
  err_registered: boolean = false;

  // Request Hash
  getHash: boolean = false;
  selectedUser: User | null = null;
  lastHash: string | null = null;

  // Liste
  users: User[] = [];
  loading = false;
  errorMsg = '';

  constructor(private userService: UserService, private router: Router) {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: data => { this.users = data; this.loading = false; },
      error: err => { this.errorMsg = err.message || 'Fehler beim Laden'; this.loading = false; }
    });
  }

  register(): void {
    if (!this.UserName || !this.SecretHash ) {
      const result = Swal.fire({
        text: `Bitte User Name und Hash eingeben`,
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
      // alert('Bitte User Name und Hash eingeben');
      return;
    }
    const newUser: User = { username: this.UserName, email: this.Email, secretHash: this.SecretHash };
    this.userService.registerUser(newUser).subscribe({
      next: _ => { this.clearRegForm(); this.loadList(); this.registered = true; },
      error: err => { this.err_registered = true; }
    });

  }

   fillRandomHash(input: HTMLInputElement): void {
     const hexChars = 'abcdef0123456789';
     let hash = '';
     for (let i = 0; i < 32; i++) {
       hash += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
     }

     input.value = hash;

     // Diese Zeile sorgt dafür, dass Angular den neuen Wert erkennt
     input.dispatchEvent(new Event('input'));
   }



  requestHash(): void {
      if (!this.selectedUser) {
        alert('Bitte ein User auswählen.');
        return;
      }

      this.lastHash = this.selectedUser.secretHash;
      this.getHash = true;

      this.clearHashForm();
  }



  clearRegForm(): void {
    this.UserName = ''; this.Email = ''; this.SecretHash = '';
  }

  clearHashForm(): void {
    this.selectedUser = null;
  }








}
