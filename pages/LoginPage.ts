import { expect, type Page } from '@playwright/test';

/**
 * The portal's current sign-in is a single "dev sign-in" email field - no
 * password, no OTP. Accounts without an explicit dashboard flag (e.g.
 * Division-only, or Parliament-access-only) land on a "Select your role to
 * continue" picker instead of going straight to a dashboard - the picker's
 * button label depends on which access the account has ("Department User",
 * "Parliament Section", ...).
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  private get emailInput() {
    return this.page.getByRole('textbox', { name: 'Dev sign-in email' });
  }

  private get continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  private get rolePickerPrompt() {
    return this.page.getByText('Select your role to continue');
  }

  async goto() {
    await this.page.goto('/');
  }

  async signInAs(email: string) {
    await this.goto();
    await this.emailInput.fill(email);
    await this.continueButton.click();
    // Accounts without a dashboard flag stay on "/" and swap in a role picker
    // instead of changing the URL, so waiting for a URL change is not
    // reliable here. The app also sets its sessionStorage role marker only
    // once the destination component has mounted, so wait for a landing
    // signal (an authenticated header, or the role picker) rather than just
    // the sign-in form vanishing.
    await Promise.race([
      this.page.getByRole('button', { name: 'Account menu' }).waitFor(),
      this.rolePickerPrompt.waitFor(),
    ]);
  }

  /**
   * Picks a role from the "Select your role to continue" picker, e.g.
   * "Department User" (Division-only accounts) or "Parliament Section"
   * (Parliament-access-only accounts).
   */
  async chooseRole(roleButtonName: string) {
    await this.page.getByRole('button', { name: roleButtonName }).click();
    await this.page.getByRole('button', { name: 'Account menu' }).waitFor();
  }

  async chooseDepartmentUserRole() {
    await this.chooseRole('Department User');
  }

  async expectSignedOut() {
    await expect(this.emailInput).toBeVisible();
  }
}
