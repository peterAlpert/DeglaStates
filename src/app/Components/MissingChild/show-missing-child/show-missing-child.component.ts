
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { MissingChildService } from '../../../Services/missing-child.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-show-missing-child',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-missing-child.component.html',
  styleUrl: './show-missing-child.component.css'
})
export class ShowMissingChildComponent implements OnInit {

  children: any[] = [];

  totalChildren = 0;
  totalSigned = 0;
  totalRejected = 0;




  constructor(
    private http: HttpClient,
    private _MissingChildService: MissingChildService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getChildren();
  }

  getChildren() {
    this._MissingChildService.getAllChildren().subscribe({
      next: (data: any[]) => {
        this.children = data;

        // ✅ ترتيب تصاعدي حسب التاريخ
        this.children.sort((a: any, b: any) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });

        this.calculateStats(); // <-- حساب الإحصائيات بعد الترتيب
      },
      error: () => this.toastr.error('❌ فشل تحميل البيانات')
    });
  }


  calculateStats() {
    this.totalChildren = this.children.length;

    this.totalSigned = this.children.filter(c =>
      c.action?.toLowerCase().includes('تم التسليم الي ولي الامر و تم توقيع اقرار')
    ).length;

    this.totalRejected = this.children.filter(c =>
      c.action?.toLowerCase().includes('تم التسليم الي ولي الامر و رفض توقيع اقرار')
    ).length;
  }

  updateChild(c: any) {
    this._MissingChildService.updateChild(c.id, c).subscribe({
      next: () => this.toastr.success('✅ تم حفظ التعديل'),
      error: () => this.toastr.error('❌ فشل التعديل')
    });
  }


  deleteChild(id: number) {
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
        this._MissingChildService.deleteChild(id).subscribe({
          next: () => {
            this.getChildren(); // تحديث القائمة بعد الحذف
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
    // إعداد جدول البيانات
    const exportData = this.children.map((c, i) => ({
      'م': i + 1,
      'التاريخ': c.date,
      'اليوم': c.day,
      'اسم الطفل': c.childName,
      'المكان': c.location,
      'اسم ولي الأمر': c.parentName,
      'رقم العضوية': c.membershipNo,
      'الكنترول': c.control,
      'المشرف': c.supervisor,
      'الإجراء': c.action,
      'ملاحظات': c.notes
    }));

    // تجهيز إحصائيات
    const total = this.children.length;
    const totalSigned = this.children.filter(c =>
      c.action?.toLowerCase().includes('تم التسليم الي ولي الامر و تم توقيع اقرار')
    ).length;

    const totalRejected = this.children.filter(c =>
      c.action?.toLowerCase().includes('تم التسليم الي ولي الامر و رفض توقيع اقرار')
    ).length;

    // إعداد شيت البيانات
    const worksheet = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });

    // إحصائيات مشفوته لليمين
    const stats = [
      ['إحصائيات الأطفال المفقودة'],
      ['الوصف', 'العدد'],
      ['اجمالي الأطفال المفقودة', total],
      ['تم توقيع اقرار', totalSigned],
      ['رفض توقيع اقرار', totalRejected],
    ];

    const shiftedStats = stats.map(row => [null, null, null, null, ...row]); // مشفوته 4 أعمدة

    // نضيف الإحصائيات بعد جدول البيانات مع صفين فاصلين
    const startRow = exportData.length + 3;
    XLSX.utils.sheet_add_aoa(worksheet, shiftedStats, { origin: { r: startRow, c: 0 } });

    // توسيع الأعمدة
    worksheet['!cols'] = [
      { wch: 5 },   // م
      { wch: 10 },  // التاريخ
      { wch: 8 },  // اليوم
      { wch: 10 },  // اسم الطفل
      { wch: 20 },  // المكان
      { wch: 15 },  // اسم ولي الأمر
      { wch: 8 },  // رقم العضوية
      { wch: 10 },  // الكنترول
      { wch: 10 },  // المشرف
      { wch: 15 },  // الإجراء
      { wch: 15 },  // ملاحظات
      { wch: 5 },   // فاصل
      { wch: 40 },  // عمود الإحصاء
      { wch: 10 }   // العدد
    ];

    // تجهيز وتحميل الملف
    const workbook: XLSX.WorkBook = {
      Sheets: { 'أطفال مفقودة': worksheet },
      SheetNames: ['أطفال مفقودة']
    };

    XLSX.writeFile(workbook, 'أطفال_مفقودة.xlsx');
    this.toastr?.success('📁 تم تصدير سجل الأطفال المفقودة بنجاح');

  }

}
