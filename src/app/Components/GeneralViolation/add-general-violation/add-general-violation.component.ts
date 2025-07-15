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
    private toastr: ToastrService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
      }
      this.formData[this.activeField] = finalTranscript;

      const input = document.getElementsByName(this.activeField)[0] as HTMLElement;
      input?.classList.add('glow-update');
      setTimeout(() => input?.classList.remove('glow-update'), 1500);
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;

      const currentIndex = this.fields.findIndex(f => f.key === this.activeField);
      const nextInput = this.inputs.toArray()[currentIndex + 1];
      if (nextInput) nextInput.nativeElement.focus();

      this.activeField = '';
    };
  }

  startRecognition(field: string) {
    this.activeField = field;
    this.isRecognizing = true;
    this.playBeep('start');
    this.recognition.start();
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this.playBeep('end');
      this.recognition.stop();
    }
  }

  @HostListener('document:keydown.control', ['$event'])
  handleCtrlDown(event: KeyboardEvent) {
    const el = document.activeElement as HTMLInputElement;
    const field = this.fields.find(f => f.label === el.placeholder);
    if (field) this.startRecognition(field.key);
  }

  @HostListener('document:keyup.control')
  handleCtrlUp() {
    this.stopRecognition();
  }

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = 'assets/start-beep.mp3';
    audio.play();
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
        this.formData = {};
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء الحفظ');
      }
    });
  }
}
