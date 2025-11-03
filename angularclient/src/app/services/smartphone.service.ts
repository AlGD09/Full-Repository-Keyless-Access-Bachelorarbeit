import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Smartphone } from '../model/smartphone';
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


  }
