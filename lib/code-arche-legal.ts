/** CODE ARCHE legal copy (from trinity314.com/privacy & /terms), in-app. */

export type LegalDocId = "privacy" | "terms";

export const LEGAL_DOCS: Record<
  LegalDocId,
  { title: string; sections: { heading?: string; paragraphs: string[]; bullets?: string[] }[] }
> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        paragraphs: [
          "This Privacy Policy describes how CODE ARCHE (“we”, “our”, or “us”) handles information when you use our Pi Network apps: Pass Pi, Pulse Pi, ARCHE1, ARCHE0, Peaks 3141, and Voice 3141 (together, the “Apps”).",
          "This policy is for CODE ARCHE apps only. It is not the Pi Network / SocialChain privacy policy. Pi’s own services (Pi Browser, Pi Wallet, KYC, Developer Portal) are governed by Pi at socialchain.app/privacy.",
          "By using the Apps, you agree to this policy. If you do not agree, please do not use the Apps.",
        ],
      },
      {
        heading: "1. Who we are",
        paragraphs: [
          "CODE ARCHE operates independent Pi apps. We are not the Pi Core Team. We do not ask for, store, or display your Pi wallet passphrase or private keys.",
        ],
      },
      {
        heading: "2. Information we collect",
        paragraphs: ["We collect only what is needed to run each app."],
        bullets: [
          "Pi username (sign-in). When you sign in with Pi, the Pi SDK provides an access token. Our server verifies it with Pi’s official API and may keep your Pi username (and related user id if Pi returns it) so the app can show that you are signed in.",
          "Pi payments. For verification or practice payments we process payment IDs and transaction IDs through Pi’s payment APIs (approve / complete). We do not take extra wallet secrets.",
          "Guardian application (Pass Pi / ARCHE1). If you apply, we collect the name, email, and message (vision) you type, so we can review the request and contact you.",
          "Session on your device. Sign-in state may be stored in the browser (for example session storage) on your device. It is not a Pi passphrase.",
          "Technical logs. Hosting (for example Vercel) may record standard request logs such as time, path, and approximate network data needed to run the site.",
          "Analytics (Pass Pi). Pass Pi may use Google Tag Manager / related analytics to understand visits. This is not used to sell your data.",
        ],
      },
      {
        paragraphs: [
          "Pulse Pi is a long-term Testnet app. Payments there use Test-Pi for practice. Pulse Pi may also call public Pi Testnet RPC (for example network health). That call does not send your passphrase. Pulse Pi does not run a Guardian email form.",
        ],
      },
      {
        heading: "3. How we use information",
        bullets: [
          "To sign you in with Pi and show signed-in status",
          "To complete Pi (or Test-Pi) payments you start in Pi Browser",
          "To review Guardian applications and reply by email when you submitted a form",
          "To keep the Apps working, secure, and understandable",
        ],
        paragraphs: [
          "We do not sell personal information. We do not use the Apps to collect identity documents or KYC data. Pi KYC is handled only by Pi / SocialChain.",
        ],
      },
      {
        heading: "4. Sharing",
        paragraphs: ["We share information only as needed:"],
        bullets: [
          "Pi Network. Sign-in and payments go through Pi’s official APIs and wallet flow.",
          "Hosting / email tools. Site hosting and, when you send a Guardian form, an email delivery service so we can receive your message.",
          "Legal. If required by law or to protect the Apps and users.",
        ],
      },
      {
        heading: "5. Retention",
        paragraphs: [
          "Device session data lasts until you close the session or clear site data. Guardian form messages are kept only as long as needed to review and respond. Payment IDs needed to finish a payment are kept only as long as that process requires. Server logs follow the host’s normal retention.",
        ],
      },
      {
        heading: "6. Your choices",
        paragraphs: [
          "You may stop using the Apps at any time. You may cancel an incomplete payment in Pi Wallet. You may ask us to delete a Guardian application you sent by contacting us through the same app form or the email you used on that form.",
        ],
      },
      {
        heading: "7. Children",
        paragraphs: [
          "The Apps are not directed at children. Do not submit a Guardian form with a child’s personal data.",
        ],
      },
      {
        heading: "8. Changes",
        paragraphs: [
          "We may update this policy when the Apps change. Continued use means you accept the updated policy.",
        ],
      },
      {
        heading: "9. Contact",
        paragraphs: [
          "For privacy questions about CODE ARCHE apps, use the in-app Guardian / contact form on Pass Pi or ARCHE1, or reach us through the official app listing in Pi Browser. Do not send wallet passphrases.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        paragraphs: [
          'These Terms of Service govern your use of the services provided by CODE ARCHE (the "Service"). By accessing our service, you agree to comply with these terms.',
        ],
      },
      {
        heading: "1. Purpose",
        paragraphs: [
          "The Service aims to provide creative content sharing and digital asset integration within the Pi Network ecosystem.",
        ],
      },
      {
        heading: "2. Pi Network SDK Integration",
        paragraphs: [
          "Users agree to use the Pi Network authentication and payment systems when using this service. All asset transactions are subject to Pi Network's official policies.",
        ],
      },
      {
        heading: "3. User Responsibilities",
        paragraphs: [
          "Users shall not reproduce, modify, or distribute the assets of this service without authorization. Any activity that disrupts the service operation is strictly prohibited.",
        ],
      },
      {
        heading: "4. Limitation of Liability",
        paragraphs: [
          "The Service is not responsible for issues arising from system failures or network delays inherent to the Pi Network itself.",
        ],
      },
      {
        heading: "5. Amendments",
        paragraphs: [
          "These terms may be updated to reflect operational changes. Continued use of the service implies acceptance of the updated terms.",
        ],
      },
    ],
  },
};
