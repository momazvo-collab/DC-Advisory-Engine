import { Resend } from "resend";
import crypto from "crypto";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ENV GUARD
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { email, activity, scope, services } = req.body || {};

    // PAYLOAD VALIDATION
    if (
      !email ||
      !activity ||
      !scope ||
      !Array.isArray(services)
    ) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const advisoryId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    const html = generateTemplate(
      activity,
      scope,
      services,
      advisoryId,
      messageId
    );

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Your Dubai Chambers Advisory Results",
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}

function generateTemplate(
  activity: string,
  scope: string,
  services: string[],
  advisoryId: string,
  messageId: string
) {
  const BASE_URL = "https://dc-advisory-engine.vercel.app";

  function buildTrackedLink(serviceKey: string, originalUrl: string) {
    return `${BASE_URL}/api/r?m=${messageId}&a=${advisoryId}&k=${encodeURIComponent(
      serviceKey
    )}&u=${encodeURIComponent(originalUrl)}`;
  }

  const logoMain = `${BASE_URL}/logos/chambers.jpg`;
  const logoCommerce = `${BASE_URL}/logos/commerce.jpg`;
  const logoInternational = `${BASE_URL}/logos/international.jpg`;
  const logoDigital = `${BASE_URL}/logos/digital.jpg`;

  // Remove duplicate membership if resolver already includes it
  const filteredServices = services.filter(
    (s) => s !== "Become a Member"
  );

  const serviceDescriptions: Record<string, string> = {
    "Document Attestation":
      "Streamline business processes by ensuring the acceptance of members’ documents by the relevant authorities.",
    "Commercial Mediation":
      "Resolve commercial disputes quickly and amicably with our Mediation Services.",
    "Certificate of Origin":
      "International trade document used to authenticate the origin of exported and re-exported goods.",
    "ATA Carnet":
      "International customs document that permits the temporary importation of duty-free and tax-free business goods for up to one year.",
    "CSR":
      "Benefit from guidance on responsible business practices and sustainability through initiatives like our ESG Label and the Centre for Responsible Business (CRB).",
    "Business Group and Council":
      "Business Groups bring together companies from key sectors to drive industry development and enhance the business environment, while Business Councils connect international investors and companies to strengthen cross-border partnerships and promote investment flows.",
    "Dubai Global":
      "We maintain a growing network of 35+ international offices around the world, helping you connect with the right partners and unlock global growth.",
    "New Horizons":
      "Explore opportunities for international expansion through targeted trade missions.",
    "Business in Dubai":
      "Our unique digital platform simplifies a wide range of processes for companies seeking to launch or expand their activities in Dubai and accelerates growth through business-matching services.",
    "Expand North Star":
      "World’s largest event for startups and investors, attracting 1,800 startups and 1,200 investors with assets under management of US$ 1 trillion in 2024."
  };

  const serviceLinks: Record<string, string> = {
    "Document Attestation":
      "https://www.dubaichambers.com/en/services?category=276199",
    "Commercial Mediation":
      "https://www.dubaichambers.com/en/mediation",
    "Certificate of Origin":
      "https://www.dubaichambers.com/en/services?category=275773",
    "ATA Carnet":
      "https://www.dubaichambers.com/en/issuance-of-ata-carnet",
    "CSR":
      "https://www.dubaichambers.com/en/dubai-chamber-of-commerce-esg-label",
    "Business Group and Council":
      "#",
    "Dubai Global":
      "https://leads.dubaichamber.com/en/contact",
    "New Horizons":
      "https://www.dubaichamberinternational.com/en/new-horizons",
    "Business in Dubai":
      "https://www.dubaichamberdigital.com/en/business-in-dubai",
    "Expand North Star":
      "https://www.dubaichamberdigital.com/en/expand-north-star"
  };

  const commerceServices = filteredServices.filter((s) =>
    [
      "Document Attestation",
      "Commercial Mediation",
      "Certificate of Origin",
      "ATA Carnet",
      "CSR",
      "Business Group and Council"
    ].includes(s)
  );

  const internationalServices = filteredServices.filter((s) =>
    ["Dubai Global", "New Horizons"].includes(s)
  );

  const digitalServices = filteredServices.filter((s) =>
    ["Business in Dubai", "Expand North Star"].includes(s)
  );

  function renderServiceCard(service: string, color: string) {
    return `
      <tr>
        <td style="padding:12px 24px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#111;">
            ${service}
          </div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:4px;line-height:18px;">
            ${serviceDescriptions[service] || ""}
          </div>
          <div style="margin-top:6px;">
            <a href="${buildTrackedLink(service, serviceLinks[service] || "#")}"
               style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#003B5C;text-decoration:none;">
              View Service →
            </a>
          </div>
        </td>
      </tr>
    `;
  }

  function renderChamberSection(
    logo: string,
    services: string[],
    accentColor: string
  ) {
    if (!services.length) return "";

    return `
      ${services.map((s) => renderServiceCard(s, accentColor)).join("")}
    `;
  }

  const hasMembership = Array.isArray(services) && services.includes("Become a Member");

  return `
  <div style="margin:0;padding:0;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:18px 24px;">
                <img src="${logoMain}" width="180" style="display:block;border:0;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 16px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#111;line-height:24px;">
                  Your Dubai Chambers Advisory Summary
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 16px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border:1px solid #eef0f3;border-radius:10px;">
                  <tr>
                    <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;line-height:18px;">
                      <div><strong>Activity:</strong> ${activity}</div>
                      <div style="margin-top:4px;"><strong>Scope:</strong> ${scope}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111;">
                  Recommended Services
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;">
                  Explore the services below. Each link will take you to the official Dubai Chambers page.
                </div>
              </td>
            </tr>
            ${hasMembership
              ? `
            <tr>
              <td style="padding:12px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#111;">Become a Member</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:4px;line-height:18px;">${"Unlock full access to Chamber services."}</div>
                <div style="margin-top:6px;">
                  <a href="${buildTrackedLink(
                    "Become a Member",
                    "https://www.dubaichambers.com/en/new-membership"
                  )}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#003B5C;text-decoration:none;">View Service →</a>
                </div>
              </td>
            </tr>
            `
              : ""}
            ${commerceServices.length
              ? `
            <tr>
              <td style="padding:10px 24px 6px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111;display:inline-block;padding-bottom:6px;border-bottom:2px solid #7A0019;">Dubai Chambers – Commerce</div>
              </td>
            </tr>
            ${renderChamberSection(logoCommerce, commerceServices, "#7A0019")}
            `
              : ""}
            ${internationalServices.length
              ? `
            <tr>
              <td style="padding:10px 24px 6px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111;display:inline-block;padding-bottom:6px;border-bottom:2px solid #1B6B3A;">Dubai Chambers – International</div>
              </td>
            </tr>
            ${renderChamberSection(logoInternational, internationalServices, "#1B6B3A")}
            `
              : ""}
            ${digitalServices.length
              ? `
            <tr>
              <td style="padding:10px 24px 6px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111;display:inline-block;padding-bottom:6px;border-bottom:2px solid #0B5FA5;">Dubai Chambers – Digital</div>
              </td>
            </tr>
            ${renderChamberSection(logoDigital, digitalServices, "#0B5FA5")}
            `
              : ""}
            <tr>
              <td style="padding:10px 24px 6px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111;display:inline-block;padding-bottom:6px;border-bottom:2px solid #374151;">Corporate Service Providers</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;line-height:18px;">Access a curated network of trusted partners supporting operational, financial, and advisory services.</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:6px;">Banking · Cloud · HR · Legal · Telecom · and more</div>
                <div style="margin-top:6px;"><a href="${buildTrackedLink(
                  "corporate_service_providers",
                  "https://www.dubaichambers.com/en/corporate-service-providers"
                )}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#003B5C;text-decoration:none;">Explore Corporate Service Providers →</a></div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 24px 16px 24px;">
                <a href="${buildTrackedLink(
                  "contact_advisor",
                  "https://www.dubaichambers.com/en/contact-us"
                )}"
                   style="display:inline-block;font-family:Arial,Helvetica,sans-serif;background:#003B5C;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:bold;text-decoration:none;">
                  Contact Dubai Chambers Advisor
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 18px 24px;border-top:1px solid #eef0f3;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;line-height:16px;">
                  This email was generated based on your advisory selections. Service availability may depend on eligibility criteria and documentation requirements.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}