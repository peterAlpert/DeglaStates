import { SharedService } from './../../../Services/shared.service';
import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MemberComplaintService } from '../../../Services/member-complaint.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-member-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './member-complaint.component.html',
  styleUrl: './member-complaint.component.css'
})
export class MemberComplaintComponent {
  formData: any = {};
  lastUsedDate: string = '';
  lastUsedTime: string = '';

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'memberName', label: 'اسم العضو' },
    { key: 'membershipNo', label: 'رقم العضوية' },
    { key: 'issue', label: 'المشكلة' },
    { key: 'control', label: 'مراقب الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'action', label: 'الإجراء' },
    { key: 'notes', label: 'ملاحظات' },
  ];

  recognition: any;
  isRecognizing = false;
  activeField: string = '';

  isControlKeyPressed: boolean = false;


  constructor(
    private _service: MemberComplaintService,
    private _toast: ToastrService,
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


      const current = this.fields.findIndex(f => f.key === this.activeField);
      const next = this.inputs.toArray()[current + 1];
      this.activeField = '';

      if (next) {
        setTimeout(() => {
          const inputElements = this.inputs.toArray();
          const nextInput = inputElements[current + 1];

          if (nextInput) {
            nextInput.nativeElement.focus();
          }
        }, 100);
      }

      this.activeField = '';
    };
  }

  onDateChange() {
    if (this.formData.date) {
      const d = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[d.getDay()];
    }
  }

  startRecognition(key: string) {
    if (!this.isRecognizing) {
      this.activeField = key;
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

  clearField(key: string) {
    this.formData[key] = '';
  }

  submitForm() {
    this._service.addComplaint(this.formData).subscribe({
      next: () => {
        this._toast.success('✅ تم حفظ الشكوى');
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

      },
      error: () => {
        this._toast.error('❌ فشل في الحفظ');
      }
    });
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


  isFormValid(): boolean {
    return this.fields.every(f => {
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }
}