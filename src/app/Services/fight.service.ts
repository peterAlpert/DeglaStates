import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FightService {

  private baseUrl = `${environment.baseUrl}/Fights`;

  constructor(private http: HttpClient) { }

  // ✅ إضافة مشاجرة
  addFight(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  // ✅ الحصول على كل المشاجرات
  getFights() {
    return this.http.get<any[]>(this.baseUrl);
  }

  // ✅ تعديل مشاجرة
  updateFight(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // ✅ حذف مشاجرة
  deleteFight(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
