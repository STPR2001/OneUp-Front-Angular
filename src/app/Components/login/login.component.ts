import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LoginService } from 'src/app/services/auth/login.service';
import { LoginRequest } from 'src/app/services/auth/loginRequest';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginError: boolean = false;
  loginForm = this.formBuilder.group({
    usuario: ['', [Validators.required]],
    password: ['', Validators.required],
  })

  constructor(private formBuilder: FormBuilder, private router: Router, private loginService: LoginService, private authService: AuthService) { }

  ngOnInit(): void {
  }

  get usuario() {
    return this.loginForm.controls.usuario;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  login() {
    if (this.loginForm.valid) {
      this.loginError = false;
      this.loginService.login(this.loginForm.value as LoginRequest).subscribe({
        next: (userData) => {
          this.authService.login(userData.token)
        },
        error: () => {
          this.loginError = true;
        },
        complete: () => {
          this.router.navigateByUrl('');
          this.loginForm.reset();
        }
      })

    }
    else {
      this.loginForm.markAllAsTouched();
      alert("Error al ingresar los datos.");
    }
  }

}
