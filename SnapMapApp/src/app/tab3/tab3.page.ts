import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  selected: boolean;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class Tab3Page {
  selectedCount = 0;
  totalPrice = 0;

  products: Product[] = [
    { id: 1, name: 'Produit 1', image: 'assets/images/shop/product-1.jpg', price: 5, selected: false },
    { id: 2, name: 'Produit 2', image: 'assets/images/shop/product-2.jpg', price: 5, selected: false },
    { id: 3, name: 'Produit 3', image: 'assets/images/shop/product-3.jpg', price: 5, selected: false },
    { id: 4, name: 'Produit 4', image: 'assets/images/shop/product-4.jpg', price: 5, selected: false }
  ];

  private paymentUrl = 'https://buy.stripe.com/00w3cu2XF18efWr3DXbo400';

  constructor(private alertController: AlertController) {}

  updateTotal(): void {
    const selectedProducts = this.products.filter(product => product.selected);
    this.selectedCount = selectedProducts.length;
    this.totalPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
  }

  async payWithStripe(): Promise<void> {
    if (this.selectedCount === 0) {
      const alert = await this.alertController.create({
        header: 'Aucun produit',
        message: 'Sélectionne au moins un produit avant de payer.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    window.open(this.paymentUrl, '_blank');
  }
}
