import PreviewPage from "../../components/PreviewPage";

export const metadata = { title: "Newsletter — Admin" };

export default function AdminNewsletterPreview() {
  return (
    <PreviewPage
      title="Newsletter"
      tagline="Manage subscribers and send periodic updates to your audience."
      accent="newsletter"
      features={[
        "View and export the subscriber list",
        "Compose newsletter issues in a rich editor",
        "Schedule or send updates immediately",
        "Track opens and unsubscribes",
      ]}
      mock={[
        { title: "subscriber-1@example.com", sub: "Subscribed 2026-03-12", meta: "Active" },
        { title: "subscriber-2@example.com", sub: "Subscribed 2026-03-05", meta: "Active" },
        { title: "subscriber-3@example.com", sub: "Subscribed 2026-02-28", meta: "Active" },
        { title: "subscriber-4@example.com", sub: "Subscribed 2026-02-14", meta: "Active" },
      ]}
    />
  );
}
