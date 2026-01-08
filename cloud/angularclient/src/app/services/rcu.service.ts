import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Rcu } from '../model/rcu';
import { Smartphone } from '../model/smartphone';
import { Event } from '../model/event';
import { Anomaly } from '../model/anomaly';
import { Remote } from '../model/remote';
import { Programmed } from '../model/programmed';

@Injectable({
  providedIn: 'root'
})

export class RcuService {

  private baseUrl: string;
  constructor(private http: HttpClient) {
        this.baseUrl = 'http://localhost:8080/api/rcu';
  }

registerRcu(rcu: Rcu): Observable<Rcu> {
    return this.http.post<Rcu>(`${this.baseUrl}/register`, rcu);
}

getAllRcus(): Observable<Rcu[]> {
    return this.http.get<Rcu[]>(`${this.baseUrl}/list`);
}

assignSmartphones(rcuId: number, smartphoneIds: number[]): Observable<Rcu> {
    return this.http.post<Rcu>(`${this.baseUrl}/assign/smartphones`, { rcuId, smartphoneIds });
}

getAssignedSmartphones(rcuId: string): Observable<Smartphone[]> {
    return this.http.get<Smartphone[]>(`${this.baseUrl}/${rcuId}/smartphones`);
}

deleteRcu(id: number) {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
}

getGraphEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.baseUrl}/events/graph`);
}

getRcuEvents(rcuId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.baseUrl}/events/${rcuId}`);
}

getAllAnomalies(): Observable<Anomaly[]> {
    return this.http.get<Anomaly[]>(`${this.baseUrl}/events/anomalies`);
}

getRcuAnomalies(rcuId: string): Observable<Anomaly> {
    return this.http.get<Anomaly>(`${this.baseUrl}/events/anomaly/${rcuId}`);
}

deleteAnomaly(id: number) {
    return this.http.delete(`${this.baseUrl}/events/delete/${id}`);
}

deleteAllAnomalies() {
    return this.http.delete(`${this.baseUrl}/events/delete/anomalies`)
}

startRemoteMode(rcuId: string) {
  return this.http.post<void>(`${this.baseUrl}/start/remote/${rcuId}`, {});
}

stopRemoteMode(rcuId: string) {
  return this.http.post<Remote>(`${this.baseUrl}/remote/exit/${rcuId}`, {});
}

remoteUnlock(rcuId: string): Observable<Remote> {
  return this.http.post<Remote>(`${this.baseUrl}/remote/unlock/${rcuId}`, {});
}

remoteLock(rcuId: string): Observable<Remote> {
  return this.http.post<Remote>(`${this.baseUrl}/remote/lock/${rcuId}`, {});
}

notfallLock(rcuId: string): Observable<Remote> {
  return this.http.post<Remote>(`${this.baseUrl}/notfall/lock/${rcuId}`, {});
}

scheduleRemote(programmed: Programmed): Observable<Programmed> {
  return this.http.post<Programmed>(`${this.baseUrl}/remote/schedule`, programmed);
}

deleteScheduleRemote(rcuId: string) {
  return this.http.delete(`${this.baseUrl}/delete/schedule/${rcuId}`);
}

deleteUnlockTime(rcuId: string) {
  return this.http.delete(`${this.baseUrl}/delete/unlock/${rcuId}`);
}

deleteLockTime(rcuId: string) {
  return this.http.delete(`${this.baseUrl}/delete/lock/${rcuId}`);
}

getScheduledRcu(rcuId: string): Observable<Programmed[]> {
  return this.http.get<Programmed[]>(`${this.baseUrl}/schedule/${rcuId}`);
}

  }





