import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:8080/api/feedbacks';

  constructor(private http: HttpClient) { }

  getFeedbacks(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/event/${eventId}`);
  }

  addFeedback(feedback: { eventid: number, username: string, rating: number, comments: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, feedback);
  }
}
