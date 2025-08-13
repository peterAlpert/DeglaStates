import { SharedService } from './../../../Services/shared.service';
import { Component, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { GeneralViolationService } from '../../../Services/general-violation.service';

@Component({
  selector: 'app-member-food-violation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-general-violation.component.html',
  styleUrls: ['./add-general-violation.component.css']
})
export class GeneralViolationFormComponent {
  formData: any = {
    violationCategory: 'عضو'
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

      // 🔹 هنا بنبدأ من resultIndex عشان ناخد الكلام الجديد فقط
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      // 🟡 أثناء الكلام (Interim) هيظهر في الوقت الحقيقي
      let transcript = (finalTranscript || interimTranscript).trim();
      transcript = this._SharedService.cleanSpeechText(transcript);

      if (this.activeField === 'control') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.controlOptions);
        this.formData['control'] = matched || transcript;
      } else if (this.activeField === 'supervisor') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.supervisorOptions);
        this.formData['supervisor'] = matched || transcript;
      } else if (this.activeField === 'location') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.locationOptions);
        this.formData['location'] = matched || transcript;
      } else if (this.activeField === 'membershipNo') {
        const cleaned = transcript.replace(/\s+/g, '').replace(/\D/g, '');
        this.formData['membershipNo'] = cleaned;
      } else if (this.activeField === 'guestsMembershipNo') {
        const cleaned = transcript.replace(/\s+/g, '').replace(/\D/g, '');
        this.formData['guestsMembershipNo'] = cleaned;
      } else {
        this.formData[this.activeField] = transcript;
      }

      // ✨ Animation عند أي تحديث
      const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
      if (inputElement) {
        inputElement.classList.add('glow-update');
        setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
      }
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;

      // 🟡 لو مفيش نص اتقال - خليها "لا توجد" بلون وادي دجلة
      const value = this.formData[this.activeField];
      if (!value || value.trim() === '') {
        this.formData[this.activeField] = 'لا توجد';

        const el = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (el) {
          el.style.color = '#FFD700'; // لون وادي دجلة
          setTimeout(() => {
            el.style.color = ''; // يرجع اللون العادي
          }, 1500);
        }
      }

      // 🔄 استمرار التسجيل لو كنترول لسه مضغوط
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }

      // ⏭ الانتقال للحقل التالي
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
          time,
          violationCategory: 'عضو'
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
