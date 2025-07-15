import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LostItemsService } from '../../../Services/lost-items.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-lost-item',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './add-lost-item.component.html',
  styleUrl: './add-lost-item.component.css'
})
export class AddLostItemComponent {

  formData: any = {};
  isSubmitting = false;
  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'time', label: 'التوقيت', type: 'time' },
    { key: 'itemName', label: 'اسم المفقودات' },
    { key: 'location', label: 'المكان' },
    { key: 'control', label: 'الكنترول' },
    { key: 'SecurityOfficer', label: 'مسئول الأمن' },
    { key: 'ItemNumber', label: 'رقم البند' },
  ];


  recognition: any;
  isRecognizing = false;
  activeField = '';

  constructor(private service: LostItemsService, private toastr: ToastrService) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
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

  onDateChange() {
    if (this.formData.date) {
      const day = new Date(this.formData.date).getDay();
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      this.formData.day = days[day];
    }
  }

  startRecognition(field: string) {
    this.activeField = field;
    this.isRecognizing = true;
    this.playBeep('start')
    this.recognition.start();
  }

  stopRecognition() {
    if (this.isRecognizing) {
      this.playBeep('end')
      this.recognition.stop();
    }
  }

  clearField(key: string) {
    this.formData[key] = '';
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

  submitForm() {
    this.isSubmitting = true;
    this.service.addItem(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم تسجيل المفقود بنجاح');
        this.formData = {};
        this.isSubmitting = false;
      },
      error: () => {
        this.toastr.error('❌ حدث خطأ أثناء التسجيل');
        this.isSubmitting = false;
      }
    });
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
}
