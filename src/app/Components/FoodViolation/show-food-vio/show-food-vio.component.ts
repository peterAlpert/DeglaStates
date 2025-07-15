import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { GeneralViolationService } from '../../../Services/general-violation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-food-vio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-food-vio.component.html',
  styleUrl: './show-food-vio.component.css'
})
export class ShowFoodVioComponent {
  allViolations: any[] = [];

  constructor(
    private _service: GeneralViolationService,
    private _toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getViolations();
  }


  totalNoDataWithAction: number = 0;
  totalWithData: number = 0;
  totalThisMonth: number = 0;
  totalAll: number = 0;

  calculateStatistics() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.totalNoDataWithAction = this.allViolations.filter(v =>
      (
        !v.memberName || v.memberName.trim() === '' || v.memberName.includes('لا يوجد')
      ) &&
      (
        !v.membershipNo || v.membershipNo.trim() === '' || v.membershipNo.includes('لا يوجد')
      ) &&
      v.action?.includes('استجابة')
    ).length;

    this.totalWithData = this.allViolations.filter(v =>
      v.memberName && !v.memberName.includes('لا يوجد') &&
      v.membershipNo && !v.membershipNo.includes('لا يوجد')
    ).length;

    this.totalThisMonth = this.allViolations.filter(v => {
      const action = v.action || '';
      const hasKeyword = action.includes('مذكرة') || action.includes('تحرير') || action.includes('عمل');

      if (!hasKeyword) return false;

      const date = new Date(v.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    this.totalAll = this.allViolations.length;
  }


  getViolations() {
    this._service.getViolationsByCategory('أكل').subscribe({
      next: (data: any[]) => {
        this.allViolations = data;
        this.calculateStatistics(); // <-- احسب الإحصائيات
      },
      error: () => this._toastr.error('فشل في تحميل البيانات 😓')
    });
  }


  saveEdit(v: any) {
    this._service.updateViolation(v).subscribe({
      next: () => this._toastr.success('✅ تم حفظ التعديل'),
      error: () => this._toastr.error('❌ فشل في الحفظ')
    });
  }

  deleteViolation(id: number) {
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
        this._service.deleteViolation(id).subscribe({
          next: () => {
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
            this.getViolations();
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }


  exportToExcel(): void {
    const exportData = this.allViolations.map((v, i) => ({
      'م': i + 1,
      'التاريخ': v.date,
      'اليوم': v.day,
      'الوقت': v.time,
      'نوع المخالفة': v.violationCategory,
      'المكان': v.location,
      'اسم العضو': v.memberName,
      'العضوية': v.membershipNo,
      'صحبته': v.guests,
      'عضوية صحبتة': v.guestsMembershipNo,
      'الكنترول': v.control,
      'المشرف': v.supervisor,
      'الإجراء': v.action,
      'المخالفة': v.violation
    }));

    // تحويل جدول المخالفات إلى ورقة
    const ws = XLSX.utils.json_to_sheet(exportData);

    // تحديد مكان بداية جدول الإحصائيات بعد آخر صف + 3 سطور
    const startRow = exportData.length + 3;

    // جدول الإحصائيات بشكل يدوي (AOA = Array of Arrays)
    const statsRows = [
      ['الوصف', 'العدد'],
      ['اجمالي مخالفات الاكل بدون بيانات وتمت الاستجابه', this.totalNoDataWithAction],
      ['اجمالي مخالفات الاكل بالبيانات', this.totalWithData],
      ['اجمالي المذكرات خلال الشهر', this.totalThisMonth],
      ['الاجمالي العام', this.totalAll]
    ];

    // إضافة جدول الإحصائيات داخل نفس الورقة
    XLSX.utils.sheet_add_aoa(ws, statsRows, { origin: { r: startRow, c: 5 } });

    // توسيع الأعمدة
    ws['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 10 },
      { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 25 }
    ];

    const workbook: XLSX.WorkBook = {
      Sheets: { 'مخالفات الأكل': ws },
      SheetNames: ['مخالفات الأكل']
    };

    XLSX.writeFile(workbook, 'مخالفات_الأكل.xlsx');
    this._toastr.success('📁 تم تصدير الملف بنجاح');

  }


}
