import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { ClientsService } from '../../services/clients.service';
import { VentasService } from '../../services/ventas.service';

// Interfaces
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'accesorio' | 'producto' | 'servicio';
  status: 'active' | 'inactive';
  createdAt: Date;
  image?: string;
}

interface Client {
  id: number;
  name: string;
  dni: string;
  points: number;
}

interface SaleItem {
  product: Product;
  quantity: number;
  subtotal: number;
  discount: number;
}

interface Sale {
  id: number;
  client: Client | null;
  items: SaleItem[];
  subtotal: number;
  pointsDiscount: number;
  total: number;
  pointsEarned: number;
  date: Date;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  // Product Management
  products: Product[] = [];
  productForm: FormGroup;
  isAddingProduct: boolean = false;
  productMessage: string | null = null;
  isProductSuccess: boolean = true;
  editingProduct: Product | null = null;

  // Sales System
  currentSale: SaleItem[] = [];
  selectedClient: Client | null = null;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  saleForm: FormGroup;
  newClientForm: FormGroup;
  isProcessingSale: boolean = false;
  saleMessage: string | null = null;
  isSaleSuccess: boolean = true;
  showClientDropdown: boolean = false;
  showNewClientForm: boolean = false;
  isAddingClient: boolean = false;
  pointsErrorMessage: string | null = null;
  clientMessage: string | null = null;
  isClientSuccess: boolean = true;

  // UI States
  activeTab: 'products' | 'sales' | 'history' = 'products';
  showProductModal: boolean = false;
  showSaleModal: boolean = false;
  // List & pagination
  currentPage: number = 0;
  pageSize: number = 10;

