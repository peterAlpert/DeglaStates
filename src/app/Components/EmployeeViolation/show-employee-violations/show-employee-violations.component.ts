import { EmployeeViolationService } from './../../../Services/employee-violation.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { environment } from '../../../../environments/environment';

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
    this._EmployeeViolationService.deleteViolation(id).subscribe({
      next: () => {
        this.toastr.success('🗑️ تم الحذف بنجاح');
        this.getViolations();
      },
      error: () => this.toastr.error('⚠️ فشل في الحذف')
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
    const workbook: XLSX.WorkBook = { Sheets: { 'مخالفات الموظفين': worksheet }, SheetNames: ['مخالفات الموظفين'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'مخالفات_الموظفين.xlsx');
  }
}
