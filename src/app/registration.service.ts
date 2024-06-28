import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private apiUrl = 'http://localhost:8080/api/registrations';

  constructor(private http: HttpClient) { }

  getParticipants(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/event/${eventId}`);
  }

  register(userName: string, eventId: number): Observable<any> {
    const registration = { username: userName, eventid: eventId };
    return this.http.post<any>(this.apiUrl, registration);
  }
}
