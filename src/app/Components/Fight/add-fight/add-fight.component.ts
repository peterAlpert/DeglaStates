import { SharedService } from './../../../Services/shared.service';
import {
  Component,
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { FightService } from '../../../Services/fight.service';

@Component({
  selector: 'app-add-fight',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-fight.component.html',
  styleUrls: ['./add-fight.component.css'],
})
export class AddFightComponent {
  formData: any = {};
  isSubmitting = false;

  lastUsedDate: string = '';
  lastUsedTime: string = '';
  isControlKeyPressed: boolean = false;

  @ViewChildren('fieldInput', { read: ElementRef }) inputs!: QueryList<ElementRef>;


  fields = [
    { key: 'date', label: 'التاريخ', type: 'date', readonly: false },
    { key: 'day', label: 'اليوم', readonly: true },
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'firstPerson', label: 'طرف أول' },
    { key: 'firstPersonMembership', label: 'عضويه الاول' },
    { key: 'firstPersonGuests', label: 'صحبته الاول' },
    { key: 'firstPersonGuestsMembership', label: 'عضويه صحبته' },
    { key: 'secondPerson', label: 'طرف ثاني' },
    { key: 'secondPersonMembership', label: 'عضويه التاني' },
    { key: 'secondPersonGuests', label: 'صحبته الثاني' },
    { key: 'secondPersonGuestsMembership', label: 'عضويه الثاني' },
    { key: 'control', label: 'مراقب الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'action', label: 'الإجراء' }
  ];



  recognition: any;
  isRecognizing = false;
  activeField = '';

  constructor(
    private fightService: FightService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
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

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        let transcript = this._SharedService.cleanSpeechText(event.results[i][0].transcript.trim());

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      // 🟢 عرض النص المؤقت أثناء الكلام
      if (interimTranscript) {
        this.formData[this.activeField] = interimTranscript.trim();
        this.cdr.detectChanges();
        return; // عرض مؤقت بدون أنيميشن
      }

      // 🟢 لو فيه نص نهائي
      if (finalTranscript) {
        let processedText = finalTranscript.trim();

        if (this.activeField === 'control') {
          const matched = this._SharedService.findClosestMatch(processedText, this._SharedService.controlOptions);
          this.formData['control'] = matched || processedText;
        } else if (this.activeField === 'supervisor') {
          const matched = this._SharedService.findClosestMatch(processedText, this._SharedService.supervisorOptions);
          this.formData['supervisor'] = matched || processedText;
        } else if (this.activeField === 'location') {
          const matched = this._SharedService.findClosestMatch(processedText, this._SharedService.locationOptions);
          this.formData['location'] = matched || processedText;
        } else if (
          this.activeField === 'firstPersonMembership' ||
          this.activeField === 'firstPersonGuestsMembership' ||
          this.activeField === 'secondPersonMembership' ||
          this.activeField === 'secondPersonGuestsMembership'
        ) {
          const cleaned = processedText.replace(/\s+/g, '').replace(/\D/g, '');
          this.formData[this.activeField] = cleaned;
        } else {
          this.formData[this.activeField] = processedText;
        }

        // ✨ أنيميشن عند التحديث النهائي
        const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (inputElement) {
          inputElement.classList.add('glow-update');
          setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
        }
      }

      this.cdr.detectChanges();
    };


    this.recognition.onend = () => {
      this.isRecognizing = false;

      // 🟡 لو الحقل فاضي → ضع "لا توجد" باللون الذهبي
      const currentValue = (this.formData[this.activeField] || '').trim();
      if (!currentValue) {
        this.formData[this.activeField] = 'لا توجد';
        const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
        if (inputElement) {
          (inputElement as HTMLInputElement).style.color = '#FFD700'; // لون وادي دجلة
          setTimeout(() => {
            (inputElement as HTMLInputElement).style.color = '';
          }, 2000);
        }
      }

      // استمرار التسجيل لو الكنترول لسه مضغوط
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }

      // الانتقال للحقل التالي
      const focusableFields = this.fields.filter(f => !f.readonly && f.key !== 'date' && f.key !== 'day');
      const currentIndex = focusableFields.findIndex(f => f.key === this.activeField);
      this.activeField = '';

      const nextInput = this.inputs.toArray()[currentIndex + 1];
      if (nextInput) {
        setTimeout(() => {
          nextInput.nativeElement.focus();
          console.log('✅ Focused on:', focusableFields[currentIndex + 1]?.key);
        }, 300);
      }
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

  @HostListener('document:keyup.control', ['$event'])
  handleCtrlUp() {
    this.isControlKeyPressed = false;

    this.stopRecognition();
  }

  onDateChange() {
    if (this.formData.date) {
      const d = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[d.getDay()];
    }
  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.readonly) return true;
      const value = this.formData[f.key];
      return value && value.trim && value.trim() !== '';
    });
  }

  submitForm() {
    this.isSubmitting = true;
    this.fightService.addFight(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم تسجيل المشاجرة بنجاح');

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
        this.toastr.error('❌ حدث خطأ أثناء التسجيل');
        this.isSubmitting = false;
      },
    });
  }
}
