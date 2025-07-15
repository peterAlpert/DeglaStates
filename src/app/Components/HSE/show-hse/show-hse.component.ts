import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { HSEService } from '../../../Services/hse.service';
import { HSE } from '../../../Interfaces/hse';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-hse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-hse.component.html',
  styleUrl: './show-hse.component.css'
})
export class ShowHSEComponent implements OnInit {
  hseList: HSE[] = [];

  constructor(private _service: HSEService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getHSEData();
  }

  getHSEData() {
    this._service.getAllHSE().subscribe({
      next: data => this.hseList = data,
      error: () => this.toastr.error('فشل تحميل البيانات')
    });
  }

  updateHSE(h: HSE) {
    this._service.updateHSE(h).subscribe({
      next: () => this.toastr.success('✅ تم الحفظ'),
      error: () => this.toastr.error('❌ فشل في التعديل')
    });
  }

  deleteHSE(id: number) {
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
        this._service.deleteHSE(id).subscribe({
          next: () => {
            this.hseList = this.hseList.filter(item => item.id !== id);
            Swal.fire('تم الحذف!', '✅ تم حذف السجل بنجاح.', 'success');
          },
          error: () => {
            Swal.fire('خطأ', '❌ فشل في حذف السجل.', 'error');
          }
        });
      }
    });
  }


  exportToExcel(): void {
    const exportData = this.hseList.map(h => ({
      'التاريخ': h.date,
      'اليوم': h.day,
      'التوقيت': h.time,
      'القطاع': h.sector,
      'متابعة السلامة': h.description,
      'الكنترول': h.control,
      'المشرف': h.supervisor,
      'موظف السلامة': h.safetyEmployee,
      'الإجراء': h.action,
      'ملاحظات': h.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { 'سجل HSE': worksheet }, SheetNames: ['سجل HSE'] };


    XLSX.writeFile(workbook, 'سجل_HSE.xlsx');
    this.toastr?.success('📁 تم تصدير سجل HSE بنجاح');

  }
}
