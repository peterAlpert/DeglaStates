import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HSE } from '../Interfaces/hse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HSEService {

  private baseUrl = `${environment.baseUrl}/HSE`;

  constructor(private http: HttpClient) { }

  addHSE(data: HSE) {
    return this.http.post(this.baseUrl, data);
  }

  getAllHSE() {
    return this.http.get<HSE[]>(this.baseUrl);
  }

  updateHSE(hse: HSE) {
    return this.http.put(`${this.baseUrl}/${hse.id}`, hse);
  }

  deleteHSE(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
