import PreviewPage from "../../components/PreviewPage";

export const metadata = { title: "Films — Admin" };

export default function AdminFilmsPreview() {
  return (
    <PreviewPage
      title="Films"
      tagline="Manage the film catalogue — titles, directors, synopses, trailers and posters."
      accent="films"
      features={[
        "Add, edit and archive films",
        "Upload posters and trailer links",
        "Assign directors, genres and release years",
        "Reorder the public catalogue",
      ]}
      mock={[
        { title: "Exemple — Feature Film 2026", sub: "Dir. Jane Doe · Drama · 2026", meta: "Released" },
        { title: "Exemple — Short in Post-Production", sub: "Dir. John Smith · Short", meta: "Draft" },
        { title: "Exemple — Festival Cut", sub: "Dir. Marie Rossi · Documentary", meta: "Released" },
        { title: "Exemple — Co-Production", sub: "Dir. Luca Bianchi · Feature", meta: "Draft" },
      ]}
    />
  );
}
