// show-place-vio.component.ts
import { Component, OnInit } from '@angular/core';
import { PlaceViolationService } from '../../../Services/place-violation.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { PlaceViolation } from '../../../Interfaces/place-violation';
import Swal from 'sweetalert2';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

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


  // exportToExcel(): void {
  //   const dataTable = this.violations.map((v, index) => ({
  //     'رقم': index + 1,
  //     'تاريخ': v.date,
  //     'اليوم': v.day,
  //     'التوقيت': v.time,
  //     'المكان': v.location,
  //     'اسم المحل': v.store,
  //     'الكنترول': v.control,
  //     'المشرف': v.supervisor,
  //     'المخالفة': v.violationType || v.violation,
  //     'الإجراء': v.action
  //   }));

  //   // 🟡 تنسيق جدول الإحصائيات
  //   const statsTable: any[] = [];

  //   // عنوان كبير كصف مستقل في الإحصائيات
  //   statsTable.push({
  //     ' ': '', 'اسم المحل': '📊 إحصائيات مخالفات المحلات', 'عدد المخالفات': '', 'عدد الإنذارات': ''
  //   });

  //   // صف فارغ للفصل
  //   statsTable.push({});

  //   // كل المحلات
  //   this.storeStats.forEach(s => {
  //     statsTable.push({
  //       ' ': '',
  //       'اسم المحل': s.store,
  //       'عدد المخالفات': s.count,
  //       'عدد الإنذارات': s.warnings
  //     });
  //   });

  //   // إجمالي
  //   statsTable.push({
  //     ' ': '',
  //     'اسم المحل': 'الإجمالي',
  //     'عدد المخالفات': this.totalViolations,
  //     'عدد الإنذارات': this.totalWarnings
  //   });

  //   // إنشاء الشيت
  //   const wsData = XLSX.utils.json_to_sheet(dataTable);

  //   // 🟢 أضف جدول الإحصائيات بعد جدول البيانات بـ سطرين
  //   const startRow = dataTable.length + 3;
  //   XLSX.utils.sheet_add_json(wsData, statsTable, {
  //     origin: { r: startRow, c: 0 }
  //   });

  //   // تنسيق الأعمدة يدويًا
  //   wsData['!cols'] = [
  //     { wch: 5 },   // رقم
  //     { wch: 12 },  // تاريخ
  //     { wch: 10 },  // اليوم
  //     { wch: 10 },  // التوقيت
  //     { wch: 20 },  // المكان
  //     { wch: 20 },  // اسم المحل
  //     { wch: 15 },  // الكنترول
  //     { wch: 15 },  // المشرف
  //     { wch: 30 },  // نوع المخالفة
  //     { wch: 35 },  // الإجراء
  //     { wch: 30 },  // عمود زائد (لإحصائيات المحلات)
  //     { wch: 25 },  // اسم المحل في الإحصائيات
  //     { wch: 20 },  // عدد المخالفات
  //     { wch: 20 }   // عدد الإنذارات
  //   ];


  //   const workbook: XLSX.WorkBook = {
  //     Sheets: { 'سجل المخالفات': wsData },
  //     SheetNames: ['سجل المخالفات']
  //   };

  //   XLSX.writeFile(workbook, 'سجل_المخالفات.xlsx');
  //   this._ToastrService?.success("تم تصدير سجل مخالفات المحلات ")
  // }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const fileUrl = '/assets/origenal.xlsx';

    fetch(fileUrl)
      .then(res => res.arrayBuffer())
      .then(async buffer => {
        await workbook.xlsx.load(buffer);

        const sheet = workbook.worksheets[0]; // أول شيت
        let startRow = 2; // الصف الأول للهيدر، نبدأ من الصف 2

        // ✏️ كتابة البيانات الأساسية
        this.violations.forEach((v, i) => {
          const row = sheet.getRow(startRow + i);
          row.getCell(1).value = i + 1;
          row.getCell(2).value = v.date;
          row.getCell(3).value = v.day;
          row.getCell(4).value = v.time;
          row.getCell(5).value = v.location;
          row.getCell(6).value = v.store;
          row.getCell(7).value = v.control;
          row.getCell(8).value = v.supervisor;
          row.getCell(9).value = v.violationType || v.violation;
          row.getCell(10).value = v.action;
          row.commit();
        });

        // 🧮 كتابة جدول الإحصائيات بعد البيانات + سطرين
        const statsStart = startRow + this.violations.length + 2;
        let current = statsStart;

        // عنوان
        let titleRow = sheet.getRow(current++);
        titleRow.getCell(2).value = '📊 إحصائيات مخالفات المحلات';
        titleRow.font = { bold: true };
        titleRow.commit();

        current++; // صف فاصل

        // بيانات الإحصائيات
        this.storeStats.forEach(s => {
          const row = sheet.getRow(current++);
          row.getCell(2).value = s.store;
          row.getCell(3).value = s.count;
          row.getCell(4).value = s.warnings;
          row.commit();
        });

        // الإجمالي
        const totalRow = sheet.getRow(current++);
        totalRow.getCell(2).value = 'الإجمالي';
        totalRow.getCell(3).value = this.totalViolations;
        totalRow.getCell(4).value = this.totalWarnings;
        totalRow.font = { bold: true };
        totalRow.commit();

        // 📏 توسيع الأعمدة يدويًا
        sheet.columns = [
          { width: 5 },   // رقم
          { width: 12 },  // تاريخ
          { width: 10 },  // اليوم
          { width: 10 },  // التوقيت
          { width: 20 },  // المكان
          { width: 20 },  // اسم المحل
          { width: 15 },  // الكنترول
          { width: 15 },  // المشرف
          { width: 30 },  // نوع المخالفة
          { width: 35 },  // الإجراء
        ];

        const blob = await workbook.xlsx.writeBuffer();
        FileSaver.saveAs(new Blob([blob]), 'سجل_المخالفات.xlsx');
        this._ToastrService?.success("✅ تم تصدير سجل مخالفات المحلات");
      })
      .catch(err => {
        console.error('❌ فشل في تحميل الملف:', err);
        this._ToastrService?.error("فشل التصدير");
      });
  }



}
