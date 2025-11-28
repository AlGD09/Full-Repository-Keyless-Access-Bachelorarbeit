import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RcuService } from '../../../services/rcu.service';
import { Rcu } from '../../../model/rcu';
import { Remote } from '../../../model/remote';
import { Programmed } from '../../../model/programmed';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-einheiten-maschinen',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './einheiten-maschinen.component.html'
})
export class EinheitenMaschinenComponent implements OnInit {

   // RCUs
    rcus: Rcu[] = [];

    // Status
    loading = false;
    errorMsg = '';

    private cancelConnectingAnimation: (() => void) | null = null;
    private remoteSubMode: 'manual' | 'schedule' | 'none' = 'none';
    private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

    // Wird benutzt, um nur die Popup-UI (Buttons, Inputs) zu "pausieren"
    // – NICHT mehr den gesamten loadData()-Aufruf.
    private autoRefreshPaused = false;

    private setRemoteSubMode(mode: 'manual' | 'schedule' | 'none') {
      this.remoteSubMode = mode;
      // Nur noch: Popup-Updates pausieren, wenn 'schedule'
      // this.autoRefreshPaused = mode === 'schedule';
    }

    private resumeAutoRefresh() {
      this.autoRefreshPaused = false;
    }

    constructor(
      private rcuService: RcuService,
      private router: Router
    ) {
      this.loadData();
    }

    // Status jede 3s aktualisieren
    ngOnInit() {
      this.refreshIntervalId = setInterval(() => {
        // WICHTIG: loadData wird IMMER aufgerufen.
        // Das Popup selbst wird unten separat "geschützt".
        this.loadData();

      }, 1000);
    }


