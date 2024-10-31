import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HtmlService {

  // input
  getInputValue(id: string): string {
    const input = document.getElementById(id) as HTMLInputElement;
    return input.value;
  }
  setInputValue(id: string, value: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    input.value = value;
  }

  getInputChecked(id: string): boolean {
    const input = document.getElementById(id) as HTMLInputElement;
    return input.checked;
  }
  getRadioChecked(name: string): string {
    const inputs = document.getElementsByName(name);
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i] as HTMLInputElement;
      if (input.checked) {
        return input.value;
      }
    }
    return ''
  }

  // div
  getDivInnerHTML(id: string): string {
    const div = document.getElementById(id) as HTMLDivElement;
    return div.innerHTML;
  }
  setDivInnerHTML(id: string, value: string): void {
    const div = document.getElementById(id) as HTMLDivElement;
    div.innerHTML = value;
  }

  // button
  buttonLoading(id: string, disabled = true){
    const btn = document.getElementById(id) as HTMLButtonElement;
    btn.disabled = disabled;
    btn.innerHTML = `
    <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
      <span class="visually-hidden">Loading...</span>
    </div>
    `;
  }
  buttonDone(id: string, text: string, disabled = true){
    const button = document.getElementById(id) as HTMLButtonElement;
    button.disabled = disabled;
    button.innerHTML = text;
  }

  clickElement(id: string){
    const element = document.getElementById(id) as HTMLElement;
    element.click();
  }
}
