import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { merge, of } from 'rxjs';
import { delay, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import * as XLSX from 'xlsx'; // Import the entire XLSX library

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css',
})
export class InventarioComponent {
  inventoryForm!: FormGroup;
  public showErrorItems: boolean = false;

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.inventoryForm = this.formBuilder.group({
      customerName: ['', Validators.required],
      currency: ['EUR', Validators.required],
      idRef: ['', Validators.required],
      items: this.formBuilder.array([this.createItemFormGroup()]),
      discount: [0],
      taxes: [0],
      subtotal: [{ value: 0, disabled: true }],
      total: [0],
    });

    const itemPriceQuantityChanges = this.items.valueChanges.pipe(
      // Filtra los cambios que no sean del precio o cantidad
      tap(
        (items) =>
          (items = items.map((item: any) => ({
            price: item.price,
            quantity: item.quantity,
          })))
      ),
      // Emite solo si hay un cambio real en el valor
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      )
      // Combina con el observable de borrado de items
    );

    const deleteItem$ = this.items.statusChanges.pipe(
      tap((status) =>
        status === 'VALID' ? (this.showErrorItems = false) : null
      ),
      filter((status) => status === 'INVALID')
    );

    merge(itemPriceQuantityChanges, deleteItem$).subscribe(() =>
      this.calculateTotal()
    );

    this.calculateTotal();
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  calculateTotal(): void {
    console.log('se llama');
    const items = this.inventoryForm.get('items')?.value;
    const subtotal = items.reduce(
      (acc: any, item: any) => acc + item.price * item.quantity,
      0
    );
    const discount = this.inventoryForm.get('discount')?.value;
    const taxes = this.inventoryForm.get('taxes')?.value;
    const total = subtotal - discount + taxes;

    this.inventoryForm.get('subtotal')?.setValue(subtotal);
    this.inventoryForm.get('total')?.setValue(total);
  }

  private createItemFormGroup(): FormGroup {
    return this.formBuilder.group({
      item: ['', Validators.required],
      price: [0, Validators.required],
      quantity: [1, Validators.required],
    });
  }

  get items(): FormArray {
    return this.inventoryForm.get('items') as FormArray;
  }
  deleteItems(index: number): void {
    this.showErrorItems = false;

    if (this.items.length > 1) {
      this.showErrorItems = false;
      this.items.removeAt(index);
    }
    if (this.items.length == 1) {
      this.showErrorItems = true;
      of(null)
        .pipe(delay(5000))
        .subscribe(() => {
          this.showErrorItems = false;
        });
    }
  }

  generateDefaultReport() {
    let workbook = XLSX.utils.book_new();
    // Obtiene los datos del formulario
    const formValues = this.inventoryForm.value;
    // Prepara los datos para la exportación
    // Prepare data for export
    const itemsData = formValues.items.map((item: any) => ({
      item: item.item,
      precio: item.price,
      cantidad: item.quantity,
      subtotal: item.price * item.quantity,
      'Nombre Cliente': formValues.customerName,
      moneda: formValues.currency,
      'ID Ref': formValues.idRef,
      total: formValues.total,
    }));
    const exportData = itemsData;

    let worksheet = XLSX.utils.json_to_sheet(exportData);

    // first way to add a sheet
    workbook.SheetNames.push('Hoja 1');
    workbook.Sheets['Hoja 1'] = worksheet;

    // second way to add a sheet
    // XLSX.utils.book_append_sheet(workbook, worksheet, "Hoja 1")

    XLSX.writeFileXLSX(workbook, 'test.xlsx', {});
  }
  getForm() {
    this.inventoryForm.value;
    console.log(
      '🚀 ~ InvoiceComponent ~ getForm ~ this.inventoryForm.value:',
      this.inventoryForm.value
    );
    this.generateDefaultReport();
  }
}
