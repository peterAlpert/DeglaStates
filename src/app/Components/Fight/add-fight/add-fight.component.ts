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
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      transcript = transcript.trim();

      // 🟡 لو الحقل هو control - حاول تطابقه
      if (this.activeField === 'control') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.controlOptions);
        this.formData['control'] = matched || transcript;
      } else if (this.activeField === 'supervisor') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.supervisorOptions);
        this.formData['supervisor'] = matched || transcript;

      } else if (this.activeField === 'location') {
        const matched = this._SharedService.findClosestMatch(transcript, this._SharedService.locationOptions);
        this.formData['location'] = matched || transcript;

      } else {
        this.formData[this.activeField] = transcript;
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

      // ✨ تسجيل مستمر لو المستخدم لسه ضغط كنترول
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }

      const focusableFields = this.fields.filter(f => !f.readonly && f.key !== 'date' && f.key !== 'day');
      const currentIndex = focusableFields.findIndex(f => f.key === this.activeField);
      this.activeField = '';

      const nextInput = this.inputs.toArray()[currentIndex + 1];

      if (nextInput) {
        setTimeout(() => {
          nextInput.nativeElement.focus();
          console.log('✅ Focused on:', focusableFields[currentIndex + 1].key);
        }, 300);
      }

      this.activeField = '';
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
