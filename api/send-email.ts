import { Resend } from "resend";

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
  return `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="color:#8B0000;">Dubai Chambers Advisory Results</h2>

      <p><strong>Selected Activity:</strong> ${activity}</p>
      <p><strong>Scope:</strong> ${scope}</p>

      <h3>Eligible Services:</h3>
      <ul>
        ${services.map((s) => `<li>${s}</li>`).join("")}
      </ul>

      <hr style="margin:24px 0;" />

      <p>
        Thank you for using the Dubai Chambers Advisory Engine.
      </p>
    </div>
  `;
}