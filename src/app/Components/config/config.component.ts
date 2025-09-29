import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BrandService } from 'src/app/services/brand.service';
import { UserManagementService, UsuarioDTO, RolUsuario } from 'src/app/services/user-management.service';
import { AuthService } from 'src/app/services/auth/auth.service';

// Interface for User (adaptada al backend)
interface User {
  nombreUsuario: string;
  roles: string[];
  activo: boolean;
  idTecnico?: number;
}

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css'],
})
export class ConfigComponent implements OnInit {
  // Existing properties
  isLoading: boolean = false;
  successMessage: string | null = null;
  isSuccess: boolean = true;
  lastSyncTime: Date | null = null;

  // User management properties
  userForm: FormGroup;
  users: User[] = [];
  availableRoles: RolUsuario[] = [];
  isAddingUser: boolean = false;
  userMessage: string | null = null;
  isUserSuccess: boolean = true;
  showPassword: boolean = false;
  editingUser: User | null = null;
  
  // Modal de confirmación
  showDeleteModal: boolean = false;
  userToDelete: User | null = null;

  constructor(
    private brandServices: BrandService,
    private formBuilder: FormBuilder,
    private userManagementService: UserManagementService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.userForm = this.createUserForm();
  }
  
  ngOnInit(): void {
    this.loadLastSyncTime();
    this.loadUsers();
    this.loadRoles();
  }

