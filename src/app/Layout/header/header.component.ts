import { AuthService } from './../../Services/auth.service.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private _Router: Router, private service: AuthService) { }

  ngOnInit(): void {
    this.service.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
    // this.isLoggedIn = !!localStorage.getItem('token');
  }

  logout() {
    this.service.logout();
  }
}
