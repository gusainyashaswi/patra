import CampaignWorkspace from "@/components/CampaignWorkspace";
export default async function CampaignPage({ params }) {
  const { id } = await params;
  return <CampaignWorkspace id={id} />;
}
