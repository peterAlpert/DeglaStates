import { Component, OnInit } from '@angular/core';
import { InjuryService } from '../../../Services/injury.service';
import { ToastrService } from 'ngx-toastr';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Injury } from '../../../Interfaces/injury';

@Component({
  selector: 'app-injury-list',
  standalone: true,
  templateUrl: './injury-list.component.html',
  styleUrl: './injury-list.component.css',
  imports: [CommonModule, FormsModule]
})
export class InjuryListComponent implements OnInit {
  injuries: Injury[] = [];

  statistics = {
    toClinic: 0,
    toHospital: 0,
    medicOnly: 0,
    refused: 0,
    medicThenClinic: 0,
    total: 0
  };


  constructor(
    private injuryService: InjuryService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getInjuries();
  }

  getInjuries() {
    this.injuryService.getAll().subscribe({
      next: data => {
        this.injuries = data;
        this.calculateStats();
      },
      error: () => this.toastr.error('فشل في تحميل البيانات 😓')
    });
  }

  calculateStats() {
    const counts = {
      toClinic: 0,
      toHospital: 0,
      medicOnly: 0,
      refused: 0,
      medicThenClinic: 0,
      total: this.injuries.length
    };

    for (let i of this.injuries) {
      const a = i.action?.trim() || '';
      if (a.includes('العياده') && a.includes('الازم') && !a.includes('المستشفي')) counts.toClinic++;
      if (a.includes('المستشفي')) counts.toHospital++;
      if (a === 'تم احضار المسعف وتم عمل اللازم') counts.medicOnly++;
      if (a.includes('رفض') || a.includes('الاطمئنان')) counts.refused++;
      if (a.includes('احضار المسعف') && a.includes('العياده')) counts.medicThenClinic++;
    }

    this.statistics = counts;
  }


  updateInjury(injury: Injury) {
    this.injuryService.update(injury).subscribe({
      next: () => this.toastr.success('✅ تم الحفظ'),
      error: () => this.toastr.error('❌ فشل في التحديث')
    });
  }

  deleteInjury(id: number) {
    this.injuryService.delete(id).subscribe({
      next: () => {
        this.toastr.success('🗑️ تم الحذف');
        this.getInjuries();
      },
      error: () => this.toastr.error('❌ فشل في الحذف')
    });
  }


  exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('الإصابات');

    // ✅ 1. تعريف الأعمدة بثبات العرض
    sheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'اليوم', key: 'day', width: 10 },
      { header: 'التوقيت', key: 'time', width: 10 },
      { header: 'المكان', key: 'location', width: 15 },
      { header: 'اسم العضو المصاب', key: 'memberName', width: 15 },
      { header: 'رقم العضوية', key: 'membershipNo', width: 12 },
      { header: 'نوع الإصابة', key: 'injuryType', width: 10 },
      { header: 'سبب الإصابة', key: 'cause', width: 25 },
      { header: 'الإجراء', key: 'action', width: 35 },
      { header: 'مسؤول السلامة', key: 'safetyOfficer', width: 15 },
      { header: 'المسعف/الطبيب', key: 'medic', width: 18 },
      { header: 'الكنترول', key: 'control', width: 15 },
      { header: 'المشرف', key: 'supervisor', width: 15 },
      { header: 'ملاحظات', key: 'notes', width: 15 }
    ];

    // ✅ 2. إدخال البيانات
    this.injuries.forEach(i => {
      sheet.addRow({
        date: i.date,
        day: i.day,
        time: i.time,
        location: i.location,
        memberName: i.memberName,
        membershipNo: i.membershipNo,
        injuryType: i.injuryType,
        cause: i.cause,
        action: i.action,
        safetyOfficer: i.safetyOfficer,
        medic: i.medic,
        control: i.control,
        supervisor: i.supervisor,
        notes: i.notes
      });
    });

    // ✅ 3. تنسيق العناوين
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // ✅ 4. سطر فاصل رمادي
    const separatorRow = sheet.addRow(['']);
    separatorRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };

    // ✅ 5. عنوان جدول الإحصائيات (في منتصف الصفحة)
    const statsTitle = sheet.addRow(['', '', '', '', '', '', '📊 إحصائيات الإصابات']);
    statsTitle.font = { bold: true, size: 14 };
    statsTitle.alignment = { horizontal: 'center' };

    // ✅ 6. جدول الإحصائيات
    const stats = [
      ['إجمالي الذهاب إلى العيادة (إصابات خفيفة)', this.statistics.toClinic],
      ['إجمالي الذهاب إلى العيادة والتوجيه للمستشفى (إصابات حرجة)', this.statistics.toHospital],
      ['إجمالي احضار المسعف فقط (إصابات خفيفة)', this.statistics.medicOnly],
      ['إجمالي رفض احضار المسعف وتم الاطمئنان عليه', this.statistics.refused],
      ['إجمالي احضار المسعف ثم الذهاب للعيادة (إصابات حرجة)', this.statistics.medicThenClinic],
      ['الإجمالي العام', this.statistics.total]
    ];

    stats.forEach(item => {
      const row = sheet.addRow(['', '', '', '', '', '', item[0], item[1]]);
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 7) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3CD' } // أصفر فاتح
          };
          cell.alignment = { horizontal: 'center' };
          cell.font = { bold: true };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    });

    // ✅ 7. توسيع أعمدة الإحصائيات
    sheet.getColumn(7).width = 50; // الوصف
    sheet.getColumn(8).width = 20; // العدد

    // ✅ 8. حفظ الملف
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'سجل_الإصابات.xlsx');
    });
  }


}
