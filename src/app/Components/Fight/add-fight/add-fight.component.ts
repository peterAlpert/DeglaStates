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
  @ViewChildren('fieldInput', { read: ElementRef }) inputs!: QueryList<ElementRef>;


  fields = [
    { key: 'date', label: 'التاريخ', type: 'date', readonly: false },
    { key: 'day', label: 'اليوم', readonly: true },
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'location', label: 'المكان' },
    { key: 'firstPerson', label: 'طرف أول' },
    { key: 'firstPersonMembership', label: 'عضويه' },
    { key: 'firstPersonGuests', label: 'صحبته ' },
    { key: 'firstPersonGuestsMembership', label: 'عضويه' },
    { key: 'secondPerson', label: 'طرف ثاني' },
    { key: 'secondPersonMembership', label: 'عضوية' },
    { key: 'secondPersonGuests', label: 'صحبته' },
    { key: 'secondPersonGuestsMembership', label: 'عضويه' },
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
    private cdr: ChangeDetectorRef
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      this.formData[this.activeField] = finalTranscript;

      const input = document.getElementsByName(this.activeField)[0] as HTMLElement;
      input?.classList.add('glow-update');
      setTimeout(() => input?.classList.remove('glow-update'), 1500);

      this.cdr.detectChanges(); // عشان زر الإدخال يتحدث
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;

      const focusableFields = this.fields.filter(f => !f.readonly && f.key !== 'date' && f.key !== 'day');
      const currentIndex = focusableFields.findIndex(f => f.key === this.activeField);

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

  @HostListener('document:keyup.control', ['$event'])
  handleCtrlUp() {
    this.stopRecognition();
  }

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = 'assets/start-beep.mp3';
    audio.play();
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
        this.formData = {};
      },
      error: () => this.toastr.error('❌ حدث خطأ أثناء التسجيل'),
    });
  }
}
