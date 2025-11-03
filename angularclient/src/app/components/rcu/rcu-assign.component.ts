import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RcuService } from '../../services/rcu.service';
import { SmartphoneService } from '../../services/smartphone.service';
import { Smartphone } from '../../model/smartphone';


@Component({
  selector: 'app-rcu-assign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rcu-assign.component.html',
  styleUrls: ['./rcu-assign.component.scss']
})
export class RcuAssignComponent implements OnInit {
  rcuId!: number;
  rcuName = '';
  smartphones: Smartphone[] = [];
  selectedSmartphoneIds: number[] = [];
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rcuService: RcuService,
    private smartphoneService: SmartphoneService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.rcuId = +params['id'];
      this.rcuName = params['name'];
    });

    this.smartphoneService.getAll().subscribe({
      next: data => this.smartphones = data,
      error: () => this.message = 'Fehler beim Laden der Smartphones.'
    });
  }

  assign(): void {
    if (!this.selectedSmartphoneIds || this.selectedSmartphoneIds.length === 0) {
      this.message = 'Bitte mindestens ein Smartphone auswählen.';
      return;
    }

    this.rcuService.assignSmartphones(this.rcuId, this.selectedSmartphoneIds).subscribe({
      next: _ => {
        this.message = 'Smartphone erfolgreich zugewiesen!';
        setTimeout(() => this.router.navigate(['/home']), 1200);
      },
      error: () => this.message = 'Zuweisung fehlgeschlagen.'
    });
  }
}
