import { EmployeeViolationService } from './../../../Services/employee-violation.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-employee-violations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-employee-violations.component.html',
  styleUrl: './show-employee-violations.component.css'
})
export class ShowEmployeeViolationsComponent implements OnInit {
  violations: any[] = [];

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private _EmployeeViolationService: EmployeeViolationService
  ) { }

  ngOnInit(): void {
    this.getViolations();
  }

  getViolations() {
    this._EmployeeViolationService.getAll().subscribe({
      next: (data: any) => this.violations = data,
      error: () => this.toastr.error('فشل في تحميل البيانات 😓')
    });
  }

  updateViolation(v: any) {
    this._EmployeeViolationService.updateViolation(v).subscribe({
      next: () => this.toastr.success('✅ تم حفظ التعديل'),
      error: () => this.toastr.error('❌ فشل في التعديل')
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
        this._EmployeeViolationService.deleteViolation(id).subscribe({
          next: () => {
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
            this.getViolations(); // أو حدث المصفوفة يدويًا لو حبيت
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }


  exportToExcel() {
    const exportData = this.violations.map(v => ({
      'التاريخ': v.date,
      'اليوم': v.day,
      'التوقيت': v.time,
      'المكان': v.location,
      'المشكلة': v.issue,
      'رقم SAP': v.sapNumber,
      'الإدارة': v.department,
      'الإجراء': v.action,
      'الكنترول': v.control,
      'المشرف': v.supervisor,
      'ملاحظات': v.notes
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'مخالفات الموظفين': worksheet },
      SheetNames: ['مخالفات الموظفين']
    };

    // استخدام writeFile مباشرة لحفظ الملف
    XLSX.writeFile(workbook, 'مخالفات_الموظفين.xlsx');

    this.toastr.success('📁 تم تصدير الملف بنجاح');
  }

}
