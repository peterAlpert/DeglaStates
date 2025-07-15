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

  constructor(
    private _service: MemberComplaintService,
    private _toast: ToastrService
  ) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let final = '', interim = '';
      for (let i = 0; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      this.formData[this.activeField] = final || interim;
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;
      const current = this.fields.findIndex(f => f.key === this.activeField);
      const next = this.inputs.toArray()[current + 1];
      if (next) next.nativeElement.focus();
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

  clearField(key: string) {
    this.formData[key] = '';
  }

  submitForm() {
    this._service.addComplaint(this.formData).subscribe({
      next: () => {
        this._toast.success('✅ تم حفظ الشكوى');
        this.formData = {};
      },
      error: () => {
        this._toast.error('❌ فشل في الحفظ');
      }
    });
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

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/start-beep.mp3';
    audio.play();
  }

  isFormValid(): boolean {
    return this.fields.every(f => {
      return this.formData[f.key] && this.formData[f.key].trim() !== '';
    });
  }
}