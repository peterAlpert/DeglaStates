import { SharedService } from './../../../Services/shared.service';
import { PlaceViolationService } from '../../../Services/place-violation.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-place-violation',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './place-violation.component.html',
  styleUrl: './place-violation.component.css'
})
export class PlaceViolationComponent {

  formData: any = {};
  isSubmitting: boolean = false;

  lastUsedDate: string = '';
  lastUsedTime: string = '';

  recognition: any;
  isRecognizing: boolean = false;
  activeField: string = '';

  isControlKeyPressed: boolean = false;

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'control', label: 'الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'violationType', label: 'المخالفة' },
    { key: 'action', label: 'الإجراء' },
    { key: 'store', label: 'اسم المحل' },
  ];

  storeOptions: string[] = [
    'تريتس', 'بطاطس و زلابيه', 'معمورتي', 'دو اند كو', 'تشيكانا',
    'فورتي', 'ميكس مارت', 'اكسيسوريس', 'المختار', 'قصر نابولي',
    'ابو عوف', 'كيري', 'سرايا العرب', 'حواء', 'كارسوس',
    'نسله', 'بكره', 'كاندي'
  ];

  constructor(
    private _PlaceViolationService: PlaceViolationService,
    private _ToastrService: ToastrService,
    private _SharedService: SharedService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition() || new (window as any).SpeechRecognition();
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

      transcript = _SharedService.cleanSpeechText(transcript.trim());


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


      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextField = this.fields[currentIndex + 1];

      this.activeField = '';

      if (nextField) {
        setTimeout(() => {
          const inputElements = this.inputs.toArray();
          const nextInput = inputElements[currentIndex + 1];

          if (nextInput) {
            nextInput.nativeElement.focus();
            console.log('✅ Focused via ViewChildren:', nextField.key);
          } else {
            console.warn('⚠️ Could not find next input via ViewChildren:', nextField.key);
          }
        }, 100);
      }

      this.activeField = '';
    };
  }



  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' && !this.isRecognizing) {
      this.isControlKeyPressed = true;

      const el = document.activeElement as HTMLInputElement;
      const placeholder = el.placeholder;

      console.log('Placeholder:', placeholder);

      const focusedField = this.fields.find(f => f.label === placeholder);

      if (focusedField) {
        this.startRecognition(focusedField.key);
      }
    }
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control' && this.isRecognizing) {
      this.isControlKeyPressed = false;
      this.stopRecognition();
    }
  }

  focusInput(key: string) {
    const el = document.getElementsByName(key)[0] as HTMLInputElement;
    if (el) {
      el.focus();
    }
  }

  clearField(fieldKey: string) {
    this.formData[fieldKey] = '';
  }

  submitForm() {
    this.isSubmitting = true;

    this._PlaceViolationService.addViolation(this.formData).subscribe({
      next: res => {
        console.log('✅ تم الإرسال بنجاح', res);
        this._ToastrService.success('✅ تم حفظ المخالفة');

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
      error: err => {
        this._ToastrService.error('❌ حدث خطأ أثناء الإرسال');
        this.isSubmitting = false;
      }
    });
  }

  onDateChange() {
    if (this.formData.date) {
      const selectedDate = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[selectedDate.getDay()];
    }
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.key === 'date' || f.key === 'day') return true;
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }


  startRecognition(fieldKey: string) {
    if (!this.isRecognizing) {
      this.activeField = fieldKey;
      this.isRecognizing = true;
      this._SharedService.playBeep('start');
      this.recognition.start();
    }
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this._SharedService.playBeep('end');
      this.recognition.stop();
    }
  }


}
