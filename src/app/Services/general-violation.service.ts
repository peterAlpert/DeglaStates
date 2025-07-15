import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneralViolationService {

  constructor(private http: HttpClient) { }

  addViolation(data: any) {
    return this.http.post(`${environment.baseUrl}/GeneralViolation`, data);
  }

  getAllViolations(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.baseUrl}/GeneralViolation`);
  }

  updateViolation(data: any) {
    return this.http.put(`${environment.baseUrl}/GeneralViolation/${data.id}`, data);
  }

  deleteViolation(id: number) {
    return this.http.delete(`${environment.baseUrl}/GeneralViolation/${id}`);
  }

  getViolationsByCategory(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.baseUrl}/GeneralViolation/by-category?type=${type}`);
  }

}
