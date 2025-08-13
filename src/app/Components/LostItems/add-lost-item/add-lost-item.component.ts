import { SharedService } from './../../../Services/shared.service';
import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LostItemsService } from '../../../Services/lost-items.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-lost-item',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './add-lost-item.component.html',
  styleUrl: './add-lost-item.component.css'
})
export class AddLostItemComponent {

  formData: any = {};
  isSubmitting = false;

  lastUsedDate: string = '';
  lastUsedTime: string = '';

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'itemName', label: 'اسم المفقودات' },
    { key: 'location', label: 'المكان' },
    { key: 'control', label: 'الكنترول' },
    { key: 'SecurityOfficer', label: 'مسئول الأمن' },
    { key: 'ItemNumber', label: 'رقم البند' },
  ];

  recognition: any;
  isRecognizing = false;
  activeField = '';

  constructor(
    private service: LostItemsService,
    private toastr: ToastrService,
    private _SharedService: SharedService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.lastUsedDate = localStorage.getItem('lastUsedDate') || '';
    this.lastUsedTime = localStorage.getItem('lastUsedTime') || '';

    if (this.lastUsedDate && this.lastUsedTime) {
      this.formData.date = this.lastUsedDate;
      this.formData.time = this.lastUsedTime;
      this.onDateChange();
    }

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = this._SharedService.cleanSpeechText(
          event.results[i][0].transcript.trim()
        );

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      const currentText = finalTranscript || interimTranscript;

      // تحديث مباشر أثناء الكلام (حتى لو مش نهائي)
      if (this.activeField) {
        if (this.activeField === 'control') {
          const matched = this._SharedService.findClosestMatch(currentText, this._SharedService.controlOptions);
          this.formData['control'] = matched || currentText;
        } else if (this.activeField === 'supervisor') {
          const matched = this._SharedService.findClosestMatch(currentText, this._SharedService.supervisorOptions);
          this.formData['supervisor'] = matched || currentText;
        } else if (this.activeField === 'location') {
          const matched = this._SharedService.findClosestMatch(currentText, this._SharedService.locationOptions);
          this.formData['location'] = matched || currentText;
        } else {
          this.formData[this.activeField] = currentText;
        }

        // لو المستخدم بدأ يتكلم بعد "لا توجد" رجع اللون الطبيعي
        const el = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (el) el.style.color = '';
      }

      // تأثير الإضاءة
      const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
      if (inputElement) {
        inputElement.classList.add('glow-update');
        setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
      }
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;

      const value = this.formData[this.activeField];
      if (!value || value.trim() === '') {
        this.formData[this.activeField] = 'لا توجد';
        const el = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (el) el.style.color = '#FFD700'; // 🟡 لون وادي دجلة
      }

      // الانتقال للحقل التالي
      const index = this.fields.findIndex(f => f.key === this.activeField);
      const next = this.inputs.toArray()[index + 1];
      this.activeField = '';
      if (next) next.nativeElement.focus();
    };



  }

  onDateChange() {
    if (this.formData.date) {
      const day = new Date(this.formData.date).getDay();
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[day];
    }
  }

  startRecognition(field: string) {
    //soultion 1 
    if (this.isRecognizing) return;

    //soultion 2
    try {
      this.recognition.abort(); // لو شغال يوقفه
    } catch { }


    this.activeField = field;
    this.isRecognizing = true;
    this._SharedService.playBeep('start')
    this.recognition.start();
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this._SharedService.playBeep('end')
      this.recognition.stop();
    }
  }

  clearField(key: string) {
    this.formData[key] = '';
  }


  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.key === 'date' || f.key === 'day') return true;
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }

  submitForm() {
    this.isSubmitting = true;
    this.service.addItem(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم تسجيل المفقود بنجاح');

        // 🟡 حفظ التاريخ والوقت المستخدمين
        this.lastUsedDate = this.formData.date;
        this.lastUsedTime = this.formData.time;

        localStorage.setItem('lastUsedDate', this.lastUsedDate);
        localStorage.setItem('lastUsedTime', this.lastUsedTime);

        // 🟢 تعبئة تلقائية بالتاريخ والوقت السابق
        const date = this.lastUsedDate;
        const time = this.lastUsedTime;

        this.formData = {
          date,
          time
        };

        // فرغ باقي الحقول
        this.fields.forEach(field => {
          if (field.key !== 'date' && field.key !== 'time') {
            this.formData[field.key] = '';
          }
          else if (this.activeField === 'ItemNumber') {
            this.formData[this.activeField] = this.formData[this.activeField].replace(/\s+/g, '');
          }

        });

        this.onDateChange();
        this.isSubmitting = false;
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء التسجيل');
        this.isSubmitting = false;
      }
    });
  }

  @HostListener('document:keydown.control', ['$event'])
  handleCtrlDown(event: KeyboardEvent) {
    const el = document.activeElement as HTMLInputElement;
    const field = this.fields.find(f => f.label === el.placeholder);
    if (field) this.startRecognition(field.key);
  }

  @HostListener('document:keyup.control')
  handleCtrlUp() {
    this.stopRecognition();
  }

  getFilteredOfficers(): string[] {
    const input = this.formData.SecurityOfficer?.trim() || '';
    return this._SharedService.securityOfficers.filter(o =>
      o.includes(input)
    );
  }
}
