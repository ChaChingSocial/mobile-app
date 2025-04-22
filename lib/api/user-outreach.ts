const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const customerBaseId =
  process.env.NEXT_PUBLIC_AIRTABLE_CONTACT_CUSTOMER_BASE_ID;

async function sendContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const contactFormTableId =
    process.env.NEXT_PUBLIC_AIRTABLE_CONTACT_FORM_TABLE_ID;
  const url = `https://api.airtable.com/v0/${customerBaseId}/${contactFormTableId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Name: name,
        Email: email,
        Subject: subject,
        Message: message,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function subscribeNewsletter(email: string) {
  const newsletterTableId =
    process.env.NEXT_PUBLIC_AIRTABLE_NEWSLETTER_TABLE_ID;
  const newsletterBaseId = process.env.NEXT_PUBLIC_AIRTABLE_NEWSLETTER_BASE_ID;
  const url = `https://api.airtable.com/v0/${newsletterBaseId}/${newsletterTableId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Email: email,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function waitlistSignup(
  email: string,
  linkedIn: string,
  twitter: string
) {
  const waitlistTableId = process.env.NEXT_PUBLIC_AIRTABLE_WAITLIST_TABLE_ID;
  const url = `https://api.airtable.com/v0/${customerBaseId}/${waitlistTableId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Email: email,
        LinkedIn: linkedIn,
        Twitter: twitter,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export { sendContactForm, subscribeNewsletter, waitlistSignup };
