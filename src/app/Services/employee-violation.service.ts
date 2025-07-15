import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeViolationService {

  constructor(private http: HttpClient) { }

  // إضافة مخالفة
  addViolation(data: any): Observable<any> {
    return this.http.post(`${environment.baseUrl}/StaffViolations`, data);
  }

  // الحصول على كل المخالفات
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.baseUrl}/StaffViolations`);
  }

  // تعديل مخالفة
  updateViolation(data: any): Observable<any> {
    return this.http.put(`${environment.baseUrl}/StaffViolations/${data.id}`, data);
  }

  // حذف مخالفة
  deleteViolation(id: number): Observable<any> {
    return this.http.delete(`${environment.baseUrl}/StaffViolations/${id}`);
  }
}
