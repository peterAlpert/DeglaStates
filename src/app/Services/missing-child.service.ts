import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MissingChildService {
  private baseUrl = `${environment.baseUrl}/LostChildren`; // ✅ عدّل الرابط لو API مختلف

  constructor(private http: HttpClient) { }

  addChild(data: any) {
    return this.http.post(`${this.baseUrl}`, data);
  }

  getAllChildren() {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  deleteChild(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  updateChild(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }
}
