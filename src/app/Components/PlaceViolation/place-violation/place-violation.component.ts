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
    private _ToastrService: ToastrService
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

      transcript = transcript.trim();

      // 🟡 لو الحقل هو control - حاول تطابقه
      if (this.activeField === 'control') {
        const matched = this.findClosestMatch(transcript, this.controlOptions);
        this.formData['control'] = matched || transcript;
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


    // this.recognition.onresult = (event: any) => {

    //   let interimTranscript = '';
    //   let finalTranscript = '';


    //   for (let i = 0; i < event.results.length; ++i) {
    //     const transcript = event.results[i][0].transcript;
    //     if (event.results[i].isFinal) {
    //       finalTranscript += transcript;
    //     } else {
    //       interimTranscript += transcript;
    //     }
    //   }

    //   this.formData[this.activeField] = finalTranscript || interimTranscript;

    //   // ✨ Animation عند انتهاء التسجيل
    //   const inputElement = document.getElementsByName(this.activeField)[0] as HTMLElement;
    //   if (inputElement) {
    //     inputElement.classList.add('glow-update');
    //     setTimeout(() => inputElement.classList.remove('glow-update'), 1500);
    //   }

    // };

    this.recognition.onend = () => {
      this.isRecognizing = false;

      // ✨ تسجيل مستمر لو المستخدم لسه ضغط كنترول
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }


      this.activeField = '';

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
        console.error('❌ فشل في الإرسال', err);
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

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/end-beep.mp3';
    audio.play();
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.key === 'date' || f.key === 'day') return true;
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }

  controlOptions: string[] = [
    'بيتر كميل', 'محمد سيد', 'سيد حسن', 'مينا اشرف', 'مينا مخلص', 'محمود بهاء', 'بولا نبيل',
    'بهاء عبدالمؤمن', 'ابانوب زكريا', 'محمود عطيه', 'محمد منصور', 'كيرلس صمزئيل',
    'كيرلس سامح', 'امير مجدي', 'جوزيف جمال', 'ابراهيم محمد', 'مدحت وصفي', 'يوسف ايمن', 'خالد خليفه',
    'دعاء احمد', 'جالا جمال', 'نورهان محمد', 'مريم يني', 'مريان اميل'
  ];

  findClosestMatch(input: string, options: string[]): string | null {
    input = input.toLowerCase().trim();
    let bestMatch = '';
    let bestScore = Number.MAX_SAFE_INTEGER;

    for (let opt of options) {
      const score = this.levenshteinDistance(input, opt.toLowerCase());
      if (score < bestScore) {
        bestScore = score;
        bestMatch = opt;
      }
    }

    return bestScore <= 5 ? bestMatch : null; // بيقبل نسبة خطأ بسيطة
  }

  levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

}
