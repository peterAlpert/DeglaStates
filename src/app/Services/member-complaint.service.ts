import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberComplaintService {
  constructor(private http: HttpClient) { }

  addComplaint(data: any) {
    return this.http.post(`${environment.baseUrl}/MemberSuggestions`, data);
  }

  getComplaints() {
    return this.http.get(`${environment.baseUrl}/MemberSuggestions`);
  }

  updateComplaint(id: number, data: any) {
    return this.http.put(`${environment.baseUrl}/MemberSuggestions/${id}`, data);
  }

  deleteComplaint(id: number) {
    return this.http.delete(`${environment.baseUrl}/MemberSuggestions/${id}`);
  }
}
