import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { LostItemsService } from '../../../Services/lost-items.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lost-items-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lost-items-list.component.html',
  styleUrls: ['./lost-items-list.component.css']
})
export class LostItemsListComponent implements OnInit {
  lostItems: any[] = [];

  constructor(private service: LostItemsService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getItems();
  }

  getItems() {
    this.service.getAllItems().subscribe({
      next: (res) => (this.lostItems = res),
      error: () => this.toastr.error('حدث خطأ أثناء تحميل البيانات')
    });
  }

  saveEdit(item: any) {
    this.service.updateItem(item.id, item).subscribe({
      next: () => this.toastr.success('✅ تم الحفظ'),
      error: () => this.toastr.error('❌ فشل في الحفظ')
    });
  }

  deleteItem(id: number) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      this.service.deleteItem(id).subscribe({
        next: () => {
          this.lostItems = this.lostItems.filter((x) => x.id !== id);
          this.toastr.success('🗑️ تم الحذف');
        },
        error: () => this.toastr.error('❌ فشل في الحذف')
      });
    }
  }

  exportToExcel(): void {
    // تحويل البيانات لعناوين عربية
    const exportData = this.lostItems.map(item => ({
      'التاريخ': item.date,
      'اليوم': item.day,
      'الوقت': item.time,
      'اسم المفقود': item.name,
      'المكان': item.location,
      'الكنترول': item.control,
      'مسؤول الأمن': item.securityOfficer,
      'رقم البند': item.itemCode
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المفقودات');
    XLSX.writeFile(workbook, 'المفقودات.xlsx');
  }

}
