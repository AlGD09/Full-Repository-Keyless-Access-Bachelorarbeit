import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Rcu } from '../model/rcu';
import { Smartphone } from '../model/smartphone';
import { Event } from '../model/event';
import { Anomaly } from '../model/anomaly';

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

  }





