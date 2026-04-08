// Converted from js/GaurabdaDate.js
// Fixed: duplicate Set() method — merged into overloaded set()

export class GaurabdaDate {
  tithi: number = 0;
  masa: number = 0;
  gyear: number = 500;

  set(tithiOrDate: number | GaurabdaDate, masa?: number, gyear?: number): void {
    if (tithiOrDate instanceof GaurabdaDate) {
      this.tithi = tithiOrDate.tithi;
      this.masa = tithiOrDate.masa;
      this.gyear = tithiOrDate.gyear;
    } else {
      this.tithi = tithiOrDate;
      this.masa = masa ?? 0;
      this.gyear = gyear ?? 500;
    }
  }

  next(): void {
    this.tithi++;
    if (this.tithi >= 30) {
      this.tithi %= 30;
      this.masa++;
    }
    if (this.masa >= 12) {
      this.masa %= 12;
      this.gyear++;
    }
  }

  prev(): void {
    if (this.tithi === 0) {
      if (this.masa === 0) {
        this.masa = 11;
        this.tithi = 29;
      } else {
        this.masa--;
        this.tithi = 29;
      }
    } else {
      this.tithi--;
    }
  }
}
