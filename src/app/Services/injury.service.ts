// src/app/Services/injury.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Injury } from '../Interfaces/injury';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InjuryService {

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Injury[]>(`${environment.baseUrl}/Injury`);
  }

  add(injury: Injury) {
    return this.http.post(`${environment.baseUrl}/Injury`, injury);
  }

  update(injury: Injury) {
    return this.http.put(`${environment.baseUrl}/Injury/${injury.id}`, injury);
  }

  delete(id: number) {
    return this.http.delete(`${environment.baseUrl}/Injury/${id}`);
  }
}
