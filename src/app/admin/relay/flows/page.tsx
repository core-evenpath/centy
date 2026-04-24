import RelayFlowSimulator from './FlowBuilder';
import RelayPageIntro from '../components/RelayPageIntro';

export default function FlowsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '16px 20px 0' }}>
        <RelayPageIntro
          title="Flow Editor"
          description="Design and preview conversation flows per sub-vertical. Pick a sub-vertical on the left to inspect its canonical flow template; generate AI customer scenarios to see how different personas move through the stages; tweak homescreen layout (bento/storefront) and stage-block mappings that the partner's Test Chat reads from."
          links={[
            { href: '/admin/relay/engine', label: 'Block Engine →' },
            { href: '/admin/relay/blocks', label: 'Block Registry →' },
          ]}
        />
      </div>
      <RelayFlowSimulator />
    </div>
  );
}
