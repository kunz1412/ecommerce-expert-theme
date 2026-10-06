import { APIRequestContext, expect, Page } from '@playwright/test';

export const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';
export const CONTACT_MAIL_TO = process.env.CONTACT_MAIL_TO || 'kontakt@ecommerce-expert.de';
export const SMTP_FROM = process.env.SMTP_FROM || 'kontakt@ecommerce-expert.de';

/** Eindeutiger Text je Testlauf, damit parallele Tests sich nicht in Mailpit in die Quere kommen. */
export const uniqueToken = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Sendet das Formular direkt an die CF7-REST-Route, wie es ein Bot ohne Browser täte. */
export async function submitViaRest(page: Page, overrides: Record<string, string> = {}) {
  await page.goto('/');
  const hidden = await page.$$eval('#kontakt form input[type="hidden"]', (els) =>
    Object.fromEntries(els.map((e) => [(e as HTMLInputElement).name, (e as HTMLInputElement).value])),
  );
  const res = await page.request.post(`/wp-json/contact-form-7/v1/contact-forms/${hidden['_wpcf7']}/feedback`, {
    multipart: {
      ...hidden,
      'your-name': 'Test Absender',
      'your-email': 'absender@example.com',
      'your-message': 'Testnachricht',
      'project-type': 'Neuer Webshop',
      budget: 'Noch unklar',
      consent: '1',
      website: '',
      ...overrides,
    },
  });
  return res.json();
}

interface MailpitSummary {
  ID: string;
  Subject: string;
}

export async function searchMails(request: APIRequestContext, token: string): Promise<MailpitSummary[]> {
  const res = await request.get(`${MAILPIT_URL}/api/v1/search`, { params: { query: token } });
  expect(res.ok(), `Mailpit nicht erreichbar unter ${MAILPIT_URL}`).toBeTruthy();
  return (await res.json()).messages ?? [];
}

export async function waitForMail(request: APIRequestContext, token: string) {
  let found: MailpitSummary[] = [];
  await expect
    .poll(async () => (found = await searchMails(request, token)).length, { message: `Keine Mail mit "${token}" in Mailpit`, timeout: 10_000 })
    .toBeGreaterThan(0);
  const res = await request.get(`${MAILPIT_URL}/api/v1/message/${found[0].ID}`);
  return res.json();
}