  // Sales History
  salesHistory: Sale[] = [];
  // Search
  productSearchTerm: string = '';
  salesSearchTerm: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private productosService: ProductosService,
    private clientsService: ClientsService,
    private ventasService: VentasService
  ) {
    this.productForm = this.createProductForm();
    this.saleForm = this.createSaleForm();
    this.newClientForm = this.createNewClientForm();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadClients();
    this.loadSalesHistory();
  }

  private createProductForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      category: ['producto', [Validators.required]]
    });
  }

  private createSaleForm(): FormGroup {
    return this.formBuilder.group({
      clientSearch: [''],
      usePoints: [false],
      pointsToUse: [0, [Validators.min(0)]]
    });
  }

  private createNewClientForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]]
    });
  }

  // Product Management Methods
  loadProducts(): void {
    this.productosService.getProductosActivos(0, 100).subscribe({
      next: (res) => {
        const content = res.content ?? res;
        this.products = (content || []).map((p: any) => ({
          id: p.id,
          name: p.nombre,
          description: p.descripcion,
          price: p.precioVenta,
          stock: p.stock,
          category: 'producto',
          status: p.activo ? 'active' : 'inactive',
          createdAt: new Date()
        }));
      },
      error: () => {
        this.products = [];
      },
    });
  }

  // Filtered views
  get filteredProducts(): Product[] {
    const term = this.normalize(this.productSearchTerm);
    if (!term) return this.products;
    return this.products.filter((p) =>
      this.normalize(p.name).includes(term) || this.normalize(p.description).includes(term)
    );
  }

  get paginatedProducts(): Product[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    if (this.pageSize <= 0) return 0;
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get filteredProductsForSale(): Product[] {
    const term = this.normalize(this.salesSearchTerm);
    if (!term) return this.products;
    return this.products.filter((p) =>
      this.normalize(p.name).includes(term) || this.normalize(p.description).includes(term)
    );
  }

  loadClients(): void {
    this.clientsService.getClientesActivosSinPaginacionParaFormularios().subscribe({
      next: (clientes) => {
        this.clients = (clientes || []).map((c: any) => ({
          id: c.id,
          name: c.nombre,
          dni: c.cedula,
          points: c.puntos ?? 0,
        }));
      },
      error: () => {
        this.clients = [];
      },
    });
  }

  loadSalesHistory(): void {
    this.ventasService.listarVentas().subscribe({
      next: (ventas) => {
        this.salesHistory = (ventas || []).map((v: any) => ({
          id: v.id,
          client: v.cliente
            ? { id: v.cliente.id, name: v.cliente.nombre, dni: v.cliente.cedula, points: v.cliente.puntos ?? 0 }
            : null,
          items: (v.items || []).map((it: any) => ({
            product: {
              id: it.producto?.id,
              name: it.producto?.nombre,
              description: it.producto?.descripcion,
              price: it.precioUnitario,
              stock: 0,
              category: 'producto',
              status: 'active',
              createdAt: new Date()
            },
            quantity: it.cantidad,
            subtotal: it.subtotal,
            discount: 0,
          })),
          subtotal: v.subtotal,
          pointsDiscount: (v.puntosUsados ?? 0) * 0.1,
          total: v.total,
          pointsEarned: v.puntosGanados ?? 0,
          date: new Date(v.fecha),
        }));
      },
      error: () => {
        this.salesHistory = [];
      },
    });
  }

  addProduct(): void {
    if (this.productForm.valid) {
      this.isAddingProduct = true;
      this.productMessage = null;
      const formValue = this.productForm.value;

      const payload = {
        nombre: formValue.name,
        descripcion: formValue.description,
        precioVenta: parseFloat(formValue.price),
        stock: parseInt(formValue.stock),
        activo: true,
      };

      const request$ = this.editingProduct
        ? this.productosService.modificarProducto({ ...payload, id: this.editingProduct.id })
        : this.productosService.agregarProducto(payload);

      request$.subscribe({
        next: () => {
          this.isProductSuccess = true;
          this.productMessage = this.editingProduct
            ? `Producto "${formValue.name}" actualizado exitosamente`
            : `Producto "${formValue.name}" agregado exitosamente`;
          this.resetProductForm();
          this.showProductModal = false;
          this.isAddingProduct = false;
          this.loadProducts();
          this.clearProductMessage();
        },
        error: () => {
          this.isProductSuccess = false;
          this.productMessage = 'Error al guardar el producto';
          this.isAddingProduct = false;
          this.clearProductMessage();
        },
      });
    }
  }

  editProduct(product: Product): void {
    this.editingProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
    this.showProductModal = true;
  }

  deleteProduct(product: Product): void {
    if (confirm(`¿Está seguro de que desea eliminar "${product.name}"?`)) {
      this.productosService.eliminarProducto(product.id).subscribe({
        next: () => {
          this.isProductSuccess = true;
          this.productMessage = `Producto "${product.name}" eliminado exitosamente`;
          this.loadProducts();
          this.clearProductMessage();
        },
        error: () => {
          this.isProductSuccess = false;
          this.productMessage = 'Error al eliminar el producto';
          this.clearProductMessage();
        },
      });
    }
  }

  resetProductForm(): void {
    this.productForm.reset({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'producto'
    });
    this.editingProduct = null;
  }

  // Stats & helpers (UI)
  getTotalProducts(): number {
    return this.products.length;
  }

  getTotalStock(): number {
    return this.products.reduce((sum, p) => sum + (p.stock || 0), 0);
  }

  getLowStockCount(threshold: number = 5): number {
    return this.products.filter((p) => (p.stock || 0) <= threshold).length;
  }

  formatearMoneda(valor: number): string {
    if (valor === undefined || valor === null) return '$0.00';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(valor);
  }

  onPageChange(page: number): void {
    if (page < 0 || page > this.totalPages - 1) return;
    this.currentPage = page;
  }

  refreshProducts(): void {
    this.loadProducts();
  }

  exportProducts(): void {
    if (this.filteredProducts.length === 0) return;
    const csvHeaders = ['Nombre', 'Descripción', 'Categoría', 'Precio', 'Stock'];
    const csvData = this.filteredProducts.map((p) => [
      p.name,
      p.description,
      this.getCategoryDisplayName(p.category),
      p.price,
      p.stock,
    ]);
    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Sales Methods
  addToSale(product: Product): void {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }

    const existingItem = this.currentSale.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * product.price;
      } else {
        alert('No hay suficiente stock disponible');
      }
    } else {
      this.currentSale.push({
        product: product,
        quantity: 1,
        subtotal: product.price,
        discount: 0
      });
    }
  }

  removeFromSale(item: SaleItem): void {
    this.currentSale = this.currentSale.filter(saleItem => saleItem.product.id !== item.product.id);
  }

  updateQuantity(item: SaleItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromSale(item);
      return;
    }
    
    if (quantity <= item.product.stock) {
      item.quantity = quantity;
      item.subtotal = item.quantity * item.product.price;
    } else {
      alert('Cantidad excede el stock disponible');
    }
  }

  onClientSearch(): void {
    const raw = this.saleForm.get('clientSearch')?.value ?? '';
    const searchTerm = this.normalize(raw);

    if (searchTerm.length >= 2) {
      this.filteredClients = this.clients.filter((client) => {
        const name = this.normalize(client.name);
        const dni = String(client.dni || '');
        return name.includes(searchTerm) || dni.includes(searchTerm);
      });
      this.showClientDropdown = !this.selectedClient && this.filteredClients.length > 0;
    } else {
      this.filteredClients = [];
      this.showClientDropdown = false;
    }

    // Mantener el cliente seleccionado salvo que el campo quede vacío
    if (this.selectedClient && searchTerm.length === 0) {
      this.selectedClient = null;
    }
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
    this.saleForm.get('clientSearch')?.setValue(`${client.name} (${client.dni})`);
    this.showClientDropdown = false;
  }

  clearClientSelection(): void {
    this.selectedClient = null;
    this.saleForm.get('clientSearch')?.setValue('');
    this.saleForm.get('usePoints')?.setValue(false);
    this.saleForm.get('pointsToUse')?.setValue(0);
    this.pointsErrorMessage = null;
    this.showClientDropdown = false;
  }

  toggleNewClientForm(): void {
    this.showNewClientForm = !this.showNewClientForm;
    if (!this.showNewClientForm) {
      this.newClientForm.reset();
    }
  }

  addNewClient(): void {
    if (this.newClientForm.valid) {
      this.isAddingClient = true;
      this.clientMessage = null;

      setTimeout(() => {
        try {
          const formValue = this.newClientForm.value;
          
          // Check if client already exists
          const existingClient = this.clients.find(c => c.dni === formValue.dni);
          if (existingClient) {
            this.isClientSuccess = false;
            this.clientMessage = 'Ya existe un cliente con este DNI';
            this.isAddingClient = false;
            this.clearClientMessage();
            return;
          }

          // Create new client
          const newClient: Client = {
            id: this.getNextClientId(),
            name: formValue.name,
            dni: formValue.dni,
            points: 0 // New clients start with 0 points
          };

          this.clients.push(newClient);
          this.saveClients();
          
          // Auto-select the new client
          this.selectClient(newClient);
          
          this.isClientSuccess = true;
          this.clientMessage = `Cliente "${newClient.name}" agregado exitosamente`;
          this.showNewClientForm = false;
          this.newClientForm.reset();
          this.isAddingClient = false;
          this.clearClientMessage();
          
        } catch (error) {
          this.isClientSuccess = false;
          this.clientMessage = 'Error al agregar el cliente';
          this.isAddingClient = false;
          this.clearClientMessage();
        }
      }, 1000);
    }
  }

  getSaleSubtotal(): number {
    return this.currentSale.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getPointsDiscount(): number {
    if (!this.selectedClient || !this.saleForm.get('usePoints')?.value) {
      return 0;
    }
    
    const pointsToUse = this.saleForm.get('pointsToUse')?.value || 0;
    const subtotal = this.getSaleSubtotal();
    const maxPointsByBalance = this.selectedClient.points;
    const maxPointsBySubtotal = Math.floor(subtotal / 5.0); // Máximo puntos que puede cubrir el subtotal
    const maxPointsAllowed = Math.min(maxPointsByBalance, maxPointsBySubtotal);
    
    // Usar la menor cantidad entre lo solicitado y lo permitido
    const actualPointsToUse = Math.min(pointsToUse, maxPointsAllowed);
    
    return actualPointsToUse * 5.0; // 1 punto = 5 pesos
  }

  getSaleTotal(): number {
    return this.getSaleSubtotal() - this.getPointsDiscount();
  }

  getMaxPointsAllowed(): number {
    if (!this.selectedClient) return 0;
    
    const subtotal = this.getSaleSubtotal();
    const maxPointsByBalance = this.selectedClient.points;
    const maxPointsBySubtotal = Math.floor(subtotal / 5.0); // Máximo puntos que puede cubrir el subtotal
    
    return Math.min(maxPointsByBalance, maxPointsBySubtotal);
  }

  validatePointsInput(): void {
    const pointsToUse = this.saleForm.get('pointsToUse')?.value || 0;
    const maxAllowed = this.getMaxPointsAllowed();
    
    if (pointsToUse > maxAllowed) {
      this.pointsErrorMessage = `Máximo ${maxAllowed} puntos permitidos. Se ha ajustado automáticamente.`;
      this.saleForm.get('pointsToUse')?.setValue(maxAllowed);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.pointsErrorMessage = null;
      }, 3000);
    } else {
      this.pointsErrorMessage = null;
    }
  }

  getPointsToEarn(): number {
    // Las ventas NO generan puntos nuevos
    return 0;
  }

  processSale(): void {
    if (this.currentSale.length === 0) {
      alert('Agregue productos a la venta');
      return;
    }

    this.isProcessingSale = true;
    const pointsUsed = this.getPointsDiscount() / 5.0; // 1 punto = 5 pesos

    const payload = {
      cliente: this.selectedClient ? { id: this.selectedClient.id } : null,
      puntosUsados: Math.floor(pointsUsed),
      items: this.currentSale.map((it) => ({
        producto: { id: it.product.id },
        cantidad: it.quantity,
      })),
    };

    this.ventasService.crearVenta(payload).subscribe({
      next: (res) => {
        this.isSaleSuccess = true;
        const saleTotal = res.total ?? this.getSaleTotal();
        this.saleMessage = `Venta procesada exitosamente. Total: $${saleTotal.toFixed(2)}`;
        // Generar ticket con el mismo formato que reparaciones
        const correctTotal = this.getSaleSubtotal() - this.getPointsDiscount();
        this.generarTicketVenta({
          id: res.id ?? this.getNextSaleId(),
          date: new Date(),
          client: this.selectedClient,
          items: this.currentSale,
          subtotal: this.getSaleSubtotal(),
          discount: this.getPointsDiscount(),
          total: correctTotal,
          pointsUsed: Math.floor(pointsUsed),
          pointsEarned: 0, // Las ventas no generan puntos
        });
        // Reset sale
        this.currentSale = [];
        this.selectedClient = null;
        this.saleForm.reset();
        this.isProcessingSale = false;
        this.showSaleModal = false;
        this.loadProducts();
        this.loadClients();
        this.loadSalesHistory();
        this.clearSaleMessage();
      },
      error: () => {
        this.isSaleSuccess = false;
        this.saleMessage = 'Error al procesar la venta';
        this.isProcessingSale = false;
        this.clearSaleMessage();
      },
    });
  }

  // Utility Methods
  setActiveTab(tab: 'products' | 'sales' | 'history'): void {
    this.activeTab = tab;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'accesorio': return 'cable';
      case 'producto': return 'inventory';
      case 'servicio': return 'build';
      default: return 'inventory';
    }
  }

  getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'accesorio': return 'Accesorio';
      case 'producto': return 'Producto';
      case 'servicio': return 'Servicio';
      default: return 'Producto';
    }
  }

  private getNextProductId(): number {
    return this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private getNextSaleId(): number {
    return this.salesHistory.length > 0 ? Math.max(...this.salesHistory.map(s => s.id)) + 1 : 1;
  }

  private getNextClientId(): number {
    return this.clients.length > 0 ? Math.max(...this.clients.map(c => c.id)) + 1 : 1;
  }

  private saveProducts(): void {}
  private saveClients(): void {}
  private saveSalesHistory(): void {}

  private clearProductMessage(): void {
    setTimeout(() => {
      this.productMessage = null;
    }, 5000);
  }

  private clearSaleMessage(): void {
    setTimeout(() => {
      this.saleMessage = null;
    }, 5000);
  }

  private clearClientMessage(): void {
    setTimeout(() => {
      this.clientMessage = null;
    }, 5000);
  }

  // Utils
  private normalize(v: string | undefined | null): string {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }

  // -------- Ticket de venta (formato igual a reparaciones) --------
  private formatDate2(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  private formatMoney(amount: number): string {
    return `$ ${amount.toFixed(2)}`;
  }

  // Devuelve un resumen corto de los productos vendidos en una venta
  getSaleItemsSummary(sale: Sale): string {
    if (!sale || !sale.items || sale.items.length === 0) {
      return '';
    }
    const parts = sale.items.map((it) => `${it.product.name} x${it.quantity}`);
    return parts.join(', ');
  }

  private async generarTicketVenta(data: {
    id: number;
    date: Date;
    client: Client | null;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    pointsUsed: number;
    pointsEarned: number;
  }): Promise<void> {
    const lineHeight = 5;
    let y = 10;
    const maxWidth = 25;
    let totalHeight = 0;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [163, 800] });
    pdf.setFontSize(8);

    // Encabezado (idéntico en estilo)
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Oneup Soluciones', 29, y, { align: 'center' }); y += lineHeight;
    pdf.text('Leandro Gomez 1540', 29, y, { align: 'center' }); y += lineHeight;
    pdf.text('Paysandu', 29, y, { align: 'center' }); y += lineHeight;
    pdf.text('29992 - 091896948', 29, y, { align: 'center' }); y += lineHeight;
    pdf.text('¡Gracias por elegirnos!', 29, y, { align: 'center' }); y += lineHeight + 2;

    pdf.setFont('Helvetica', 'normal');

    // Datos de venta
    pdf.setFont('Helvetica', 'bold'); pdf.text('Venta:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(`#${data.id}`, 15, y); y += lineHeight;
    pdf.setFont('Helvetica', 'bold'); pdf.text('Fecha:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(this.formatDate2(data.date), 15, y); y += lineHeight + 2;

    // Cliente
    pdf.setFont('Helvetica', 'bold'); pdf.text('Cliente:', 2, y); y += lineHeight;
    pdf.setFont('Helvetica', 'bold'); pdf.text('Nom:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(`${data.client?.name || 'Consumidor final'}`, 15, y); y += lineHeight;
    pdf.setFont('Helvetica', 'bold'); pdf.text('DNI:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(`${data.client?.dni || '---'}`, 15, y); y += lineHeight + 2;

    // Ítems
    pdf.setFont('Helvetica', 'bold'); pdf.text('Ítems:', 2, y); y += lineHeight;
    data.items.forEach((it) => {
      const nameLines = pdf.splitTextToSize(it.product.name, maxWidth);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`${it.quantity} x`, 2, y);
      pdf.text(nameLines as unknown as string, 15, y);
      const linesUsed = Array.isArray(nameLines) ? (nameLines as string[]).length : 1;
      y += linesUsed * lineHeight;
      pdf.text(`Precio: ${this.formatMoney(it.product.price)}`, 15, y); y += lineHeight;
    });
    y += 2;

    // Totales
    pdf.setFont('Helvetica', 'bold'); pdf.text('Subtotal:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(this.formatMoney(data.subtotal), 30, y, { align: 'right' }); y += lineHeight;
    if (data.discount > 0) {
      pdf.setFont('Helvetica', 'bold'); pdf.text('Descuento:', 2, y);
      pdf.setFont('Helvetica', 'normal'); pdf.text(`- ${this.formatMoney(data.discount)}`, 30, y, { align: 'right' }); y += lineHeight;
    }
    pdf.setFont('Helvetica', 'bold'); pdf.text('Total:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(this.formatMoney(data.total), 30, y, { align: 'right' }); y += lineHeight + 2;

    // Puntos
    pdf.setFont('Helvetica', 'bold'); pdf.text('Puntos gen:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text(`${data.pointsEarned}`, 25, y); y += lineHeight;

    // Firma
    pdf.setFont('Helvetica', 'bold'); pdf.text('Firma:', 2, y);
    pdf.setFont('Helvetica', 'normal'); pdf.text('_________________________', 20, y); y += lineHeight;

    pdf.save(`venta_${data.id}.pdf`);
  }
}
