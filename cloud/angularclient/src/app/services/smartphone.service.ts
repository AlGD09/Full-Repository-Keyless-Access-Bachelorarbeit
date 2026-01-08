import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Smartphone } from '../model/smartphone';
import { User } from '../model/user';
import { Observable } from 'rxjs/internal/Observable';


@Injectable({
  providedIn: 'root'
})

export class SmartphoneService {

  private baseUrl: string;
  constructor(private http: HttpClient) {
        this.baseUrl = 'http://localhost:8080/api/devices';
  }

registerSmartphone(phone: Smartphone): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, phone);
}

// Liste anzeigen
getAll(): Observable<Smartphone[]> {
  return this.http.get<Smartphone[]>(`${this.baseUrl}/list`);
}

assignUsers(smartphoneId: number, userIds: number[]): Observable<Smartphone> {
    return this.http.post<Smartphone>(`${this.baseUrl}/assign/users`, { smartphoneId, userIds });
}

getAssignedUsers(id: number): Observable<User[]> {
  return this.http.get<User[]>(`${this.baseUrl}/${id}/users`);
}

// Auth-Token anfordern (Login)
requestToken(deviceId: string, userName: string, secretHash: string): Observable<{ auth_token: string }> {
  return this.http.post<{ auth_token: string }>(`${this.baseUrl}/request`, { deviceId, userName, secretHash });
}

deleteSmartphone(id: number) {
  return this.http.delete(`${this.baseUrl}/delete/${id}`);
}

removeSmartphone(rcuId: string, smartphoneId: number) {
  return this.http.post(`${this.baseUrl}/remove/smartphone`, { rcuId, smartphoneId });
}

blockSmartphone(deviceId: string) {
  return this.http.post(`${this.baseUrl}/block/smartphone`, { deviceId });
}

unblockSmartphone(deviceId: string) {
  return this.http.post(`${this.baseUrl}/unblock/smartphone`, { deviceId });
}


  }
