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



  constructor(private _InjuryService: InjuryService, private _Toastr: ToastrService) {
    const { webkitSpeechRecognition }: any = window as any;
    this.recognition = new webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    this.recognition.lang = 'ar-EG';
    this.recognition.interimResults = true;

    this.lastUsedDate = localStorage.getItem('lastUsedDate') || '';
    this.lastUsedTime = localStorage.getItem('lastUsedTime') || '';


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
    this.playBeep('start');
    this.recognition.start();
  }

  stopRecognition() {
    this.isRecognizing = false;
    this.playBeep('end');
    this.recognition.stop();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' && !this.isRecognizing) {
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

  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/end-beep.mp3';
    audio.play();
  }
}
