import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { Observable } from 'rxjs/internal/Observable';


@Injectable({
  providedIn: 'root'
})

export class UserService {

  private baseUrl: string;
    constructor(private http: HttpClient) {
          this.baseUrl = 'http://localhost:8080/api/users';
    }

registerUser(user: User): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
}

getAllUsers(): Observable<User[]> {
  return this.http.get<User[]>(`${this.baseUrl}/list`);
}

removeUser(smartphoneId: string, userId: number){
  return this.http.post(`${this.baseUrl}/remove/user`, { smartphoneId, userId });
}

deleteUser(id: number){
  return this.http.delete(`${this.baseUrl}/delete/${id}`);
}


}
