import PreviewPage from "../../components/PreviewPage";

export const metadata = { title: "Directors — Admin" };

export default function AdminDirectorsPreview() {
  return (
    <PreviewPage
      title="Directors"
      tagline="Manage director profiles — portraits, biographies and the films linked to each one."
      accent="directors"
      features={[
        "Add and edit director profiles",
        "Upload portraits and biographies",
        "Link films to directors automatically",
        "Reorder the directors page",
      ]}
      mock={[
        { title: "Exemple — Director A", sub: "5 films · Geneva", meta: "Active" },
        { title: "Exemple — Director B", sub: "2 films · Paris", meta: "Active" },
        { title: "Exemple — Director C", sub: "8 films · Lausanne", meta: "Active" },
        { title: "Exemple — Director D", sub: "1 film · Zurich", meta: "Draft" },
      ]}
    />
  );
}
