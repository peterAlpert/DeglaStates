import { SharedService } from './../../../Services/shared.service';
import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { GeneralViolationService } from '../../../Services/general-violation.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-food-vio',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './add-food-vio.component.html',
  styleUrl: './add-food-vio.component.css'
})
export class AddFoodVioComponent {

  formData: any = {
    violationCategory: 'أكل'
  };
  isSubmitting = false;

  lastUsedDate: string = '';
  lastUsedTime: string = '';

  isControlKeyPressed: boolean = false;

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'memberName', label: 'اسم العضو' },
    { key: 'membershipNo', label: 'رقم العضوية' },
    { key: 'guests', label: 'صحبتة' },
    { key: 'guestsMembershipNo', label: 'رقم عضويه صحبته' },
    { key: 'control', label: 'الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'action', label: 'الإجراء' },
    { key: 'violation', label: 'المخالفة' }
  ];

  recognition: any;
  isRecognizing = false;
  activeField = '';

  constructor(
    private service: GeneralViolationService,
    private toastr: ToastrService,
    private _SharedService: SharedService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.interimResults = true;

    this.lastUsedDate = localStorage.getItem('lastUsedDate') || '';
    this.lastUsedTime = localStorage.getItem('lastUsedTime') || '';

    if (this.lastUsedDate && this.lastUsedTime) {
      this.formData.date = this.lastUsedDate;
      this.formData.time = this.lastUsedTime;
      this.onDateChange();
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        const transcript = this._SharedService.cleanSpeechText(event.results[i][0].transcript.trim());
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      // 📌 دمج النص النهائي مع المؤقت لعرضه أثناء الكلام
      let displayText = (finalTranscript + interimTranscript).trim();

      // 🟡 لو الحقل فارغ بعد التنظيف → لا تعرض حاجة مؤقتاً
      if (!displayText && !finalTranscript) displayText = '';

      // معالجة خاصة لكل حقل
      if (this.activeField === 'control') {
        const matched = this._SharedService.findClosestMatch(displayText, this._SharedService.controlOptions);
        this.formData['control'] = matched || displayText;
      } else if (this.activeField === 'supervisor') {
        const matched = this._SharedService.findClosestMatch(displayText, this._SharedService.supervisorOptions);
        this.formData['supervisor'] = matched || displayText;
      } else if (this.activeField === 'location') {
        const matched = this._SharedService.findClosestMatch(displayText, this._SharedService.locationOptions);
        this.formData['location'] = matched || displayText;
      } else if (this.activeField === 'membershipNo' || this.activeField === 'guestsMembershipNo') {
        const cleaned = displayText.replace(/\s+/g, '').replace(/\D/g, '');
        this.formData[this.activeField] = cleaned;
      } else {
        this.formData[this.activeField] = displayText;
      }

      // ✨ Animation عند التحديث
      const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
      if (inputElement) {
        inputElement.classList.add('glow-update');
        setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
      }
    };


    this.recognition.onend = () => {
      this.isRecognizing = false;

      const currentValue = (this.formData[this.activeField] || '').trim();
      if (!currentValue) {
        this.formData[this.activeField] = 'لا توجد';

        // تلوين "لا توجد" بلون وادي دجلة
        const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (inputElement) {
          (inputElement as HTMLInputElement).style.color = '#FFD700';
          setTimeout(() => {
            (inputElement as HTMLInputElement).style.color = ''; // يرجع اللون الطبيعي بعد ثانيتين
          }, 2000);
        }
      }

      // لو الكنترول لسه مضغوط → استمرار التسجيل
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }

      // الانتقال للحقل التالي
      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextInput = this.inputs.toArray()[currentIndex + 1];
      this.activeField = '';

      if (nextInput) nextInput.nativeElement.focus();
    };
  }

  startRecognition(field: string) {
    this.activeField = field;
    this.isRecognizing = true;
    this._SharedService.playBeep('start');
    this.recognition.start();
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this._SharedService.playBeep('end');
      this.recognition.stop();
    }
  }

  @HostListener('document:keydown.control', ['$event'])
  handleCtrlDown(event: KeyboardEvent) {
    this.isControlKeyPressed = true;

    const el = document.activeElement as HTMLInputElement;
    const field = this.fields.find(f => f.label === el.placeholder);
    if (field) this.startRecognition(field.key);
  }

  @HostListener('document:keyup.control')
  handleCtrlUp() {
    this.isControlKeyPressed = false;

    this.stopRecognition();
  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  onDateChange() {
    if (this.formData.date) {
      const selectedDate = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[selectedDate.getDay()];
    }
  }

  isFormValid(): boolean {
    return this.fields.every(f => this.formData[f.key]?.trim?.() !== '') &&
      this.formData.date && this.formData.day;
  }

  submitForm() {
    this.isSubmitting = true;
    this.service.addViolation(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم تسجيل المخالفة');

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
        });

        this.onDateChange();
        this.isSubmitting = false;
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء الحفظ');
        this.isSubmitting = false;
      }
    });
  }
}