  private createUserForm(): FormGroup {
    return this.formBuilder.group({
      userName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      userPassword: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [Validators.required]],
      userRole: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('userPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  cargarMarcasModelos(): void {
    this.isLoading = true;
    this.successMessage = null;
    this.brandServices.cargarMarcasModelos().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.successMessage = 'Datos sincronizados correctamente';
        this.lastSyncTime = new Date();
        this.saveLastSyncTime();
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (error) => {
        console.log('Error al sincronizar datos:', error);
        this.isLoading = false;
        this.isSuccess = false;
        this.successMessage = 'Error en la sincronización de datos';
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
    });
  }

  clearCache(): void {
    // Simular limpieza de caché
    localStorage.removeItem('config_cache');
    sessionStorage.clear();
    
    this.isSuccess = true;
    this.successMessage = 'Caché limpiado correctamente';
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  reloadConfig(): void {
    // Simular recarga de configuración
    this.isSuccess = true;
    this.successMessage = 'Configuración recargada correctamente';
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  getLastSyncTime(): string {
    if (this.lastSyncTime) {
      return this.lastSyncTime.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Nunca';
  }

  private loadLastSyncTime(): void {
    const savedTime = localStorage.getItem('last_sync_time');
    if (savedTime) {
      this.lastSyncTime = new Date(savedTime);
    }
  }

  private saveLastSyncTime(): void {
    if (this.lastSyncTime) {
      localStorage.setItem('last_sync_time', this.lastSyncTime.toISOString());
    }
  }

  // User Management Methods
  loadUsers(): void {
    this.userManagementService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.users = usuarios;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isUserSuccess = false;
        this.userMessage = 'Error al cargar usuarios';
        this.clearUserMessage();
      }
    });
  }

  loadRoles(): void {
    this.userManagementService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  addUser(): void {
    if (this.userForm.valid) {
      this.isAddingUser = true;
      this.userMessage = null;

      const formValue = this.userForm.value;
      const nuevoUsuario: UsuarioDTO = {
        nombreUsuario: formValue.userName,
        password: formValue.userPassword,
        activo: true,
        roles: [formValue.userRole]
      };

      if (this.editingUser) {
        // Actualizar usuario existente
        this.userManagementService.actualizarUsuario(this.editingUser.nombreUsuario, nuevoUsuario).subscribe({
          next: (response) => {
            this.isUserSuccess = true;
            this.userMessage = `Usuario "${nuevoUsuario.nombreUsuario}" actualizado exitosamente`;
            this.resetUserForm();
            this.loadUsers();
            this.isAddingUser = false;
            this.clearUserMessage();
          },
          error: (error) => {
            this.isUserSuccess = false;
            this.userMessage = 'Error al actualizar el usuario';
            this.isAddingUser = false;
            this.clearUserMessage();
          }
        });
      } else {
        // Crear nuevo usuario
        this.userManagementService.crearUsuario(nuevoUsuario).subscribe({
          next: (response) => {
            this.isUserSuccess = true;
            this.userMessage = `Usuario "${nuevoUsuario.nombreUsuario}" creado exitosamente`;
            this.resetUserForm();
            this.loadUsers();
            this.isAddingUser = false;
            this.clearUserMessage();
          },
          error: (error) => {
            this.isUserSuccess = false;
            this.userMessage = 'Error al crear el usuario';
            this.isAddingUser = false;
            this.clearUserMessage();
          }
        });
      }
    }
  }

  editUser(user: User): void {
    this.editingUser = user;
    
    const formData = {
      userName: user.nombreUsuario,
      userRole: user.roles && user.roles.length > 0 ? user.roles[0] : '',
      userPassword: '',
      confirmPassword: ''
    };
    
    this.userForm.patchValue(formData);
    
    // Hacer la contraseña opcional para edición
    this.userForm.get('userPassword')?.clearValidators();
    this.userForm.get('confirmPassword')?.clearValidators();
    this.userForm.get('userPassword')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
    
    // Scroll al formulario para mejor UX
    this.scrollToUserForm();
    
    // Mostrar mensaje de modo edición
    this.isUserSuccess = true;
    this.userMessage = `Editando usuario: ${user.nombreUsuario}`;
    setTimeout(() => {
      this.userMessage = null;
    }, 3000);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }
  
  // Método para hacer scroll al formulario
  private scrollToUserForm(): void {
    setTimeout(() => {
      const formElement = document.querySelector('#userForm') as HTMLElement;
      
      if (formElement) {
        // Scroll más agresivo y visible
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Resaltar el formulario temporalmente
        const originalBorder = formElement.style.border;
        const originalBackground = formElement.style.backgroundColor;
        
        formElement.style.border = '3px solid #007bff';
        formElement.style.backgroundColor = '#f8f9fa';
        
        setTimeout(() => {
          formElement.style.border = originalBorder;
          formElement.style.backgroundColor = originalBackground;
        }, 2000);
        
        // Scroll alternativo usando coordenadas
        const rect = formElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100;
        
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    }, 200);
  }

  confirmDeleteUser(user: User): void {
    // Obtener el usuario logueado actual
    const currentUser = this.authService.getUsername();
    
    // Prevenir que el usuario se elimine a sí mismo
    if (user.nombreUsuario === currentUser) {
      alert('❌ No puedes eliminar tu propia cuenta de usuario.\n\nPara eliminar esta cuenta, solicita a otro administrador que lo haga.');
      return;
    }
    
    // Mostrar modal de confirmación personalizado
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  // Confirmar eliminación desde el modal
  confirmDelete(): void {
    if (this.userToDelete) {
      this.deleteUser(this.userToDelete);
      this.closeDeleteModal();
    }
  }

  // Cancelar eliminación
  cancelDelete(): void {
    this.closeDeleteModal();
  }

  // Cerrar modal
  private closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser(user: User): void {
    this.userManagementService.eliminarUsuario(user.nombreUsuario).subscribe({
      next: (response) => {
        this.isUserSuccess = true;
        this.userMessage = `Usuario "${user.nombreUsuario}" eliminado exitosamente`;
        this.loadUsers();
        this.clearUserMessage();
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.isUserSuccess = false;
        
        // Mostrar mensaje más específico según el error
        if (error.status === 500) {
          this.userMessage = `Error interno del servidor al eliminar "${user.nombreUsuario}"`;
        } else if (error.status === 404) {
          this.userMessage = `Usuario "${user.nombreUsuario}" no encontrado`;
        } else if (error.status === 403) {
          this.userMessage = 'No tienes permisos para eliminar usuarios';
        } else {
          this.userMessage = `Error al eliminar el usuario: ${error.error?.message || error.message}`;
        }
        
        this.clearUserMessage();
      }
    });
  }

  resetUserForm(): void {
    this.userForm.reset();
    this.editingUser = null;
    this.showPassword = false;
    
    // Restaurar validadores
    this.userForm.get('userPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.userForm.get('userPassword')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin':
        return 'admin_panel_settings';
      case 'tecnico':
        return 'engineering';
      case 'usuario':
        return 'person';
      default:
        return 'person';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'tecnico':
        return 'Técnico';
      case 'usuario':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user.nombreUsuario;
  }

  // Obtener el rol principal del usuario para mostrar en la UI
  getUserMainRole(user: User): string {
    return user.roles && user.roles.length > 0 ? user.roles[0] : 'usuario';
  }

  // Verificar si el usuario está activo
  isUserActive(user: User): boolean {
    return user.activo;
  }

  // Verificar si es el usuario actual logueado
  isCurrentUser(user: User): boolean {
    const currentUser = this.authService.getUsername();
    return user.nombreUsuario === currentUser;
  }

  // Verificar si se puede eliminar el usuario
  canDeleteUser(user: User): boolean {
    return !this.isCurrentUser(user);
  }


  private clearUserMessage(): void {
    setTimeout(() => {
      this.userMessage = null;
    }, 5000);
  }
}