    loadData(): void {
      this.loading = true;

      // Stoppe evtl. laufende Punkt-Animation vom vorherigen Popup
      this.cancelConnectingAnimation?.();
      this.cancelConnectingAnimation = null;

      this.rcuService.getAllRcus().subscribe({
        next: (data: Rcu[]) => {
          this.rcus = data;
          this.loading = false;

          // --- LIVE UPDATE IM SWEETALERT POPUP ---
          const statusEl = document.getElementById("machine-status");

          // Wenn der Schedule-Modus aktiv ist (autoRefreshPaused == true),
          // dann NICHT die Popup-Buttons/Inputs überschreiben.
          if (statusEl) {
            const rcuId = Number(statusEl.getAttribute("data-id"));
            const updated = data.find(x => x.id === rcuId);

            if (updated) {

              // STATUS aktualisieren
              statusEl.innerText = (updated.status + "").toUpperCase();
              statusEl.className =
                "leading-none pt-20 font-semibold " + this.getStatusColor(updated.status);

              // BUTTON aktualisieren
              const btnContainer = document.getElementById("remote-btn-container");

              if (btnContainer && !this.autoRefreshPaused) {

                if (updated.status === "idle") {

                  // Button rendern
                  btnContainer.innerHTML = `
                    <button id="StartRemoteMode"
                      style="outline: none; box-shadow: none;"
                      class="px-4 py-14 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                      <<< FERNSTEUERUNG STARTEN >>>
                    </button>
                  `;

                  // Button Event Listener neu setzen
                  const btn = document.getElementById("StartRemoteMode");
                  if (btn) {
                    btn.addEventListener("click", () => {
                      this.startRemoteMode(updated.rcuId);
                    });
                  }

                } else if (updated.status === "Remote - idle") {
                  this.cancelConnectingAnimation?.();   // <--- HINZUFÜGEN
                  this.cancelConnectingAnimation = null;


                  if (this.remoteSubMode === "none") {
                    btnContainer.innerHTML = `

                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <div class="flex justify-center gap-4 mb-4">
                        <button id="RemoteManualMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                          Manuelle Steuerung
                        </button>
                        <button id="RemoteScheduleMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                          Befehle einplanen
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>

                    `;


                  }

                  if (this.remoteSubMode === "manual") {
                    btnContainer.innerHTML = `

                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="flex justify-center mb-3">
                          <button id="RemoteEntriegelung"
                            style="outline: none; box-shadow: none; position: relative;"
                            class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-[#228B22] text-lg transition hover:text-[#006400] hover:bg-[#F2F2F2]">

                            <i class="fa-solid fa-lock-open text-3xl"></i>
                            <span>Maschine entriegeln</span>

                          </button>
                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>
                    `;
                  }

                  if (this.remoteSubMode === "schedule") {
                    const unlockVal = '';
                    const lockVal = '';
                    btnContainer.innerHTML = `
                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <div class="px-8 pt-2 space-y-3 text-left w-full">
                        <label class="block text-sm font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${unlockVal}">
                        </label>

                        <label class="block text-sm font-semibold text-[#002B49]">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${lockVal}">
                        </label>

                        <button id="ScheduleSave"
                          class="mt-2 px-4 py-2 rounded-lg bg-[#4D004D] text-white font-semibold hover:bg-[#330033]">
                          Befehle speichern
                        </button>
                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>
                    `;

                  }

                  const btn1 = document.getElementById("RemoteEntriegelung");
                  if (btn1) {
                    btn1.addEventListener("click", () => {
                      this.RemoteUnlock(updated.rcuId);
                    });
                  }

                  const btn2 = document.getElementById("StopRemoteMode");
                  if (btn2) {
                    btn2.addEventListener("click", () => {
                      this.setRemoteSubMode('none');
                      this.resumeAutoRefresh();
                      this.stopRemoteMode(updated.rcuId);
                    });
                  }

                  const btn5 = document.getElementById("RemoteManualMode");
                  if (btn5) {
                    btn5.addEventListener("click", () => {
                      this.setRemoteSubMode('manual');

                    });
                  }

                  const btn6 = document.getElementById("RemoteScheduleMode");
                  if (btn6) {
                    btn6.addEventListener("click", () => {
                      this.setRemoteSubMode('schedule');
                      this.handleClick(updated);
                      this.autoRefreshPaused = true;

                    });
                  }

                  const btn7 = document.getElementById("ReturnMenu");
                  if (btn7) {
                    btn7.addEventListener("click", () => {
                      this.autoRefreshPaused = false;
                      this.setRemoteSubMode('none');
                      this.handleClick(updated);
                    });
                  }

                  const inputUnlock = document.getElementById("ScheduleUnlockTime") as HTMLInputElement | null;
                  const inputLock = document.getElementById("ScheduleLockTime") as HTMLInputElement | null;

                  const btn8 = document.getElementById("ScheduleSave");
                  if (btn8) {
                    btn8.addEventListener("click", () => {
                      this.ScheduleRemote(updated.rcuId, inputUnlock, inputLock);
                    });
                  }


                } else if (updated.status === "Remote - operational") {
                  if (this.remoteSubMode === "none") {
                    btnContainer.innerHTML = `

                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <div class="flex justify-center gap-4 mb-4">
                        <button id="RemoteManualMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                          Manuelle Steuerung
                        </button>
                        <button id="RemoteScheduleMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                          Befehle einplanen
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>

                    `;


                  }

                  if (this.remoteSubMode === "manual") {
                    btnContainer.innerHTML = `

                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="flex justify-center mb-3">
                          <button id="RemoteVerriegelung"
                            style="outline: none; box-shadow: none; position: relative;"
                            class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-red-800 text-lg transition hover:text-red-900 hover:bg-[#F2F2F2]">

                            <i class="fa-solid fa-lock text-3xl"></i>
                            <span>Maschine verriegeln</span>

                          </button>
                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>
                    `;
                  }

                  if (this.remoteSubMode === "schedule") {
                    const unlockVal = '';
                    const lockVal = '';
                    btnContainer.innerHTML = `
                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="px-8 pt-2 space-y-3 text-left w-full">
                        <label class="block text-sm font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${unlockVal}">
                        </label>

                        <label class="block text-sm font-semibold text-[#002B49]">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${lockVal}">
                        </label>

                        <button id="ScheduleSave"
                          class="mt-2 px-4 py-2 rounded-lg bg-[#4D004D] text-white font-semibold hover:bg-[#330033]">
                          Befehle speichern
                        </button>
                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>

                      <!-- Zweite Zeile: Button zentriert darunter -->
                      <div class="flex justify-center mt-2">

                          <button id="StopRemoteMode"
                            style="outline: none; box-shadow: none;"
                            class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                            <<< FERNSTEUERUNG BEENDEN >>>
                          </button>

                      </div>
                    `;

                  }

                  const btn3 = document.getElementById("RemoteVerriegelung");
                  if (btn3) {
                    btn3.addEventListener("click", () => {
                      this.RemoteLock(updated.rcuId);
                    });
                  }

                  const btn2 = document.getElementById("StopRemoteMode");
                  if (btn2) {
                    btn2.addEventListener("click", () => {
                      this.setRemoteSubMode('none');
                      this.resumeAutoRefresh();
                      this.stopRemoteMode(updated.rcuId);
                    });
                  }

                  const btn5 = document.getElementById("RemoteManualMode");
                  if (btn5) {
                    btn5.addEventListener("click", () => {
                      this.setRemoteSubMode('manual');

                    });
                  }

                  const btn6 = document.getElementById("RemoteScheduleMode");
                  if (btn6) {
                    btn6.addEventListener("click", () => {
                      this.setRemoteSubMode('schedule');
                      this.handleClick(updated);
                      this.autoRefreshPaused = true;

                    });
                  }

                  const btn7 = document.getElementById("ReturnMenu");
                  if (btn7) {
                    btn7.addEventListener("click", () => {
                      this.autoRefreshPaused = false;
                      this.setRemoteSubMode('none');
                      this.handleClick(updated);
                    });
                  }

                  const inputUnlock = document.getElementById("ScheduleUnlockTime") as HTMLInputElement | null;
                  const inputLock = document.getElementById("ScheduleLockTime") as HTMLInputElement | null;

                  const btn8 = document.getElementById("ScheduleSave");
                  if (btn8) {
                    btn8.addEventListener("click", () => {
                      this.ScheduleRemote(updated.rcuId, inputUnlock, inputLock);
                    });
                  }

                } else if (updated.status === "remote mode requested"){

                  // Animation zuvor stoppen, falls aktiv
                  this.cancelConnectingAnimation?.();
                  this.cancelConnectingAnimation = null;

                  btnContainer.innerHTML = `
                    <div id="connecting-text"
                         class="flex justify-left pt-14 px-4 text-orange-700 font-semibold text-lg rounded-lg">
                      Verbindung zur Maschine wird aufgebaut<span id="dots"></span>
                    </div>
                  `;
                  let dotCount = 0;
                  const dotsEl = document.getElementById('dots')!;

                  if (dotsEl) {
                    const interval = setInterval(() => {
                      dotCount = (dotCount + 1) % 4;
                      dotsEl.textContent = ".".repeat(dotCount);
                    }, 400);

                    // Animation stoppen, wenn Status wechselt
                    this.cancelConnectingAnimation = () => clearInterval(interval);
                  }
                } else if (updated.status === "operational"){
                  btnContainer.innerHTML = `
                    <!-- Hinweistext über Buttons -->
                    <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                      Notfallverriegelung

                      <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                    </div>

                    <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                    <div class="flex justify-center mb-3">

                        <button id="NotVerriegelung"
                          style="outline: none; box-shadow: none; position: relative;"
                          class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-red-800 text-lg transition hover:text-red-900 hover:bg-[#F2F2F2]">

                          <i class="fa-solid fa-lock text-3xl"></i>
                          <span>Maschine verriegeln</span>

                        </button>

                    </div>
                  `;

                  const btn4 = document.getElementById("NotVerriegelung");
                  if (btn4) {
                    btn4.addEventListener("click", () => {
                      this.NotfallLock(updated.rcuId);
                    });
                  }

                } else {
                  this.cancelConnectingAnimation?.();   // <--- HINZUFÜGEN
                  this.cancelConnectingAnimation = null;
                  // Button entfernen
                  btnContainer.innerHTML = `
                    <div class="flex justify-center pt-14 px-4 text-gray-700 font-semibold text-lg rounded-lg">
                    Fernsteuerung nicht verfügbar
                    </div>

                  `;

                }
              }
            }
          }
        },
        error: (err: any) => {
          this.errorMsg = err.message || 'Fehler beim Laden der RCUs';
          this.loading = false;
        }
      });
    }


