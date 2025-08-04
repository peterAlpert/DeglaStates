import { SharedService } from './../../../Services/shared.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ToastrService } from 'ngx-toastr';
import { MemberComplaintService } from '../../../Services/member-complaint.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-member-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-member-complaint.component.html',
  styleUrl: './show-member-complaint.component.css'
})
export class ShowMemberComplaintComponent implements OnInit {

  complaints: any[] = [];

  constructor(
    private service: MemberComplaintService,
    private _SharedService: SharedService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getComplaints();
  }

  getComplaints() {
    this.service.getComplaints().subscribe({
      next: (data: any) => this.complaints = data,
      error: () => this.toastr.error('❌ فشل في تحميل البيانات')
    });
  }

  updateComplaint(c: any) {
    this.service.updateComplaint(c.id, c).subscribe({
      next: () => this.toastr.success('✅ تم حفظ التعديل'),
      error: () => this.toastr.error('❌ فشل في التحديث')
    });
  }

  deleteComplaint(id: number) {
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
        this.service.deleteComplaint(id).subscribe({
          next: () => {
            this.complaints = this.complaints.filter(x => x.id !== id);
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
    const exportData = this.complaints.map(c => ({
      'التاريخ': c.date,
      'اليوم': c.day,
      'التوقيت': this._SharedService.convertTo12Hour(c.time),
      'المكان': c.location,
      'اسم العضو': c.memberName,
      'رقم العضوية': c.membershipNo,
      'المشكلة': c.issue,
      'مراقب الكنترول': c.control,
      'المشرف': c.supervisor,
      'الإجراء': c.action,
      'ملاحظات': c.notes
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'الشكاوى': worksheet }, SheetNames: ['الشكاوى'] };

    XLSX.writeFile(workbook, 'شكاوى_الاعضاء.xlsx');
    this.toastr.success('📁 تم تصدير الشكاوى بنجاح');

  }
}
