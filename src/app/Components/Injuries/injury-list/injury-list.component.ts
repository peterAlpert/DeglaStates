import { Component, OnInit } from '@angular/core';
import { InjuryService } from '../../../Services/injury.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
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


  exportToExcel(): void {
    const exportData = this.injuries.map(i => ({
      'التاريخ': i.date,
      'اليوم': i.day,
      'التوقيت': i.time,
      'المكان': i.location,
      'اسم العضو المصاب': i.memberName,
      'رقم العضوية': i.membershipNo,
      'نوع الإصابة': i.injuryType,
      'سبب الإصابة': i.cause,
      'الإجراء': i.action,
      'مسؤول السلامة': i.safetyOfficer,
      'المسعف/الطبيب': i.medic,
      'الكنترول': i.control,
      'المشرف': i.supervisor,
      'ملاحظات': i.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    const statsStartRow = exportData.length + 3;

    const stats = [
      ['الوصف', 'العدد'],
      ['إجمالي الذهاب إلى العيادة (إصابات خفيفة)', this.statistics.toClinic],
      ['إجمالي الذهاب إلى العيادة والتوجيه للمستشفى (إصابات حرجة)', this.statistics.toHospital],
      ['إجمالي احضار المسعف فقط (إصابات خفيفة)', this.statistics.medicOnly],
      ['إجمالي رفض احضار المسعف وتم الاطمئنان عليه', this.statistics.refused],
      ['إجمالي احضار المسعف ثم الذهاب للعيادة (إصابات حرجة)', this.statistics.medicThenClinic],
      ['الإجمالي العام', this.statistics.total]
    ];

    XLSX.utils.sheet_add_aoa(ws, stats, { origin: { r: statsStartRow, c: 4 } });

    ws['!cols'] = Array(14).fill({ wch: 20 });
    ws['!cols'][6] = { wch: 50 }; // وصف الإحصائية
    ws['!cols'][7] = { wch: 15 }; // العدد

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الإصابات');
    XLSX.writeFile(wb, 'سجل_الإصابات.xlsx');
  }


}