    deleteRcu(id: number): void {
        Swal.fire({
          text: `Möchten Sie wirklich diese Maschine löschen?`,
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
            this.rcuService.deleteRcu(id).subscribe({
              next: () => this.loadData(),
              error: () => this.errorMsg = 'Fehler beim Löschen der RCU.'
            });
          }
        });
      }

    getMachineImage(machineName: string): { src: string; height: string } {
      if (!machineName) return { src: 'maschine.png', height: 'h-28' };

      const name = machineName.toLowerCase();

      if (name.includes('bagger')) {
        return { src: 'bagger.png', height: 'h-28' };
      } else if (name.includes('kuka')) {
        return { src: 'kuka.png', height: 'h-28' };
      } else if (name.includes('walze')) {
        return { src: 'walze.png', height: 'h-28' };
      } else {
        return { src: 'maschine.png', height: 'h-28' };
      }
    }

    getStatusColor(status?: string): string {
      switch ((status || '').toLowerCase()) {
        case 'idle': return 'text-green-600';
        case 'offline': return 'text-gray-600';
        case 'operational': return 'text-orange-700';
        case 'remote - idle': return 'text-green-600';
        case 'remote - operational': return 'text-orange-700';
        case 'remote mode requested': return 'text-[#CD853F]';
        default: return 'text-gray-500';
      }
    }

    handleClick(r: Rcu) {
      const machine = this.getMachineImage(r.name);
      const img = machine.src;
      const h = machine.height;
      const color = this.getStatusColor(r.status);

      const unlockVal = '';
      const lockVal   = '';

      Swal.fire({
        title: r.name,
        html: `
          <div style="border-bottom: 1px solid #d1d5db; margin: 10px 0 20px 0;"></div>
          <div style="height: 200px;" class="flex items-start gap-1 text-left w-full">

            <!-- Image -->
            <div class="h-full flex items-center">
              <img src="${img}" class="rounded-md h-32 px-2 min-w-[140px]" />
            </div>

            <!-- Information -->
            <div class="h-full flex flex-col justify-center min-w-[170px] pt-3">
              <div class="grid grid-cols-2 gap-y-1 gap-x-2">
                <span class="font-semibold">Cloud-ID:</span> <span>${r.id}</span>
                <span class="font-semibold">RCU-ID:</span> <span>${r.rcuId}</span>
                <span class="font-semibold">Standort:</span> <span>${r.location}</span>
              </div>
            </div>

            <!-- Status -->
            <div class="h-full flex flex-col justify-start min-w-[160px] pt-3">
              <p class="flex items-left gap-2">
                <span style="font-size:50px; font-weight: 900;" class="leading-none pt-14">→</span>
                <span id="machine-status"
                      data-id="${r.id}"
                      class="leading-none pt-20 font-semibold ${color}">
                  ${(r.status + "").toUpperCase()}
                </span>
              </p>
            </div>

          </div>
          <div style="height: 140px;" class="w-full">

            <div id="remote-btn-container">
              ${ (r.status == "inactive" || r.status == "idle") ? `
                  <button id="StartRemoteMode"
                    style="outline: none; box-shadow: none;"
                    class="px-4 py-14 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                    <<< FERNSTEUERUNG STARTEN >>>
                  </button>
                ` : ''
              }

              ${ (r.status == "Remote - idle") ? `
                  <!-- Hinweistext über Buttons -->
                  <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                    Fernsteuerung ist aktiv

                    <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                  </div>

                  ${ (this.remoteSubMode == 'none') ? `
                    <div class="flex justify-center gap-4 mb-4">
                      <button id="RemoteManualMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                        Manuelle Steuerung
                      </button>
                      <button id="RemoteScheduleMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                        Befehle einplanen
                      </button>
                    </div>

                    ` : ''
                  }

                  ${ (this.remoteSubMode == 'manual') ? `
                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="flex justify-center mb-3">

                          <button id="RemoteEntriegelung"
                            style="outline: none; box-shadow: none; position: relative;"
                            class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-[#228B22] text-lg transition hover:text-[#006400] hover:bg-[#F2F2F2]">

                            <i class="fa-solid fa-lock-open text-3xl"></i>
                            <span>Maschine entriegeln</span>

                          </button>

                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>
                    ` : ''
                  }

                  ${ (this.remoteSubMode == 'schedule') ? `
                      <div class="px-8 pt-2 space-y-3 text-left w-full">
                        <label class="block text-sm font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${unlockVal}">
                        </label>

                        <label class="block text-sm font-semibold text-[#002B49]">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime" type="datetime-local"
                                 class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${lockVal}">
                        </label>

                        <button id="ScheduleSave"
                          class="mt-2 px-4 py-2 rounded-lg bg-[#4D004D] text-white font-semibold hover:bg-[#330033]">
                          Befehle speichern
                        </button>
                      </div>

                      <div class="flex justify-left mt-2">
                        <button
                          id="ReturnMenu"
                          class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-angles-left"></i> Zurück
                        </button>
                      </div>

                    ` : ''
                  }


                  <!-- Zweite Zeile: Button zentriert darunter -->
                  <div class="flex justify-center mt-2">

                      <button id="StopRemoteMode"
                        style="outline: none; box-shadow: none;"
                        class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                        <<< FERNSTEUERUNG BEENDEN >>>
                      </button>

                  </div>

                ` : ''
              }

              ${ (r.status == "Remote - operational") ? `
                <!-- Hinweistext über Buttons -->
                <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                  Fernsteuerung ist aktiv

                  <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                </div>

                ${ (this.remoteSubMode == 'none') ? `
                  <div class="flex justify-center gap-4 mb-4">
                    <button id="RemoteManualMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                      Manuelle Steuerung
                    </button>
                    <button id="RemoteScheduleMode" class="px-4 py-2 rounded-lg text-[#002B49] font-semibold hover:text-blue-800">
                      Befehle einplanen
                    </button>
                  </div>

                  ` : ''
                }

                ${ (this.remoteSubMode == 'manual') ? `
                    <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                    <div class="flex justify-center mb-3">

                        <button id="RemoteVerriegelung"
                          style="outline: none; box-shadow: none; position: relative;"
                          class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-red-800 text-lg transition hover:text-red-900 hover:bg-[#F2F2F2]">

                          <i class="fa-solid fa-lock text-3xl"></i>
                          <span>Maschine verriegeln</span>

                        </button>

                    </div>


                    <div class="flex justify-left mt-2">
                      <button
                        id="ReturnMenu"
                        class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                        title="Zurück"
                      >
                        <i class="fas fa-angles-left"></i> Zurück
                      </button>
                    </div>
                  ` : ''
                }

                ${ (this.remoteSubMode == 'schedule') ? `
                    <div class="px-8 pt-2 space-y-3 text-left w-full">
                      <label class="block text-sm font-semibold text-[#002B49]">
                        Entriegelungszeitpunkt:
                        <input id="ScheduleUnlockTime" type="datetime-local"
                               class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${unlockVal}">
                      </label>

                      <label class="block text-sm font-semibold text-[#002B49]">
                        Verriegelungszeitpunkt:
                        <input id="ScheduleLockTime" type="datetime-local"
                               class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1" value="${lockVal}">
                      </label>

                      <button id="ScheduleSave"
                        class="mt-2 px-4 py-2 rounded-lg bg-[#4D004D] text-white font-semibold hover:bg-[#330033]">
                        Befehle speichern
                      </button>
                    </div>

                    <div class="flex justify-left mt-2">
                      <button
                        id="ReturnMenu"
                        class="mt-auto text-[#002B49] hover:text-[#002B49] transition"
                        title="Zurück"
                      >
                        <i class="fas fa-angles-left"></i> Zurück
                      </button>
                    </div>

                  ` : ''
                }

                <!-- Zweite Zeile: Button zentriert darunter -->
                <div class="flex justify-center mt-2">

                    <button id="StopRemoteMode"
                      style="outline: none; box-shadow: none;"
                      class="px-4 py-2 text-[#4D004D] font-semibold text-lg rounded-lg hover:text-[#330033] transition">
                      <<< FERNSTEUERUNG BEENDEN >>>
                    </button>

                </div>

                ` : ''
              }

              ${ (r.status == "remote mode requested") ? `
                <div class="flex justify-left pt-14 px-4 text-orange-900 font-semibold text-lg rounded-lg">
                Verbindung zur Maschine wird aufgebaut .
                </div>

                ` : ''
              }

              ${ (r.status == "operational") ? `
                <!-- Hinweistext über Buttons -->
                <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                  Notfallverriegelung

                  <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                </div>

                <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                <div class="flex justify-center mb-3">

                    <button id="NotVerriegelung"
                      style="outline: none; box-shadow: none; position: relative;"
                      class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-red-800 text-lg transition hover:text-red-900 hover:bg-[#F2F2F2]">

                      <i class="fa-solid fa-lock text-3xl"></i>
                      <span>Maschine verriegeln</span>

                    </button>

                </div>

                ` : ''
              }


              ${ (r.status == "offline") ? `
                <div class="flex justify-center pt-14 px-4 text-gray-700 font-semibold text-lg rounded-lg">
                Fernsteuerung nicht verfügbar
                </div>

                ` : ''
              }

            </div>

          </div>

        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Schließen',
        width: 600,
        color: '#002B49',
        buttonsStyling: false,

        customClass: {
          popup: 'rounded-2xl',
          container: '',
          htmlContainer: 'p-10',
          title: 'pt-14',
          cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
        },

        didClose: () => {
          this.setRemoteSubMode('none');
          this.resumeAutoRefresh();
        },


        didRender: () => {
          const btn = document.getElementById("StartRemoteMode");
          const btn1 = document.getElementById("RemoteEntriegelung");
          const btn2 = document.getElementById("StopRemoteMode");
          const btn3 = document.getElementById("RemoteVerriegelung");
          const btn4 = document.getElementById("NotVerriegelung");
          const btn5 = document.getElementById("RemoteManualMode");
          const btn6 = document.getElementById("RemoteScheduleMode");
          const btn7 = document.getElementById("ReturnMenu");
          const btn8 = document.getElementById("ScheduleSave");
          const inputUnlock = document.getElementById("ScheduleUnlockTime") as HTMLInputElement | null;
          const inputLock = document.getElementById("ScheduleLockTime") as HTMLInputElement | null;

          if (btn) {
            btn.addEventListener("click", () => {
              this.startRemoteMode(r.rcuId);
            });
          }

          if (btn1) {
            btn1.addEventListener("click", () => {
              this.RemoteUnlock(r.rcuId);
            });
          }

          if (btn2) {
            btn2.addEventListener("click", () => {
              this.stopRemoteMode(r.rcuId);
            });
          }

          if (btn3) {
            btn3.addEventListener("click", () => {
              this.RemoteLock(r.rcuId);
            });
          }

          if (btn4) {
            btn4.addEventListener("click", () => {
              this.NotfallLock(r.rcuId);
            });
          }

          if (btn5) {
            btn5.addEventListener("click", () => {
              this.setRemoteSubMode('manual');
            });
          }

          if (btn6) {
            btn6.addEventListener("click", () => {
              this.setRemoteSubMode('schedule');

            });
          }

          if (btn7) {
            btn7.addEventListener("click", () => {
              this.autoRefreshPaused = false;
              this.setRemoteSubMode('none');
            });
          }

          if (btn8) {
            btn8.addEventListener("click", () => {
              this.ScheduleRemote(r.rcuId, inputUnlock, inputLock);
            });
          }
        }
      });
    }

    startRemoteMode(rcuId: string) {
      this.rcuService.startRemoteMode(rcuId).subscribe({
        next: () => this.loadData(),
        error: () => this.errorMsg = 'Fehler beim Remote Start.'
      });

    }

    stopRemoteMode(rcuId: string) {
      this.rcuService.stopRemoteMode(rcuId).subscribe({
        next: (data: Remote) => {
          this.loadData()
        },
        error: err => {
          if (err.status === 504) {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: 'Die Maschine ist nicht erreichbar - Fernsteuerung wird verlassen',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          } else if (err.status === 0) {
            Swal.fire({
              icon: 'error',
              title: 'Verbindung fehlgeschlagen',
              text: 'Der Server ist nicht erreichbar. Bitte überprüfen Sie die Verbindung.',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });

          } else {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: `Ein unerwarteter Fehler ist aufgetreten: ${err.status}`,

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          }
        }
      });
    }

    RemoteUnlock(rcuId: string) {
      this.rcuService.remoteUnlock(rcuId).subscribe({
        next: (data: Remote) => {
          this.loadData()
        },
        error: err => {
          if (err.status === 504) {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: 'Die Maschine ist nicht erreichbar - Fernsteuerung wird verlassen',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          } else if (err.status === 0) {
            Swal.fire({
              icon: 'error',
              title: 'Verbindung fehlgeschlagen',
              text: 'Der Server ist nicht erreichbar. Bitte überprüfen Sie die Verbindung.',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });

          } else {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: `Ein unerwarteter Fehler ist aufgetreten: ${err.status}`,

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          }
        }
      });

    }

    RemoteLock(rcuId: string) {
      this.rcuService.remoteLock(rcuId).subscribe({
        next: (data: Remote) => {
          this.loadData()
        },
        error: err => {
          if (err.status === 504) {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: 'Die Maschine ist nicht erreichbar - Fernsteuerung wird verlassen',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          } else if (err.status === 0) {
            Swal.fire({
              icon: 'error',
              title: 'Verbindung fehlgeschlagen',
              text: 'Der Server ist nicht erreichbar. Bitte überprüfen Sie die Verbindung.',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });

          } else {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: `Ein unerwarteter Fehler ist aufgetreten: ${err.status}`,

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          }
        }
      });

    }

    NotfallLock(rcuId: string) {
      this.rcuService.notfallLock(rcuId).subscribe({
        next: (data: Remote) => {
          this.loadData()
        },
        error: err => {
          if (err.status === 504) {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: 'Die Maschine ist nicht erreichbar - Fernsteuerung wird verlassen',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          } else if (err.status === 0) {
            Swal.fire({
              icon: 'error',
              title: 'Verbindung fehlgeschlagen',
              text: 'Der Server ist nicht erreichbar. Bitte überprüfen Sie die Verbindung.',

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });

          } else {
            Swal.fire({
              icon: 'error',
              title: 'Fehler',
              text: `Ein unerwarteter Fehler ist aufgetreten: ${err.status}`,

              showConfirmButton: true,
              confirmButtonText: 'Ok',

              showCancelButton: false,
              buttonsStyling: false,

              customClass: {
                confirmButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
              }
            });
          }
        }
      });

    }

    ScheduleRemote(rcuId: string, inputUnlock: HTMLInputElement | null, inputLock: HTMLInputElement | null) {
      this.setRemoteSubMode('none');
      this.resumeAutoRefresh();
      const unlockVal = inputUnlock?.value || '';
      const lockVal   = inputLock?.value || '';
      if (!unlockVal && !lockVal) {
        Swal.fire({
          text: `Geben Sie mindestens eine Uhrzeit ein`,
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
        // alert('Bitte ID und Name eingeben.');
        return;
      }

      const unlockTime = unlockVal || null;
      const lockTime   = lockVal || null;


      const newProgrammed: Programmed = {
        rcuId: rcuId,
        unlockTime: unlockTime,
        lockTime: lockTime
      };

      this.rcuService.scheduleRemote(newProgrammed).subscribe({
        next: async programm => {

        },
        error: err => { this.errorMsg = err.error?.message || 'Termin Speicherung fehlgeschlagen'; }
      });


    }








}
