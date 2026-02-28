import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { email, activity, scope, services } = req.body || {};

    if (!email || !activity || !scope || !Array.isArray(services)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const html = generateTemplate(activity, scope, services);

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
  services: string[]
) {
  const BASE_URL = "https://dc-advisory-engine.vercel.app";

  const logoMain = `${BASE_URL}/logos/chambers.jpg`;
  const logoCommerce = `${BASE_URL}/logos/commerce.jpg`;
  const logoInternational = `${BASE_URL}/logos/international.jpg`;
  const logoDigital = `${BASE_URL}/logos/digital.jpg`;

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
      "Benefit from guidance on responsible business practices and sustainability through initiatives like our ESG Label.",
    "Business Group and Council":
      "Business Groups drive sector development, while Business Councils connect international investors and companies.",
    "Dubai Global":
      "Connect with our international offices worldwide to unlock global growth opportunities.",
    "New Horizons":
      "Explore international expansion opportunities through targeted trade missions.",
    "Business in Dubai":
      "Digital platform simplifying business setup and expansion in Dubai.",
    "Expand North Star":
      "World’s largest startup and investor event connecting founders and global capital."
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
    "Business Group and Council": "#",
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
        <td style="padding:14px 18px;border-top:1px solid #eef0f3;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#111;">
            ${service}
          </div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:6px;line-height:18px;">
            ${serviceDescriptions[service] || ""}
          </div>
          <div style="margin-top:10px;">
            <a href="${serviceLinks[service] || "#"}"
               style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${color};text-decoration:none;border:1px solid ${color};padding:8px 12px;border-radius:6px;">
              View Service
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
      <tr>
        <td style="padding:0 24px 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f3;border-radius:10px;">
            <tr>
              <td style="padding:16px;">
                <img src="${logo}" width="180" style="display:block;border:0;height:auto;" />
              </td>
            </tr>
            ${services.map((s) => renderServiceCard(s, accentColor)).join("")}
          </table>
        </td>
      </tr>
    `;
  }

  return `
  <div style="margin:0;padding:0;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:30px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
            
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #eef0f3;">
                <img src="${logoMain}" width="200" style="display:block;border:0;height:auto;" />
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#111;">
                  Your personalized service shortlist
                </div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:6px;">
                  Based on your selected activity and scope.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 16px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #eef0f3;border-radius:10px;">
                  <tr>
                    <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;">
                      <strong>Activity:</strong> ${activity}<br/>
                      <strong>Scope:</strong> ${scope}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f3;border-radius:10px;">
                  <tr>
                    <td style="padding:14px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#111;">
                        Membership (Recommended Starting Point)
                      </div>
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;margin-top:6px;">
                        Support, growth, and global reach — all in one membership.
                      </div>
                      <div style="margin-top:10px;">
                        <a href="https://www.dubaichambers.com/en/new-membership"
                           style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;background:#7a0019;text-decoration:none;padding:10px 14px;border-radius:8px;">
                          Explore Membership
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${renderChamberSection(logoCommerce, commerceServices, "#7a0019")}
            ${renderChamberSection(logoInternational, internationalServices, "#1b6b3a")}
            ${renderChamberSection(logoDigital, digitalServices, "#0b5fa5")}

            <tr>
              <td style="padding:18px 24px;background:#fafafa;border-top:1px solid #eef0f3;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;">
                  This email was generated based on your advisory selections.
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