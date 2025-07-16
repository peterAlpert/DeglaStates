import { Component, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { HSEService } from '../../../Services/hse.service';

@Component({
  selector: 'app-hse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-hse.component.html',
  styleUrls: ['./add-hse.component.css']
})
export class AddHSEComponent {
  formData: any = {};
  isSubmitting = false;
  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'sector', label: 'القطاع' },
    { key: 'description', label: 'متابعه اعمال ادارة السلامه والصحه المهنية' },
    { key: 'control', label: 'الكنترول' },
    { key: 'supervisor', label: 'المشرف' },
    { key: 'safetyEmployee', label: 'اسم موظف السلامة' },
    { key: 'action', label: 'الإجراء' },
    { key: 'notes', label: 'ملاحظات' }
  ];

  recognition: any;
  isRecognizing = false;
  activeField = '';

  constructor(private service: HSEService, private toastr: ToastrService) {
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
      const index = this.fields.findIndex(f => f.key === this.activeField);
      const next = this.inputs.toArray()[index + 1];
      if (next) next.nativeElement.focus();
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

  onDateChange() {
    if (this.formData.date) {
      const selectedDate = new Date(this.formData.date);
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[selectedDate.getDay()];
    }
  }

  @HostListener('document:keydown.control', ['$event'])
  handleCtrlDown(event: KeyboardEvent) {
    const el = document.activeElement as HTMLInputElement;
    const field = this.fields.find(f => f.label === el.placeholder);
    if (field) this.startRecognition(field.key);
  }

  @HostListener('document:keyup.control', ['$event'])
  handleCtrlUp() {
    this.stopRecognition();
  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      if (f.key === 'date' || f.key === 'day') return true;
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }


  submitForm() {
    this.isSubmitting = true;
    this.service.addHSE(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم حفظ البيانات');
        this.formData = {};
        this.isSubmitting = false;
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء الحفظ');
        this.isSubmitting = false;
      }
    });
  }

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/start-beep.mp3';
    audio.play();
  }
}
