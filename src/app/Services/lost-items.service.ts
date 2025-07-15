import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class LostItemsService {

  constructor(private http: HttpClient) { }

  addItem(data: any) {
    return this.http.post(`${environment.baseUrl}/LostItems`, data);
  }

  getAllItems() {
    return this.http.get<any[]>(`${environment.baseUrl}/LostItems`);
  }

  updateItem(id: number, data: any) {
    return this.http.put(`${environment.baseUrl}/LostItems/${id}`, data);
  }

  deleteItem(id: number) {
    return this.http.delete(`${environment.baseUrl}/LostItems/${id}`);
  }
}
