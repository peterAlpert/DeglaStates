import { SharedService } from './../../../Services/shared.service';
import { Component, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MissingChildService } from '../../../Services/missing-child.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-missing-child',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-missing-child.component.html',
  styleUrls: ['./add-missing-child.component.css']
})
export class MissingChildComponent {
  formData: any = {};
  lastUsedDate: string = '';
  lastUsedTime: string = '';
  isSubmitting = false

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'childName', label: 'اسم الطفل', type: 'text' },
    { key: 'location', label: 'المكان' },
    { key: 'parentName', label: 'اسم العضو ولي الامر' },
    { key: 'MembershipNo', label: 'رقم العضويه' },
    { key: 'control', label: 'الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'notes', label: 'ملاحظات' },
    { key: 'action', label: 'الاجراء' }
  ];

  actionOptions: string[] = [
    'تم التسليم الي ولي الامر و تم توقيع اقرار',
    'تم التسليم الي ولي الامر و رفض توقيع اقرار'
  ];


  recognition: any;
  isRecognizing = false;
  activeField = '';

  isControlKeyPressed: boolean = false;

  constructor(
    private service: MissingChildService,
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
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      transcript = _SharedService.cleanSpeechText(transcript.trim());



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
        // 🟡 لو الحقل هو رقم العضوية - شيل المسافات وأي رموز مش أرقام
        const cleaned = transcript.replace(/\s+/g, '').replace(/\D/g, '');
        this.formData['membershipNo'] = cleaned;
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


      // انتقال للفيلد اللي بعده
      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextField = this.fields[currentIndex + 1];

      if (nextField) {
        setTimeout(() => {
          const inputElements = this.inputs.toArray();
          const nextInput = inputElements[currentIndex + 1];

          if (nextInput) {
            nextInput.nativeElement.focus();
          }
        }, 100);
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

  onDateChange() {
    if (this.formData.date) {
      const selectedDate = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[selectedDate.getDay()];
    }
  }


  @HostListener('document:keydown.control', ['$event'])
  handleCtrlDown(event: KeyboardEvent) {
    if (event.key === 'Control') {
      this.isControlKeyPressed = true;
      const el = document.activeElement as HTMLInputElement;
      const field = this.fields.find(f => f.label === el.placeholder);
      if (field) this.startRecognition(field.key);
    }
  }

  @HostListener('document:keyup.control', ['$event'])
  handleCtrlUp() {
    this.isControlKeyPressed = false;
    this.stopRecognition();

  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  isFormValid(): boolean {
    return this.fields.every(f => this.formData[f.key]?.trim?.() !== '');
  }

  submitForm() {
    this.isSubmitting = true

    this.service.addChild(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم حفظ البيانات');
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
