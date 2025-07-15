import { Component, ViewChildren, ElementRef, QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';
import { OffensiveWordsService } from '../../../Services/offensive-words.service';

@Component({
  selector: 'app-offensive-words',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './offensive-words.component.html',
  styleUrls: ['./offensive-words.component.css']
})
export class OffensiveWordsComponent {
  formData: any = {};
  isSubmitting = false;
  activeField: string = '';
  isRecognizing = false;
  recognition: any;

  @ViewChildren('fieldInput') inputs!: QueryList<ElementRef>;

  fields = [
    { key: 'memberName', label: 'اسم العضو', type: 'text' },
    { key: 'membershipNo', label: 'رقم العضوية' },
    { key: 'age', label: 'السن' },
    { key: 'location', label: 'المكان' },
    { key: 'control', label: 'الكنترول' },
    { key: 'action', label: 'الإجراء' },
    { key: 'notes', label: 'ملاحظات' }
  ];

  constructor(private service: OffensiveWordsService, private toastr: ToastrService) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let final = '', interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? final += t : interim += t;
      }
      this.formData[this.activeField] = final || interim;
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;
      const i = this.fields.findIndex(f => f.key === this.activeField);
      const next = this.inputs.toArray()[i + 1];
      if (next) next.nativeElement.focus();
      this.activeField = '';
    };
  }

  startRecognition(fieldKey: string) {
    this.activeField = fieldKey;
    this.isRecognizing = true;
    this.playBeep('start')
    this.recognition.start();
  }

  stopRecognition() {
    this.isRecognizing = false;
    this.playBeep('end')
    this.recognition.stop();
  }

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/start-beep.mp3';
    audio.play();
  }

  @HostListener('document:keydown.control')
  controlDown() {
    const el = document.activeElement as HTMLInputElement;
    const placeholder = el?.placeholder;
    const field = this.fields.find(f => f.label === placeholder);
    if (field) this.startRecognition(field.key);
  }

  @HostListener('document:keyup.control')
  controlUp() {
    if (this.isRecognizing) this.stopRecognition();
  }

  clearField(key: string) {
    this.formData[key] = '';
  }

  isFormValid(): boolean {
    return this.fields.every(f => this.formData[f.key]?.trim());
  }

  submitForm() {
    this.isSubmitting = true;
    this.service.add(this.formData).subscribe({
      next: () => {
        this.toastr.success('✅ تم الحفظ بنجاح');
        this.formData = {};
        this.isSubmitting = false;
      },
      error: () => {
        this.toastr.error('❌ فشل في الحفظ');
        this.isSubmitting = false;
      }
    });
  }
}
