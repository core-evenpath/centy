import RelayFlowSimulator from './FlowBuilder';
import RelayPageIntro from '../components/RelayPageIntro';
import RelaySubNav from '../components/RelaySubNav';

export default function FlowsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RelaySubNav />
        <RelayPageIntro
          title="Flow Editor"
          description="Design and preview conversation flows per sub-vertical. Pick a sub-vertical on the left to inspect its canonical flow template; generate AI customer scenarios to see how different personas move through the stages; tweak homescreen layout (bento/storefront) and stage-block mappings that the partner's Test Chat reads from."
        />
      </div>
      <RelayFlowSimulator />
    </div>
  );
}
