import { expect, Page, test } from '@playwright/test';

async function fillRequired(page: Page) {
  await page.getByLabel('Name *').fill('Erika Mustermann');
  await page.getByLabel('E-Mail *').fill('erika@example.com');
  await page.getByLabel('Ihre Nachricht *').fill('Ich möchte einen Webshop starten.');
}

const feedback = (page: Page) => page.waitForResponse((r) => r.url().includes('/feedback') && r.request().method() === 'POST');

test.describe('Kontaktformular', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#kontakt').scrollIntoViewIfNeeded();
  });

  test('enthält alle Felder aus dem Design mit Labels', async ({ page }) => {
    const form = page.locator('#kontakt form');
    for (const label of ['Name *', 'E-Mail *', 'Unternehmen', 'Projektart', 'Budgetrahmen', 'Ihre Nachricht *']) {
      await expect(form.getByLabel(label)).toBeVisible();
    }
    await expect(form.getByLabel('Projektart').locator('option')).toHaveText([
      'Neuer Webshop',
      'Website mit WordPress',
      'Headless / commercetools',
      'Bestehenden Shop erweitern',
      'Wartung & Betreuung',
    ]);
    await expect(form.getByRole('button', { name: /Anfrage senden/ })).toBeVisible();
    await expect(form.getByText('* Pflichtfelder · Übertragung verschlüsselt')).toBeVisible();
  });

  test('Einwilligung ist Pflicht und verlinkt die Datenschutzerklärung', async ({ page }) => {
    const consent = page.getByRole('checkbox', { name: /Datenschutzerklärung/ });
    await expect(consent).not.toBeChecked();
    await expect(page.locator('#kontakt .ee-consent a')).toHaveAttribute('href', /\/datenschutz\/$/);
  });

  test('ohne Einwilligung wird nicht gesendet, die Meldung ist sichtbar und nicht nur farblich erkennbar', async ({ page }) => {
    await fillRequired(page);
    const [response] = await Promise.all([feedback(page), page.getByRole('button', { name: /Anfrage senden/ }).click()]);
    const body = await response.json();
    expect(body.status).toBe('validation_failed');
    expect(body.invalid_fields.map((f: { field: string }) => f.field)).toContain('consent');

    const output = page.locator('#kontakt .wpcf7-response-output');
    await expect(output).toBeVisible();
    await expect(output).toContainText('Ein oder mehrere Felder sind fehlerhaft');
    await expect(page.locator('#kontakt .wpcf7-not-valid-tip')).toContainText('Bitte bestätigen Sie die Datenschutzerklärung');
    await expect(page.getByRole('checkbox', { name: /Datenschutzerklärung/ })).toHaveAttribute('aria-invalid', 'true');
    // Fehler: gestrichelter Rahmen + Icon (nicht nur Farbe)
    await expect(output).toHaveCSS('border-top-style', 'dashed');
    await expect(output).toHaveCSS('border-top-color', 'rgb(180, 35, 24)');
  });

  test('Pflichtfelder werden geprüft', async ({ page }) => {
    await page.getByRole('checkbox', { name: /Datenschutzerklärung/ }).check();
    const [response] = await Promise.all([feedback(page), page.getByRole('button', { name: /Anfrage senden/ }).click()]);
    const body = await response.json();
    expect(body.status).toBe('validation_failed');
    expect(body.invalid_fields.map((f: { field: string }) => f.field).sort()).toEqual(['your-email', 'your-message', 'your-name']);
  });

  test('mit Einwilligung und Platzhalter-Budget wird die Anfrage angenommen (kein Validierungsfehler)', async ({ page }) => {
    await fillRequired(page);
    await page.getByLabel('Budgetrahmen').selectOption('[BUDGET-STUFE 1]');
    await page.getByRole('checkbox', { name: /Datenschutzerklärung/ }).check();
    const [response] = await Promise.all([feedback(page), page.getByRole('button', { name: /Anfrage senden/ }).click()]);
    const body = await response.json();
    // Lokal gibt es keinen Mailserver: mail_sent oder mail_failed sind beide „angenommen“.
    expect(['mail_sent', 'mail_failed']).toContain(body.status);
    await expect(page.locator('#kontakt .wpcf7-response-output')).toBeVisible();
  });
});

test.describe('Honeypot (wpcf7_spam)', () => {
  /** Sendet das Formular direkt an die CF7-REST-Route, wie es ein Bot ohne Browser täte. */
  async function submit(page: Page, overrides: Record<string, string>) {
    await page.goto('/');
    const hidden = await page.$$eval('#kontakt form input[type="hidden"]', (els) =>
      Object.fromEntries(els.map((e) => [(e as HTMLInputElement).name, (e as HTMLInputElement).value])),
    );
    const formId = hidden['_wpcf7'];
    const res = await page.request.post(`/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`, {
      multipart: {
        ...hidden,
        'your-name': 'Bot',
        'your-email': 'bot@example.com',
        'your-message': 'Kauf billige Uhren',
        'project-type': 'Neuer Webshop',
        budget: 'Noch unklar',
        consent: '1',
        website: '',
        ...overrides,
      },
    });
    return res.json();
  }

  test('Honeypot-Feld ist unsichtbar, aus der Tab-Reihenfolge genommen und ohne Autofill', async ({ page }) => {
    await page.goto('/');
    const hp = page.locator('#f-web');
    await expect(hp).toHaveAttribute('tabindex', '-1');
    await expect(hp).toHaveAttribute('autocomplete', 'off');
    await expect(hp.locator('xpath=ancestor::div[contains(@class,"ee-hp")]')).toHaveAttribute('aria-hidden', 'true');
    const box = await hp.boundingBox();
    expect(box!.x).toBeLessThan(-1000); // außerhalb des Viewports, aber nicht display:none
    await expect(hp).not.toHaveCSS('display', 'none');
  });

  test('befülltes Honeypot-Feld → Spam', async ({ page }) => {
    const body = await submit(page, { website: 'http://spam.example' });
    expect(body.status).toBe('spam');
  });

  test('leeres Honeypot-Feld → kein Spam', async ({ page }) => {
    const body = await submit(page, {});
    expect(body.status).not.toBe('spam');
    expect(['mail_sent', 'mail_failed']).toContain(body.status);
  });
});
