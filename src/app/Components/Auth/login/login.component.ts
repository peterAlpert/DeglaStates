import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../Services/auth.service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  username = '';
  password = '';
  isSubmitting = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  login() {
    this.isSubmitting = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.toastr.success('✅ تم تسجيل الدخول بنجاح');
        this.router.navigate(['/']); // روح للصفحة الرئيسية
      },
      error: () => {
        this.toastr.error('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
        this.isSubmitting = false;
      }
    });
  }


}
