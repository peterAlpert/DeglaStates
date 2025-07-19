// show-place-vio.component.ts
import { Component, OnInit } from '@angular/core';
import { PlaceViolationService } from '../../../Services/place-violation.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { PlaceViolation } from '../../../Interfaces/place-violation';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-place-vio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-place-vio.component.html',
  styleUrl: './show-place-vio.component.css'
})
export class ShowPlaceVioComponent implements OnInit {
  violations: any[] = [];
  storeStats: { store: string, count: number, warnings: number }[] = [];
  totalViolations: number = 0;
  totalWarnings: number = 0;

  storeList: string[] = [
    'تريتس', 'بطاطس و زلابيه', 'معمورتي', 'دو اند كو', 'تشيكانا', 'فورتي',
    'ميكس مارت', 'اكسيسوريس', 'المختار', 'قصر نابولي', 'ابو عوف', 'كيري',
    'سرايا العرب', 'حواء', 'كارسوس', 'نسله', 'بكره', 'كاندي'
  ];

  constructor(
    private _PlaceViolationService: PlaceViolationService,
    private _ToastrService: ToastrService
  ) { }

  ngOnInit() {
    this.getViolations();
  }

  getViolations() {
    this._PlaceViolationService.getViolations().subscribe({
      next: (data: any) => {
        this.violations = data;
        this.calcStats();
      },
      error: () => this._ToastrService.error('فشل في تحميل البيانات 😓')
    });
  }

  calcStats() {
    const statsMap = new Map<string, { count: number; warnings: number }>();

    for (const store of this.storeList) {
      statsMap.set(store, { count: 0, warnings: 0 });
    }

    for (const v of this.violations) {
      const store = v.store || 'غير معروف';
      const action = v.action || '';

      if (!statsMap.has(store)) {
        statsMap.set(store, { count: 0, warnings: 0 });
      }

      statsMap.get(store)!.count++;
      if (action.includes('انذار') || action.includes('إنذار')) {
        statsMap.get(store)!.warnings++;
      }
    }

    this.storeStats = Array.from(statsMap.entries()).map(([store, data]) => ({
      store,
      count: data.count,
      warnings: data.warnings
    }));

    this.totalViolations = this.storeStats.reduce((sum, s) => sum + s.count, 0);
    this.totalWarnings = this.storeStats.reduce((sum, s) => sum + s.warnings, 0);
  }

  updateViolation(v: PlaceViolation) {
    this._PlaceViolationService.putViolations(v).subscribe({
      next: () => this._ToastrService.success('✅ تم حفظ التعديل بنجاح'),
      error: () => this._ToastrService.error('❌ فشل في تحديث البيانات')
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
        this._PlaceViolationService.deleteViolation(id).subscribe({
          next: () => {
            this.violations = this.violations.filter(v => v.id !== id);
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }

  selectedStore: string = '';
  filteredViolations: any[] = [];

  getFilteredViolations() {
    if (!this.selectedStore) {
      return this.violations;
    }
    return this.violations.filter(v => v.store === this.selectedStore);
  }

  clearFilter() {
    this.selectedStore = '';
  }


  exportToExcel(): void {
    const dataTable = this.violations.map((v, index) => ({
      'رقم': index + 1,
      'تاريخ': v.date,
      'اليوم': v.day,
      'التوقيت': v.time,
      'المكان': v.location,
      'اسم المحل': v.store,
      'الكنترول': v.control,
      'المشرف': v.supervisor,
      'المخالفة': v.violationType || v.violation,
      'الإجراء': v.action
    }));

    // 🟡 تنسيق جدول الإحصائيات
    const statsTable: any[] = [];

    // عنوان كبير كصف مستقل في الإحصائيات
    statsTable.push({
      ' ': '', 'اسم المحل': '📊 إحصائيات مخالفات المحلات', 'عدد المخالفات': '', 'عدد الإنذارات': ''
    });

    // صف فارغ للفصل
    statsTable.push({});

    // كل المحلات
    this.storeStats.forEach(s => {
      statsTable.push({
        ' ': '',
        'اسم المحل': s.store,
        'عدد المخالفات': s.count,
        'عدد الإنذارات': s.warnings
      });
    });

    // إجمالي
    statsTable.push({
      ' ': '',
      'اسم المحل': 'الإجمالي',
      'عدد المخالفات': this.totalViolations,
      'عدد الإنذارات': this.totalWarnings
    });

    // إنشاء الشيت
    const wsData = XLSX.utils.json_to_sheet(dataTable);

    // 🟢 أضف جدول الإحصائيات بعد جدول البيانات بـ سطرين
    const startRow = dataTable.length + 3;
    XLSX.utils.sheet_add_json(wsData, statsTable, {
      origin: { r: startRow, c: 0 }
    });

    // تنسيق الأعمدة يدويًا
    wsData['!cols'] = [
      { wch: 5 },   // رقم
      { wch: 12 },  // تاريخ
      { wch: 10 },  // اليوم
      { wch: 10 },  // التوقيت
      { wch: 20 },  // المكان
      { wch: 20 },  // اسم المحل
      { wch: 15 },  // الكنترول
      { wch: 15 },  // المشرف
      { wch: 30 },  // نوع المخالفة
      { wch: 35 },  // الإجراء
      { wch: 30 },  // عمود زائد (لإحصائيات المحلات)
      { wch: 25 },  // اسم المحل في الإحصائيات
      { wch: 20 },  // عدد المخالفات
      { wch: 20 }   // عدد الإنذارات
    ];


    // ✅ اضبط اتجاه الشيت من اليمين لليسار
    wsData['!rtl'] = true;

    const workbook: XLSX.WorkBook = {
      Sheets: { 'سجل المخالفات': wsData },
      SheetNames: ['سجل المخالفات']
    };

    XLSX.writeFile(workbook, 'سجل_المخالفات.xlsx');
    this._ToastrService?.success("تم تصدير سجل مخالفات المحلات ")
  }


}
