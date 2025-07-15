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
  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;
  isSubmitting: boolean = false;


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



  recognition: any;
  isRecognizing: boolean = false;
  activeField: string = '';

  constructor(
    private _PlaceViolationService: PlaceViolationService,
    private _ToastrService: ToastrService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';


      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      this.formData[this.activeField] = finalTranscript || interimTranscript;

      // ✨ Animation عند انتهاء التسجيل
      const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
      if (inputElement) {
        inputElement.classList.add('glow-update');
        setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
      }

    };


    this.recognition.onend = () => {
      this.isRecognizing = false;

      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextField = this.fields[currentIndex + 1];

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


  startRecognition(fieldKey: string) {
    if (!this.isRecognizing) {
      this.activeField = fieldKey;
      this.isRecognizing = true;
      this.playBeep('start');
      this.recognition.start();
    }
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this.playBeep('end');
      this.recognition.stop();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' && !this.isRecognizing) {
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
      this.stopRecognition();
    }
  }


  onDateChange() {
    if (this.formData.date) {
      const selectedDate = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[selectedDate.getDay()];
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
        console.log('تم الإرسال بنجاح', res);
        this._ToastrService.success('✅ تم حفظ المخالفة');
        this.formData = {}; // تفرغ الفورم
      },
      error: err => {
        console.error('فشل في الإرسال', err);
        this._ToastrService.error('❌ حدث خطأ أثناء الإرسال');
      }
    });
  }


  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/start-beep.mp3';
    audio.play();
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.key === 'date' || f.key === 'day') return true;
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }

}
