import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OffensiveWordsService {
  private baseUrl = `${environment.baseUrl}/OffensiveWords`;

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<any[]>(this.baseUrl);
  }

  add(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
