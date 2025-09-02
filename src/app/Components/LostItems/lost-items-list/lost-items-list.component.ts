import { SharedService } from './../../../Services/shared.service';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { LostItemsService } from '../../../Services/lost-items.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lost-items-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lost-items-list.component.html',
  styleUrls: ['./lost-items-list.component.css']
})
export class LostItemsListComponent implements OnInit {
  lostItems: any[] = [];

  constructor(
    private service: LostItemsService,
    private _SharedService: SharedService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getItems();
  }

  getItems() {
    this.service.getAllItems().subscribe({
      next: (res) => {
        // ترتيب حسب التاريخ من الأحدث إلى الأقدم
        this.lostItems = res.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.calculateStatistics();
      },
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
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف هذا السجل نهائيًا!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deleteItem(id).subscribe({
          next: () => {
            this.lostItems = this.lostItems.filter((x) => x.id !== id);
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }

  statistics: { [key: string]: number } = {};

  calculateStatistics() {
    const categories: { [key: string]: string[] } = {
      'موبايل': ['موبايل', 'موبيل', 'هاتف', 'موبايلات'],
      'كارنية عضوية': ['كارنية', 'عضوية'],
      'فيزا': ['كارت', 'بنك', 'فيزا'],
      'محفظة': ['محفظة', 'محفظه'],
      'شنطة': ['شنطة', 'شنطه', 'حقيبة'],
      'نقود': ['نقود', 'فلوس', 'مبلغ', 'مال', 'جنيه'],
      'هافربورد': ['هافربورد', 'سكوتر', 'اسكوتر', 'بتناج'],
      'مفتاح': ['مفتاح', 'مفاتيح'],
      'نظارة': ['نظارة', 'نضارة'],
      'هيدفون': ['سماعات', 'ايربودز', 'هيدفون'],
      'ذهب': ['انسيال', 'غوشيه', 'سلسله', 'خاتم'],
      // أضف كلمات مفتاحية حسب الحاجة
    };

    // تصفير الإحصائية
    this.statistics = {};

    for (let item of this.lostItems) {
      const name = item.itemName?.toLowerCase() || '';
      for (let category in categories) {
        if (categories[category].some(keyword => name.includes(keyword))) {
          this.statistics[category] = (this.statistics[category] || 0) + 1;
          break; // أول فئة تنطبق تكفي
        }
      }
    }
  }



  exportToExcel(): void {
    // تحويل البيانات لعناوين عربية
    const exportData = this.lostItems.map(item => ({
      'التاريخ': item.date,
      'اليوم': item.day,
      'الشهر': 'أغسطس',  // العمود الجديد
      'الوقت': this._SharedService.convertTo12Hour(item.time),
      'اسم المفقود': item.itemName,
      'المكان': item.location,
      'الكنترول': item.control,
      'مسؤول الأمن': item.securityOfficer,
      'رقم البند': item.itemNumber
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المفقودات');
    XLSX.writeFile(workbook, 'المفقودات.xlsx');
  }

}
