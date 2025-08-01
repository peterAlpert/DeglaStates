
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { OffensiveWordsService } from '../../../Services/offensive-words.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-offensive-words-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offensive-words-view.component.html'
})
export class OffensiveWordsViewComponent {
  records: any[] = [];

  constructor(
    private http: HttpClient,
    private servics: OffensiveWordsService,
    private toastr: ToastrService) {
    this.getRecords();
  }

  getRecords() {
    this.servics.getAll()
      .subscribe({
        next: data => this.records = data,
        error: () => this.toastr.error('فشل في جلب البيانات')
      });
  }

  updateRecord(record: any) {
    this.servics.update(record.id, record)
      .subscribe({
        next: () => this.toastr.success('✅ تم الحفظ'),
        error: () => this.toastr.error('❌ فشل في الحفظ')
      });
  }

  deleteRecord(id: number) {
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
        this.servics.delete(id).subscribe({
          next: () => {
            this.records = this.records.filter(r => r.id !== id);
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }


  exportToExcel() {
    const exportData = this.records.map((r, i) => ({
      'م': i + 1,
      'اسم العضو': r.memberName,
      'رقم العضوية': r.membershipNo,
      'السن': r.age,
      'المكان': r.location,
      'الكنترول': r.control,
      'الإجراء': r.action,
      'ملاحظات': r.notes
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    worksheet['!cols'] = [
      { wch: 3 },   // م
      { wch: 12 },  // اسم العضو
      { wch: 8 },  // رقم العضوية
      { wch: 5 },  // السن
      { wch: 15 },  // المكان
      { wch: 10 },  // الكنترول
      { wch: 20 },  // الإجراء
      { wch: 15 }   // ملاحظات
    ];
    const workbook: XLSX.WorkBook = {
      Sheets: { 'الألفاظ الخارجة': worksheet },
      SheetNames: ['الألفاظ الخارجة']
    };

    XLSX.writeFile(workbook, 'سجل_الألفاظ_الخارجة.xlsx');
    this.toastr?.success('📁 تم تصدير سجل الألفاظ الخارجة');
  }
}
