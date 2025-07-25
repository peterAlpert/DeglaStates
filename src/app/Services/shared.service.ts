import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  controlOptions: string[] = [
    'بيتر كميل', 'محمد سيد', 'سيد حسن', 'مينا اشرف', 'مينا مخلص', 'محمود بهاء', 'بولا نبيل',
    'بهاء عبدالمؤمن', 'ابانوب زكريا', 'محمود عطيه', 'محمد منصور', 'كيرلس صموئيل',
    'كيرلس سامح', 'امير مجدي', 'جوزيف جمال', 'ابراهيم محمد', 'مدحت وصفي', 'يوسف ايمن', 'خالد خليفه',
    'دعاء احمد', 'جالا جمال', 'نورهان محمد', 'مريم يني', 'مريان اميل'
  ];

  supervisorOptions: string[] = [
    'حسام حسن', 'روماني مجدي', 'احمد جلال', 'شيرين اكرام',
  ];

  locationOptions: string[] = [
    'المبني الاجتماعي', 'مبني الاسبورت', 'مبني الخدمات', 'الكويسكات', 'الجاردن', 'التراك', 'البحيره',
    'جاردن 1', 'جاردن 2', 'جاردن 3', 'الفتنس', 'الملاعب', 'المرحله', 'ملعب 1', 'ملعب 2', 'ملعب 3', 'ملعب 4',
    'رامب الاسبورت', 'رامب الاجتماعي', 'ضلع الاسبورت', 'ضلع الاجتماعي', 'ضلع 100 400'
  ];

  storeOptions: string[] = [
    'تريتس', 'بطاطس و زلابيه', 'معمورتي', 'دو اند كو', 'تشيكانا',
    'فورتي', 'ميكس مارت', 'اكسيسوريس', 'المختار', 'قصر نابولي',
    'ابو عوف', 'كيري', 'سرايا العرب', 'حواء', 'كارسوس',
    'نسله', 'بكره', 'كاندي'
  ];

  securityOfficers = [
    'عاطف', 'خالد', 'محمد سعد', 'مرثا', 'ريمون', 'هاني', 'هدي'
  ];

  findClosestMatch(input: string, options: string[]): string | null {
    input = input.toLowerCase().trim();
    let bestMatch = '';
    let bestScore = Number.MAX_SAFE_INTEGER;

    for (let opt of options) {
      const score = this.levenshteinDistance(input, opt.toLowerCase());
      if (score < bestScore) {
        bestScore = score;
        bestMatch = opt;
      }
    }

    return bestScore <= 5 ? bestMatch : null; // بيقبل نسبة خطأ بسيطة
  }

  levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }



  playBeep(type: 'start' | 'end') {
    const audio = new Audio();
    audio.src = type === 'start' ? 'assets/start-beep.mp3' : 'assets/end-beep.mp3';
    audio.play();
  }


  constructor() { }
}
