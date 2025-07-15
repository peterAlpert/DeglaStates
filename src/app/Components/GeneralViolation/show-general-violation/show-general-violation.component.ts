import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneralViolationService } from '../../../Services/general-violation.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-show-general-violation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-general-violation.component.html',
  styleUrl: './show-general-violation.component.css'
})
export class ShowGeneralViolationComponent implements OnInit {
  allViolations: any[] = [];

  totalThisMonth = 0;
  totalNoData = 0;
  totalSmokingNoData = 0;
  totalWithData = 0;
  totalAll = 0;

  constructor(
    private _service: GeneralViolationService,
    private _toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getViolations();
  }

  getViolations() {
    this._service.getViolationsByCategory('عضو').subscribe({
      next: (data: any[]) => {
        this.allViolations = data;
        this.calculateStats();
      },
      error: () => this._toastr.error('فشل في تحميل البيانات 😓')
    });
  }

  calculateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.totalThisMonth = this.allViolations.filter(v => {
      const date = new Date(v.date);
      return date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        /مذكرة|تحرير|عمل/.test(v.action);
    }).length;

    this.totalNoData = this.allViolations.filter(v => {
      return (!v.memberName || v.memberName.trim() === '' || v.memberName.includes('لا يوجد')) &&
        (!v.membershipNo || v.membershipNo.trim() === '' || v.membershipNo.includes('لا يوجد'));
    }).length;

    this.totalSmokingNoData = this.allViolations.filter(v => {
      const noData = (!v.memberName || v.memberName.trim() === '' || v.memberName.includes('لا يوجد')) &&
        (!v.membershipNo || v.membershipNo.trim() === '' || v.membershipNo.includes('لا يوجد'));
      return noData && v.violation && v.violation.includes('تدخين');
    }).length;

    this.totalWithData = this.allViolations.filter(v => {
      return (v.memberName && v.memberName.trim() !== '' && !v.memberName.includes('لا يوجد')) &&
        (v.membershipNo && v.membershipNo.trim() !== '' && !v.membershipNo.includes('لا يوجد'));
    }).length;

    this.totalAll = this.totalNoData + this.totalSmokingNoData + this.totalWithData;
  }


  saveEdit(v: any) {
    this._service.updateViolation(v).subscribe({
      next: () => this._toastr.success('✅ تم حفظ التعديل'),
      error: () => this._toastr.error('❌ فشل في الحفظ')
    });
  }

  deleteViolation(id: number) {
    this._service.deleteViolation(id).subscribe({
      next: () => {
        this._toastr.success('🗑️ تم الحذف');
        this.getViolations();
      },
      error: () => this._toastr.error('❌ فشل في الحذف')
    });
  }


  exportToExcel(): void {
    const exportData = this.allViolations.map((v, i) => ({
      'م': i + 1,
      'التاريخ': v.date,
      'اليوم': v.day,
      'التوقيت': v.time,
      'نوع المخالفة': v.violationCategory,
      'المكان': v.location,
      'اسم العضو': v.memberName,
      'رقم العضوية': v.membershipNo,
      'صحبته': v.guests,
      'عضوية صحبتة': v.guestsMembershipNo,
      'الكنترول': v.control,
      'المشرف': v.supervisor,
      'الإجراء': v.action,
      'المخالفة': v.violation
    }));

    // أولاً: جدول البيانات
    const worksheet = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });

    // ثانياً: الإحصائيات بعد صفين فاضيين من نهاية الجدول
    const space = 2;
    const startRow = exportData.length + space + 1;

    const stats = [
      [' إحصائيات مخالفات الأعضاء'],
      ['الوصف', 'العدد'],
      [' اجمالي المذكرات خلال الشهر', this.totalThisMonth],
      [' اجمالي مخالفات متنوعه بدون بيانات', this.totalNoData],
      [' اجمالي مخالفات التدخين بدون بيانات', this.totalSmokingNoData],
      [' اجمالي المخالفات بالبيانات', this.totalWithData],
      [' الاجمالي العام', this.totalAll],
    ];

    // نضيف الإحصائيات ونشفتها يمين (من العمود الخامس مثلاً)
    const shiftedStats = stats.map(row => [null, null, null, null, ...row]); // بدأ من العمود E

    XLSX.utils.sheet_add_aoa(worksheet, shiftedStats, { origin: { r: startRow, c: 2 } });

    // توسيع الأعمدة
    worksheet['!cols'] = [
      { wch: 3 },  // م
      { wch: 10 }, // التاريخ
      { wch: 8 }, // اليوم
      { wch: 6 }, // التوقيت
      { wch: 8 }, // نوع المخالفة
      { wch: 15 }, // المكان
      { wch: 30 }, // اسم العضو
      { wch: 8 }, // رقم العضوية
      { wch: 15 }, // صحبتة
      { wch: 8 }, // عضوية صحبتة
      { wch: 10 }, // الكنترول
      { wch: 10 }, // المشرف
      { wch: 20 }, // الإجراء
      { wch: 20 }, // المخالفة
      { wch: 5 },  // فاصل إضافي
      { wch: 40 }, // عمود الإحصائية
      { wch: 10 }  // العدد
    ];

    const workbook: XLSX.WorkBook = {
      Sheets: { 'مخالفات الأعضاء': worksheet },
      SheetNames: ['مخالفات الأعضاء']
    };

    XLSX.writeFile(workbook, 'مخالفات_الأعضاء.xlsx');
    this._toastr.success('📁 تم تصدير الملف بنجاح');

  }


}
