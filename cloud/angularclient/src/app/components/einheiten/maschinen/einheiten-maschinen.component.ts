import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RcuService } from '../../../services/rcu.service';
import { Rcu } from '../../../model/rcu';
import { Remote } from '../../../model/remote';
import { Programmed } from '../../../model/programmed';
import Swal from 'sweetalert2';

type RemoteSubMode = 'manual' | 'schedule' | 'none';
type AutoRefreshState = Record<string, boolean>;

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

    schedules: { rcuId: string; unlockTime: string; lockTime: string }[] = [];

    // Status
    loading = false;
    errorMsg = '';

    private cancelConnectingAnimation: (() => void) | null = null;


    private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

    // Wird benutzt, um nur die Popup-UI (Buttons, Inputs) zu "pausieren"
    // – NICHT mehr den gesamten loadData()-Aufruf.
    //private autoRefreshPaused = false;
    private autoRefreshPaused: AutoRefreshState = {};
    private setAutoRefreshPaused(rcuId: string, paused: boolean) {
      this.autoRefreshPaused[rcuId] = paused;
    }
    // GETTER
    private isAutoRefreshPaused(rcuId: string): boolean {
      return this.autoRefreshPaused[rcuId] ?? false;
    }

    private setRemoteSubMode(rcuId: string, mode: RemoteSubMode) {
      const map = JSON.parse(localStorage.getItem("remoteSubMode") || "{}");
      map[rcuId] = mode;
      localStorage.setItem("remoteSubMode", JSON.stringify(map));
    }

    private getRemoteSubMode(rcuId: string): RemoteSubMode | null {
      const map = JSON.parse(localStorage.getItem("remoteSubMode") || "{}");
      return map[rcuId] ?? null;
    }

    private deleteRemoteSubMode(rcuId: string) { // Wird nicht verwendet, kann aber später beim Löschen einer Maschine benutzt werden (grosses System)
      const map = JSON.parse(localStorage.getItem("remoteSubMode") || "{}");

      if (rcuId in map) {
        delete map[rcuId];
        localStorage.setItem("remoteSubMode", JSON.stringify(map));
      }
    }


    // Beim Anzeigen im unteren Teil
    private formatDateTime(value: string | null): string {
      if (!value || value === "-") return "-";

      const d = new Date(value);
      if (isNaN(d.getTime())) return value;

      const pad = (n: number) => n.toString().padStart(2, "0");

      const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

      return `${time} · ${date}`;
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
          this.schedules = [];



          this.loading = false;

          // --- LIVE UPDATE IM SWEETALERT POPUP ---
          const statusEl = document.getElementById("machine-status");

          // Wenn der Schedule-Modus aktiv ist (autoRefreshPaused == true),
          // dann NICHT die Popup-Buttons/Inputs überschreiben.
          if (statusEl) {
            const rcuId = Number(statusEl.getAttribute("data-id"));
            const updated = data.find(x => x.id === rcuId);

            if (updated) {  // que exista en el pop up
              const infoContainer = document.getElementById("schedule-info-container");

              if (updated.status === "Remote - idle" || updated.status === "Remote - operational") {
                this.rcuService.getScheduledRcu(updated.rcuId).subscribe({
                    next: (programms: Programmed[]) => {

                      let setUnlock = "";
                      let setLock = "";

                      if (!programms || programms.length === 0) {
                        this.schedules = this.schedules.filter(x => x.rcuId !== updated.rcuId);
                        this.schedules.push({
                          rcuId: updated.rcuId || "-",
                          unlockTime: "-",
                          lockTime: "-"
                        });
                        setUnlock = "-";
                        setLock = "-";

                      } else {
                        //ggf. später mehrere Programms pro RCU erlauben
                        const last = programms[0];  // erstes Element nehmen
                        this.schedules = this.schedules.filter(x => x.rcuId !== updated.rcuId);
                        this.schedules.push({
                          rcuId: updated.rcuId || "-",
                          unlockTime: last.unlockTime || "-",
                          lockTime: last.lockTime || "-"
                        });
                        setUnlock = last.unlockTime || "-";
                        setLock = last.lockTime || "-";
                      }
                      if (infoContainer) {
                        if (setUnlock === "-" && setLock === "-") {
                          infoContainer.innerHTML = `

                          `;
                        } else {
                          const unlockText = this.formatDateTime(setUnlock);
                          const lockText = this.formatDateTime(setLock);
                          infoContainer.innerHTML = `
                            <div class="mt-8 border-l-4 border-blue-600 rounded text-[15px] text-gray-700">
                              <div class="text-left text-[#002B49] font-semibold text-lg pl-4 pt-3 mb-2 w-full">
                                Geplante Befehle
                              </div>

                              <div class="flex items-center justify-between">

                                <div class="flex flex-col justify-center">
                                  <p class="pl-5 mb-2 text-left">
                                    <span class="text-base text-[#002B49] font-medium">Entriegelungszeitpunkt:</span>
                                    <button id="unlockTimeBtn"
                                      class="text-gray-900 font-light px-3 ${unlockText !== "-" ? "hover:text-red-600 cursor-pointer" : "cursor-default"}"
                                      ${unlockText === "-" ? "disabled" : ""}>
                                      ${unlockText}
                                    </button>
                                  </p>

                                  <p class="pl-5 text-left">
                                    <span class="text-base text-[#002B49] font-medium">Verriegelungszeitpunkt:</span>
                                    <button id="lockTimeBtn"
                                      class="text-gray-900 font-light px-3 ${lockText !== "-" ? "hover:text-red-600 cursor-pointer" : "cursor-default"}"
                                      ${lockText === "-" ? "disabled" : ""}>
                                      ${lockText}
                                    </button>
                                  </p>
                                </div>

                                <button id="deleteTime" class="text-red-600 hover:text-red-800 text-xl flex items-center">
                                  <i class="fas fa-trash"></i>
                                </button>

                              </div>
                            </div>
                          `;

                          const btn9 = document.getElementById("deleteTime");
                          if (btn9) {
                            btn9.addEventListener("click", () => {
                              this.deleteTimes(updated.rcuId);
                            });
                          }

                          // Nur klicken, wenn Wert ≠ "-"
                          if (unlockText !== "-") {
                            document.getElementById("unlockTimeBtn")?.addEventListener("click", () => {
                              this.deleteUnlock(updated.rcuId);
                            });
                          }

                          if (lockText !== "-") {
                            document.getElementById("lockTimeBtn")?.addEventListener("click", () => {
                              this.deleteLock(updated.rcuId);
                            });
                          }

                        }
                      }

                    },
                    error: () => {
                      this.schedules.push({
                        rcuId: updated.rcuId || '-',
                        unlockTime: '-',
                        lockTime: '-'
                      });

                    }

                })
              }

              // STATUS aktualisieren
              statusEl.innerText = (updated.status + "").toUpperCase();
              statusEl.className =
                "leading-none pt-20 font-semibold " + this.getStatusColor(updated.status);

              // BUTTON aktualisieren
              const btnContainer = document.getElementById("remote-btn-container");

              // Back Up Aktualisierungen, wenn autoRefreshPaused set ist
              /*if (updated.status === "Remote - operational" && this.isAutoRefreshPaused(updated.rcuId) && this.getRemoteSubMode(updated.rcuId) === "manual") {
                this.handleClick(updated);
                this.setAutoRefreshPaused(updated.rcuId, false);
              }*/

              if (this.getRemoteSubMode(updated.rcuId) === "schedule" && !this.isAutoRefreshPaused(updated.rcuId)) {
                this.setAutoRefreshPaused(updated.rcuId, true);
              }

              if (updated.status === "offline" && this.isAutoRefreshPaused(updated.rcuId)) {
                // this.handleClick(updated);
                this.setAutoRefreshPaused(updated.rcuId, false);
              }

              if (updated.status === "idle" && this.isAutoRefreshPaused(updated.rcuId)) {
                // this.handleClick(updated);
                this.setAutoRefreshPaused(updated.rcuId, false);
              }

              // Button Bereich bei bestimmten Fällen nicht aktualisieren (Date set + erstes manual - wegen unbekannter Glitch)
              if (btnContainer && !this.isAutoRefreshPaused(updated.rcuId)) {

                if (updated.status === "idle") {

                  if (infoContainer) {
                    infoContainer.innerHTML = ``;
                  }

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


                  if (this.getRemoteSubMode(updated.rcuId) === "none") {
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

                  if (this.getRemoteSubMode(updated.rcuId) === "manual") {
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

                      <!-- Zurück -->
                      <div class="px-10">
                        <button
                          id="ReturnMenu"
                          class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-caret-left text-sm"></i>
                          <span>Zurück</span>
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

                  if (this.getRemoteSubMode(updated.rcuId) === "schedule") {
                    const unlockVal = '';
                    const lockVal = '';
                    btnContainer.innerHTML = `
                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <div class="px-10 pt-2 space-y-3 text-left w-full">
                        <label class="block text-base font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${unlockVal}">
                        </label>

                        <label class="block text-base font-semibold text-[#002B49] pb-2">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${lockVal}">
                        </label>

                        <!-- Button-Zeile -->
                        <div class="flex justify-between items-center mb-4">

                          <!-- Zurück -->
                          <button
                            id="ReturnMenu"
                            class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                            title="Zurück"
                          >
                            <i class="fas fa-caret-left text-sm"></i>
                            <span>Zurück</span>
                          </button>

                          <!-- Speichern -->
                          <button id="ScheduleSave"
                            class="bg-[#002B49] hover:bg-blue-700 text-white text-base font-semibold w-44 h-7 rounded-lg shadow transition">
                            Befehle speichern
                          </button>
                        </div>


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
                      // this.setAutoRefreshPaused(updated.rcuId, false);
                      this.RemoteUnlock(updated.rcuId);

                    });
                  }

                  const btn2 = document.getElementById("StopRemoteMode");
                  if (btn2) {
                    btn2.addEventListener("click", () => {
                      this.setRemoteSubMode(updated.rcuId, 'none');
                      // this.setAutoRefreshPaused(updated.rcuId, false);
                      this.stopRemoteMode(updated.rcuId);
                    });
                  }

                  const btn5 = document.getElementById("RemoteManualMode");
                  if (btn5) {
                    btn5.addEventListener("click", () => {


                      this.setRemoteSubMode(updated.rcuId, 'manual');
                      // this.handleClick(updated);
                      // this.setAutoRefreshPaused(updated.rcuId, true);
                      //this.handleClick(updated);
                      //this.autoRefreshPaused = true;
                      // await new Promise(resolve => setTimeout(resolve, 10000));
                      //this.autoRefreshPaused = false;
                      //this.setRemoteSubMode('manual');
                      /*this.handleClick(updated);
                      this.autoRefreshPaused = false;*/

                    });
                  }

                  const btn6 = document.getElementById("RemoteScheduleMode");
                  if (btn6) {
                    btn6.addEventListener("click", () => {
                      this.setRemoteSubMode(updated.rcuId, 'schedule');
                      this.setAutoRefreshPaused(updated.rcuId, true);
                      this.handleClick(updated);


                    });
                  }

                  const btn7 = document.getElementById("ReturnMenu");
                  if (btn7) {
                    btn7.addEventListener("click", () => {
                      this.setAutoRefreshPaused(updated.rcuId, false);
                      this.setRemoteSubMode(updated.rcuId, 'none');
                      // this.handleClick(updated);
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
                  if (this.getRemoteSubMode(updated.rcuId) === "none") {
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

                  if (this.getRemoteSubMode(updated.rcuId) === "manual") {
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

                      <!-- Zurück -->
                      <div class="px-10">
                        <button
                          id="ReturnMenu"
                          class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-caret-left text-sm"></i>
                          <span>Zurück</span>
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

                  if (this.getRemoteSubMode(updated.rcuId) === "schedule") {
                    const unlockVal = '';
                    const lockVal = '';
                    btnContainer.innerHTML = `
                      <!-- Hinweistext über Buttons -->
                      <div class="text-left text-[#002B49] font-semibold text-xl mb-2 pt-2 px-10 w-full">
                        Fernsteuerung ist aktiv

                        <div style="border-bottom: 1px dotted #d1d5db; margin: 5px 0 22px 0; width: 100%; display: block;"></div>
                      </div>

                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="px-10 pt-2 space-y-3 text-left w-full">
                        <label class="block text-base font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${unlockVal}">
                        </label>

                        <label class="block text-base font-semibold text-[#002B49] pb-2">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${lockVal}">
                        </label>

                        <!-- Button-Zeile -->
                        <div class="flex justify-between items-center mb-4">

                          <!-- Zurück -->
                          <button
                            id="ReturnMenu"
                            class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                            title="Zurück"
                          >
                            <i class="fas fa-caret-left text-sm"></i>
                            <span>Zurück</span>
                          </button>

                          <!-- Speichern -->
                          <button id="ScheduleSave"
                            class="bg-[#002B49] hover:bg-blue-700 text-white text-base font-semibold w-44 h-7 rounded-lg shadow transition">
                            Befehle speichern
                          </button>
                        </div>


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
                      this.setRemoteSubMode(updated.rcuId, 'none');
                      // this.setAutoRefreshPaused(updated.rcuId, false);
                      this.stopRemoteMode(updated.rcuId);
                    });
                  }

                  const btn5 = document.getElementById("RemoteManualMode");
                  if (btn5) {
                    btn5.addEventListener("click", () => {
                      this.setRemoteSubMode(updated.rcuId, 'manual');

                    });
                  }

                  const btn6 = document.getElementById("RemoteScheduleMode");
                  if (btn6) {
                    btn6.addEventListener("click", () => {
                      this.setRemoteSubMode(updated.rcuId, 'schedule');
                      this.setAutoRefreshPaused(updated.rcuId, true);
                      this.handleClick(updated);

                    });
                  }

                  const btn7 = document.getElementById("ReturnMenu");
                  if (btn7) {
                    btn7.addEventListener("click", () => {
                      this.setRemoteSubMode(updated.rcuId, 'none');
                      this.setAutoRefreshPaused(updated.rcuId, false);
                      // this.handleClick(updated);
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

                  if (infoContainer) {
                    infoContainer.innerHTML = ``;
                  }
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


      let submode = this.getRemoteSubMode(r.rcuId);

      if (submode === null) {
        this.setRemoteSubMode(r.rcuId, 'none');
        submode = 'none';
      }

      // Nicht unbedingt nötig, saubere Initialisierung
      if (!(r.rcuId in this.autoRefreshPaused)) {
        this.setAutoRefreshPaused(r.rcuId, false);
      }


      // Swal.close();
      // await new Promise(res => setTimeout(res, 10));

      const machine = this.getMachineImage(r.name);
      const img = machine.src;
      const h = machine.height;
      const color = this.getStatusColor(r.status);
      const s = this.schedules.find(x => x.rcuId === r.rcuId);
      const setUnlock = s?.unlockTime ?? "-";
      const setLock = s?.lockTime ?? "-";
      const unlockText = this.formatDateTime(setUnlock);
      const lockText = this.formatDateTime(setLock);
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
          <div class="w-full">

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

                  ${ (this.getRemoteSubMode(r.rcuId) == 'none') ? `
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

                  ${ (this.getRemoteSubMode(r.rcuId) == 'manual') ? `
                      <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                      <div class="flex justify-center mb-3">

                          <button id="RemoteEntriegelung"
                            style="outline: none; box-shadow: none; position: relative;"
                            class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-[#228B22] text-lg transition hover:text-[#006400] hover:bg-[#F2F2F2]">

                            <i class="fa-solid fa-lock-open text-3xl"></i>
                            <span>Maschine entriegeln</span>

                          </button>

                      </div>

                      <!-- Zurück -->
                      <div class="px-10">
                        <button
                          id="ReturnMenu"
                          class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-caret-left text-sm"></i>
                          <span>Zurück</span>
                        </button>
                      </div>
                    ` : ''
                  }

                  ${ (this.getRemoteSubMode(r.rcuId) == 'schedule') ? `


                      <div class="px-10 pt-2 space-y-3 text-left w-full">
                        <label class="block text-base font-semibold text-[#002B49]">
                          Entriegelungszeitpunkt:
                          <input id="ScheduleUnlockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${unlockVal}">
                        </label>

                        <label class="block text-base font-semibold text-[#002B49] pb-2">
                          Verriegelungszeitpunkt:
                          <input id="ScheduleLockTime"
                                 type="datetime-local"
                                 class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                 value="${lockVal}">
                        </label>

                        <!-- Button-Zeile -->
                        <div class="flex justify-between items-center mb-4">

                          <!-- Zurück -->
                          <button
                            id="ReturnMenu"
                            class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                            title="Zurück"
                          >
                            <i class="fas fa-caret-left text-sm"></i>
                            <span>Zurück</span>
                          </button>

                          <!-- Speichern -->
                          <button id="ScheduleSave"
                            class="bg-[#002B49] hover:bg-blue-700 text-white text-base font-semibold w-44 h-7 rounded-lg shadow transition">
                            Befehle speichern
                          </button>
                        </div>


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

                ${ (this.getRemoteSubMode(r.rcuId) == 'none') ? `
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

                ${ (this.getRemoteSubMode(r.rcuId) == 'manual') ? `
                    <!-- Erste Zeile: Entriegeln / Verriegeln nebeneinander -->
                    <div class="flex justify-center mb-3">

                        <button id="RemoteVerriegelung"
                          style="outline: none; box-shadow: none; position: relative;"
                          class="px-4 group flex items-center justify-center gap-4 bg-[#E0E0E0]/10 w-42 h-12 rounded-lg text-red-800 text-lg transition hover:text-red-900 hover:bg-[#F2F2F2]">

                          <i class="fa-solid fa-lock text-3xl"></i>
                          <span>Maschine verriegeln</span>

                        </button>

                    </div>


                    <!-- Zurück -->
                    <div class="px-10">
                      <button
                        id="ReturnMenu"
                        class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                        title="Zurück"
                      >
                        <i class="fas fa-caret-left text-sm"></i>
                        <span>Zurück</span>
                      </button>
                    </div>
                  ` : ''
                }

                ${ (this.getRemoteSubMode(r.rcuId) == 'schedule') ? `
                    <div class="px-10 pt-2 space-y-3 text-left w-full">
                      <label class="block text-base font-semibold text-[#002B49]">
                        Entriegelungszeitpunkt:
                        <input id="ScheduleUnlockTime"
                               type="datetime-local"
                               class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                               value="${unlockVal}">
                      </label>

                      <label class="block text-base font-semibold text-[#002B49] pb-2">
                        Verriegelungszeitpunkt:
                        <input id="ScheduleLockTime"
                               type="datetime-local"
                               class="text-sm font-light mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                               value="${lockVal}">
                      </label>

                      <!-- Button-Zeile -->
                      <div class="flex justify-between items-center mb-4">

                        <!-- Zurück -->
                        <button
                          id="ReturnMenu"
                          class="flex items-center space-x-0 text-[15px] text-[#002B49] text-left hover:text-[#002B49] transition"
                          title="Zurück"
                        >
                          <i class="fas fa-caret-left text-sm"></i>
                          <span>Zurück</span>
                        </button>

                        <!-- Speichern -->
                        <button id="ScheduleSave"
                          class="bg-[#002B49] hover:bg-blue-700 text-white text-base font-semibold w-44 h-7 rounded-lg shadow transition">
                          Befehle speichern
                        </button>
                      </div>


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

          <div class="w-full px-10">

            <div id="schedule-info-container">
                ${ (setUnlock != "-" && setLock != "-" && (r.status == "Remote - operational" || r.status == "Remote - idle")) ? `

                  <div class="mt-8 border-l-4 border-blue-600 rounded text-[15px] text-gray-700">
                    <div class="text-left text-[#002B49] font-semibold text-lg pl-4 pt-3 mb-2 w-full">
                      Geplante Befehle
                    </div>

                    <div class="flex items-center justify-between">

                      <div class="flex flex-col justify-center">
                        <p class="pl-5 mb-2 text-left">
                          <span class="text-base text-[#002B49] font-medium">Entriegelungszeitpunkt:</span>
                          <button id="unlockTimeBtn"
                            class="text-gray-900 font-light px-3 ${unlockText !== "-" ? "hover:text-red-600 cursor-pointer" : "cursor-default"}"
                            ${unlockText === "-" ? "disabled" : ""}>
                            ${unlockText}
                          </button>
                        </p>

                        <p class="pl-5 text-left">
                          <span class="text-base text-[#002B49] font-medium">Verriegelungszeitpunkt:</span>
                          <button id="lockTimeBtn"
                            class="text-gray-900 font-light px-3 ${lockText !== "-" ? "hover:text-red-600 cursor-pointer" : "cursor-default"}"
                            ${lockText === "-" ? "disabled" : ""}>
                            ${lockText}
                          </button>
                        </p>
                      </div>

                      <button id="deleteTime" class="text-red-600 hover:text-red-800 text-xl flex items-center">
                        <i class="fas fa-trash"></i>
                      </button>

                    </div>
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
          htmlContainer: 'p-10 inner-scroll',
          title: 'pt-14',
          cancelButton: 'text-[#002B49] font-semibold px-4 py-2 rounded-lg hover:text-blue-800 transition'
        },

        didClose: () => {
          //this.setRemoteSubMode('none');  -> none = handle beginnt mit none, aber nun manual aus anderer Maschine -> glitch bei mehreren
          // this.resumeAutoRefresh();
        },


        didRender: () => {

          const inner = document.querySelector('.inner-scroll') as HTMLElement;
          if (inner) {
            inner.style.maxHeight = "70vh";     // Höhe begrenzen
            inner.style.overflowY = "auto";     // Scroll NUR innen
            inner.style.paddingRight = "12px";  // verhindert scrollbar über Rundung
          }

          const btn = document.getElementById("StartRemoteMode");
          const btn1 = document.getElementById("RemoteEntriegelung");
          const btn2 = document.getElementById("StopRemoteMode");
          const btn3 = document.getElementById("RemoteVerriegelung");
          const btn4 = document.getElementById("NotVerriegelung");
          const btn5 = document.getElementById("RemoteManualMode");
          const btn6 = document.getElementById("RemoteScheduleMode");
          const btn7 = document.getElementById("ReturnMenu");
          const btn8 = document.getElementById("ScheduleSave");
          const btn9 = document.getElementById("deleteTime");
          const inputUnlock = document.getElementById("ScheduleUnlockTime") as HTMLInputElement | null;
          const inputLock = document.getElementById("ScheduleLockTime") as HTMLInputElement | null;

          if (btn) {
            btn.addEventListener("click", () => {
              this.startRemoteMode(r.rcuId);
            });
          }

          if (btn1) {
            btn1.addEventListener("click", () => {
              // this.setAutoRefreshPaused(r.rcuId, false);
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
              this.setRemoteSubMode(r.rcuId, 'manual');
              // this.handleClick(r);
            });
          }

          if (btn6) {
            btn6.addEventListener("click", () => {
              this.setRemoteSubMode(r.rcuId, 'schedule');
              this.setAutoRefreshPaused(r.rcuId, true);

            });
          }

          if (btn7) {
            btn7.addEventListener("click", () => {
              this.setAutoRefreshPaused(r.rcuId, false);
              this.setRemoteSubMode(r.rcuId, 'none');
            });
          }

          if (btn8) {
            btn8.addEventListener("click", () => {
              this.ScheduleRemote(r.rcuId, inputUnlock, inputLock);
            });
          }

          if (btn9) {
            btn9.addEventListener("click", () => {
              this.deleteTimes(r.rcuId);
            });
          }

          // Nur klicken, wenn Wert nicht "-"
          if (unlockText !== "-") {
            document.getElementById("unlockTimeBtn")?.addEventListener("click", () => {
              this.deleteUnlock(r.rcuId);
            });
          }

          if (lockText !== "-") {
            document.getElementById("lockTimeBtn")?.addEventListener("click", () => {
              this.deleteLock(r.rcuId);
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
      // this.setRemoteSubMode('none');
      // this.resumeAutoRefresh();
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

    deleteTimes(rcuId: string) {
      this.rcuService.deleteScheduleRemote(rcuId).subscribe({
        next: () => {

        },
        error: err => { }
      });
    }

    deleteUnlock(rcuId: string) {
      this.rcuService.deleteUnlockTime(rcuId).subscribe({
        next: () => {

        },
        error: err => { }
      });

    }

    deleteLock(rcuId: string) {
      this.rcuService.deleteLockTime(rcuId).subscribe({
        next: () => {

        },
        error: err => { }
      });

    }








}
