import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { LoginService } from '../../services/auth/login.service';
import { LoginRequest } from '../../services/auth/loginRequest';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  currentYear = new Date().getFullYear();
  loginError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Recuperar usuario guardado si existe
    const savedUsername = localStorage.getItem('rememberedUser');
    if (savedUsername) {
      this.loginForm.patchValue({
        username: savedUsername,
        rememberMe: true
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = false;
      const { username, password, rememberMe } = this.loginForm.value;

      const credentials: LoginRequest = {
        usuario: username,
        password: password
      };

      this.loginService.login(credentials).subscribe({
        next: (userData) => {
          this.authService.login(userData.token);
          
          // Manejar "Recordar usuario"
          if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
          } else {
            localStorage.removeItem('rememberedUser');
          }

          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error de login:', error);
          this.loginError = true;
          this.loginForm.setErrors({ invalidLogin: true });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
}
