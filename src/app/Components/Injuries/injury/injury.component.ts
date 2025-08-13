import { SharedService } from './../../../Services/shared.service';
import { Component, ViewChildren, ElementRef, QueryList, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { InjuryService } from '../../../Services/injury.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-injury',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './injury.component.html',
  styleUrl: './injury.component.css'
})
export class InjuryComponent {
  formData: any = {};
  isSubmitting = false;

  lastUsedDate: string = '';
  lastUsedTime: string = '';

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  activeField: string = '';
  isRecognizing: boolean = false;
  recognition: any;

  isControlKeyPressed: boolean = false;


  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'memberName', label: 'اسم العضو المصاب' },
    { key: 'membershipNo', label: 'رقم العضوية' },
    { key: 'injuryType', label: 'نوع الإصابة' },
    { key: 'cause', label: 'سبب الإصابة' },
    { key: 'safetyOfficer', label: 'مسئول السلامة' },
    { key: 'medic', label: 'المسعف/الطبيب' },
    { key: 'control', label: 'الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'notes', label: 'ملاحظات' },
    { key: 'action', label: 'الإجراء' }
  ];

  actionOptions: string[] = [
    'الاجراء',
    'تم الذهاب ال العياده وتم عمل الازم',
    'تم احضار المسعف والذهاب الي العياده وتم عمل اللازم',
    'تم احضار المسعف وتم عمل اللازم',
    'تم التوجيه الي المستشفي مباشرة',
    'تم الاطمئنان عليه ورفض احضار المسعف'
  ];

  constructor(
    private _InjuryService: InjuryService,
    private _Toastr: ToastrService,
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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = this._SharedService.cleanSpeechText(event.results[i][0].transcript.trim());

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      // النص يظهر كلمة كلمة أثناء الكلام
      const liveText = (finalTranscript + interimTranscript).trim();

      if (this.activeField === 'control') {
        const matched = this._SharedService.findClosestMatch(liveText, this._SharedService.controlOptions);
        this.formData['control'] = matched || liveText;
      } else if (this.activeField === 'supervisor') {
        const matched = this._SharedService.findClosestMatch(liveText, this._SharedService.supervisorOptions);
        this.formData['supervisor'] = matched || liveText;
      } else if (this.activeField === 'location') {
        const matched = this._SharedService.findClosestMatch(liveText, this._SharedService.locationOptions);
        this.formData['location'] = matched || liveText;
      } else if (this.activeField === 'membershipNo') {
        const cleaned = liveText.replace(/\s+/g, '').replace(/\D/g, '');
        this.formData['membershipNo'] = cleaned;
      } else {
        this.formData[this.activeField] = liveText;
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

      // لو الحقل فاضي → حط "لا توجد" بلون وادي دجلة
      const value = this.formData[this.activeField];
      if (!value || value.trim() === '') {
        this.formData[this.activeField] = 'لا توجد';
        setTimeout(() => {
          const el = document.getElementsByName(this.activeField)[0] as HTMLElement;
          if (el) {
            el.style.color = '#FFD700'; // لون وادي دجلة
          }
        });
      }

      // استمرار التسجيل لو كنترول لسه مضغوط
      if (this.activeField && this.isControlKeyPressed) {
        this.recognition.start();
        this.isRecognizing = true;
        return;
      }

      // الانتقال للحقل التالي
      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextField = this.fields[currentIndex + 1];
      this.activeField = '';

      if (nextField) {
        setTimeout(() => {
          const inputElements = this.inputs.toArray();
          const nextInput = inputElements[currentIndex + 1];
          if (nextInput) {
            nextInput.nativeElement.focus();
          }
        }, 100);
      }
    };

  }

  startRecognition(fieldKey: string) {
    this.activeField = fieldKey;
    this.isRecognizing = true;
    this._SharedService.playBeep('start');
    this.recognition.start();
  }

  stopRecognition() {
    this.isRecognizing = false;
    this._SharedService.playBeep('end');
    this.recognition.stop();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' && !this.isRecognizing) {
      this.isControlKeyPressed = true;

      const el = document.activeElement as HTMLInputElement;
      const placeholder = el?.placeholder;

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


  onDateChange() {
    const d = new Date(this.formData.date);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    this.formData.day = days[d.getDay()];
  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  submitForm() {
    this.isSubmitting = true;
    this._InjuryService.add(this.formData).subscribe({
      next: () => {
        this._Toastr.success('✅ تم حفظ الإصابة بنجاح');

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
        this._Toastr.error('❌ فشل في حفظ الإصابة');
        this.isSubmitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return this.fields.every(f => this.formData[f.key]?.trim());
  }
}
