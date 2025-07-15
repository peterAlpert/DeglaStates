import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { MemberComplaintService } from '../../../Services/member-complaint.service';

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
    this.service.deleteComplaint(id).subscribe({
      next: () => {
        this.toastr.success('🗑️ تم الحذف');
        this.complaints = this.complaints.filter(x => x.id !== id);
      },
      error: () => this.toastr.error('❌ فشل في الحذف')
    });
  }

  exportToExcel() {
    const exportData = this.complaints.map(c => ({
      'اليوم': c.day,
      'التوقيت': c.time,
      'المكان': c.location,
      'اسم العضو': c.memberName,
      'رقم العضوية': c.membershipNumber,
      'المشكلة': c.problem,
      'مراقب الكنترول': c.controlSupervisor,
      'المشرف': c.supervisor,
      'الإجراء': c.action,
      'ملاحظات': c.notes
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'الشكاوى': worksheet }, SheetNames: ['الشكاوى'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'شكاوى_الاعضاء.xlsx');
  }
}
