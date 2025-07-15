import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FightService } from '../../../Services/fight.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-show-fight',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './show-fight.component.html',
  styleUrl: './show-fight.component.css'
})
export class ShowFightComponent implements OnInit {
  fights: any[] = [];

  totalFights = 0;
  totalViolentResolved = 0;
  totalSimple = 0;
  totalMemos = 0;

  constructor(
    private fightService: FightService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getFights();
  }

  getFights() {
    this.fightService.getFights().subscribe({
      next: (data) => {
        this.fights = data;
        this.calculateStats(); // 🧠 نحسب الإحصائيات
      },
      error: () => this.toastr.error('فشل في تحميل المشاجرات 😓')
    });
  }

  calculateStats() {
    this.totalFights = this.fights.length;

    this.totalViolentResolved = this.fights.filter(f =>
      f.action?.toLowerCase().includes('تم الصلح')
    ).length;

    this.totalMemos = this.fights.filter(f =>
      f.action?.toLowerCase().includes('تحرير') ||
      f.action?.toLowerCase().includes('توقيع') ||
      f.action?.toLowerCase().includes('مذكرة')
    ).length;

    this.totalSimple = this.totalFights - this.totalViolentResolved;
  }

  updateFight(fight: any) {
    this.fightService.updateFight(fight.id, fight).subscribe({
      next: () => this.toastr.success('✅ تم الحفظ بنجاح'),
      error: () => this.toastr.error('❌ فشل في التحديث')
    });
  }

  deleteFight(id: number) {
    this.fightService.deleteFight(id).subscribe({
      next: () => {
        this.toastr.success('🗑️ تم الحذف');
        this.getFights();
      },
      error: () => this.toastr.error('❌ فشل في الحذف')
    });
  }

  exportToExcel() {
    const exportData = this.fights.map((f, i) => ({
      'م': i + 1,
      'التاريخ': f.date,
      'اليوم': f.day,
      'التوقيت': f.time,
      'المكان': f.location,
      'الطرف الأول': f.firstPerson,
      'عضوية الأول': f.firstPersonMembership,
      'صحبتة الأول': f.firstPersonGuests,
      'الطرف الثاني': f.secondPerson,
      'عضوية الثاني': f.secondPersonMembership,
      'صحبتة الثاني': f.secondPersonMembership,
      'الكنترول': f.control,
      'المشرف': f.supervisor,
      'الإجراء': f.action
    }));

    // 1. أنشئ ورقة بالإكسيل من جدول البيانات
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 2. أضف صفين فاضيين بعد جدول البيانات
    const startRow = exportData.length + 3; // +3 عشان نسيب صفين

    // 3. الإحصائيات
    const stats = [
      ['إحصائيات المشاجرات'],
      ['الوصف', 'العدد'],
      ['إجمالي عدد المشاجرات', this.totalFights],
      ['مشاجرات عنيفة تم فيها الصلح', this.totalViolentResolved],
      ['مشاجرات بسيطة', this.totalSimple],
      ['عدد المذكرات', this.totalMemos]
    ];

    // 4. أضف الإحصائيات بعد الجدول + متشفتة (نبدأ من العمود رقم 3 يعني العمود D)
    XLSX.utils.sheet_add_aoa(worksheet, stats, {
      origin: { r: startRow, c: 4 } // r = الصف، c = العمود (0-based, يعني c=3 هي العمود D)
    });

    // 5. توسيع الأعمدة كلها
    worksheet['!cols'] = [
      { wch: 5 },   // م
      { wch: 12 },  // التاريخ
      { wch: 7 },  // اليوم
      { wch: 8 },  // التوقيت
      { wch: 20 },  // المكان
      { wch: 10 },  // الطرف الأول
      { wch: 8 },  // عضوية الأول
      { wch: 10 },  // صحبتة الأول
      { wch: 10 },  // الطرف الثاني
      { wch: 8 },  // عضوية الثاني
      { wch: 10 },  // صحبتة الثاني
      { wch: 10 },  // الكنترول
      { wch: 10 },  // المشرف
      { wch: 20 }   // الإجراء
    ];


    // 6. تصدير الملف
    const workbook = {
      Sheets: { 'سجل المشاجرات': worksheet },
      SheetNames: ['سجل المشاجرات']
    };

    XLSX.writeFile(workbook, 'سجل_المشاجرات.xlsx');
    this.toastr.success('📁 تم تصدير الملف بنجاح');

  }


}
