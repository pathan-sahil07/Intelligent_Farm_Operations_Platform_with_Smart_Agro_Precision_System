import AgriculturalChat from '@/components/AgriculturalChat'
import { PageHeader } from '@/components/common/PageHeader'

export default function AssistantPage() {
  return (
    <>
      <PageHeader showFarm={false} title="AI assistant" description="Ask agricultural questions answered from the knowledge base. Verify important decisions with local experts." />
      <AgriculturalChat />
    </>
  )
}
