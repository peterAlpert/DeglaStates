import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PlaceViolation } from '../Interfaces/place-violation';

@Injectable({
  providedIn: 'root'
})
export class PlaceViolationService {

  // private baseUrl = 'https://localhost:7159/api/PlaceViolation'; // عدّل الرابط حسب الاستضافة

  constructor(private _HttpClient: HttpClient) { }

  addViolation(data: PlaceViolation) {
    return this._HttpClient.post(`${environment.baseUrl}/PlaceViolation`, data);
  }

  getViolations() {
    return this._HttpClient.get<PlaceViolation[]>(`${environment.baseUrl}/PlaceViolation`);
  }

  putViolations(v: PlaceViolation) {
    return this._HttpClient.put(`${environment.baseUrl}/PlaceViolation/${v.id}`, v)
  }

  deleteViolation(id: number) {
    return this._HttpClient.delete(`${environment.baseUrl}/PlaceViolation/${id}`);
  }
}
