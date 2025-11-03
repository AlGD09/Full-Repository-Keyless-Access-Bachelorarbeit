import { Component } from '@angular/core';
import { SmartphoneService } from '../../services/smartphone.service';
import { Smartphone } from '../../model/smartphone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
  regUserName = '';
  regSecretHash = '';

  // Formularfelder Auth
  authToken: string | null = null;
  selectedSmartphone: Smartphone | null = null;

  //Formular Hash
  getHash: boolean = false;
  selectedSmartphone1: Smartphone | null = null;
  lastHash: string | null = null;

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
      next: data => { this.phones = data; this.loading = false; },
      error: err => { this.errorMsg = err.message || 'Fehler beim Laden'; this.loading = false; }
    });
  }

  register(): void {
    const body: Smartphone = {
      deviceId: this.regDeviceId.trim(),
      userName: this.regUserName.trim(),
      secretHash: this.regSecretHash.trim()
    };
    if (!body.deviceId || !body.userName || !body.secretHash) { alert('Bitte alle Felder ausfüllen'); return; }

    this.smartphoneService.registerSmartphone(body).subscribe({
      next: _ => { this.clearRegForm(); this.loadList(); alert('Registrierung erfolgreich'); setTimeout(() => this.router.navigate(['/home']), 1200);},
      error: err => { this.errorMsg = err.error?.message || 'Registrierung fehlgeschlagen'; }
    });
  }

  requestToken(): void {
    if (!this.selectedSmartphone) {
            alert('Bitte ein Smartphone auswählen.');
            return;
    }

    const { deviceId, userName, secretHash } = this.selectedSmartphone;

    this.smartphoneService.requestToken(deviceId, userName, secretHash).subscribe({
      next: res => { this.authToken = res.auth_token; alert('Token erhalten'); this.clearAuthForm(); },
      error: _ => { this.authToken = null; alert('Auth fehlgeschlagen'); }
    });
  }


  requestHash(): void {
    if (!this.selectedSmartphone1) {
      alert('Bitte ein Smartphone auswählen.');
      return;
    }

    this.lastHash = this.selectedSmartphone1.secretHash;
    this.getHash = true;

    this.clearHashForm();
  }

  clearRegForm(): void {
    this.regDeviceId = ''; this.regUserName = ''; this.regSecretHash = '';
  }

  clearAuthForm(): void {
      this.selectedSmartphone = null;
    }

  clearHashForm(): void {
    this.selectedSmartphone1 = null;
    }


}

