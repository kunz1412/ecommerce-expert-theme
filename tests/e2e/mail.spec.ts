import { expect, test } from '@playwright/test';
import { CONTACT_MAIL_TO, SMTP_FROM, searchMails, submitViaRest, uniqueToken, waitForMail } from './helpers';

/**
 * Mailversand (SMTP über mu-plugins/ecommerce-expert-mail.php). Lokal und in CI fängt Mailpit die Mails ab.
 */
test.describe('Mailversand', () => {
  test.skip(!!process.env.SKIP_MAIL_TESTS, 'SKIP_MAIL_TESTS gesetzt (z. B. Staging ohne Mailpit)');

  test('Formular absenden → Mail kommt in Mailpit an (Empfänger, Absender-Domain, Reply-To)', async ({ page, request }, testInfo) => {
    const token = uniqueToken(`mail-${testInfo.project.name}`);
    await page.goto('/');
    await page.getByLabel('Name *').fill('Erika Mustermann');
    await page.getByLabel('E-Mail *').fill('erika@example.com');
    await page.getByLabel('Unternehmen').fill('Muster GmbH');
    await page.getByLabel('Budgetrahmen').selectOption('[BUDGET-STUFE 2]');
    await page.getByLabel('Ihre Nachricht *').fill(`Bitte um Rückruf ${token}`);
    await page.getByRole('checkbox', { name: /Datenschutzerklärung/ }).check();

    const feedback = page.waitForResponse((r) => r.url().includes('/feedback') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Anfrage senden/ }).click();
    expect((await (await feedback).json()).status).toBe('mail_sent');
    await expect(page.locator('#kontakt .wpcf7-response-output')).toContainText('Vielen Dank für Ihre Anfrage');
    await expect(page.locator('#kontakt .wpcf7-response-output')).toHaveCSS('border-top-style', 'solid');

    const mail = await waitForMail(request, token);
    expect(mail.To.map((t: { Address: string }) => t.Address)).toEqual([CONTACT_MAIL_TO]);
    expect(mail.From.Address).toBe(SMTP_FROM);
    expect(mail.From.Address.split('@')[1]).toBe('ecommerce-expert.de'); // eigene Domain, nicht das Absender-Postfach
    expect(mail.ReplyTo.map((t: { Address: string }) => t.Address)).toEqual(['erika@example.com']);
    expect(mail.Subject).toBe('Neue Projektanfrage von Erika Mustermann');
    expect(mail.Text).toContain('Muster GmbH');
    expect(mail.Text).toContain('[BUDGET-STUFE 2]');
    expect(mail.Text).toContain(token);
  });

  test('Honeypot-Treffer → Spam und keine Mail', async ({ page, request }, testInfo) => {
    const token = uniqueToken(`spam-${testInfo.project.name}`);
    const body = await submitViaRest(page, { website: 'http://spam.example', 'your-message': `Billige Uhren ${token}` });
    expect(body.status).toBe('spam');
    await page.waitForTimeout(1500); // SMTP-Versand ist synchron; Puffer gegen Verzögerungen von Mailpit
    expect(await searchMails(request, token)).toHaveLength(0);
  });

  test('ohne Einwilligung → keine Mail', async ({ page, request }, testInfo) => {
    const token = uniqueToken(`noconsent-${testInfo.project.name}`);
    const body = await submitViaRest(page, { consent: '', 'your-message': `Ohne Einwilligung ${token}` });
    expect(body.status).toBe('validation_failed');
    expect(await searchMails(request, token)).toHaveLength(0);
  });
});
