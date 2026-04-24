import EngineShell from './components/EngineShell';
import RelayPageIntro from '../components/RelayPageIntro';

export default function BlockEnginePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RelayPageIntro
        title="Block Engine"
        description="Engine-scoped view of the block catalog. Pick an engine (Booking, Commerce, Lead, Engagement, Info) and see every block that engine can run, bucketed by canonical stage across all sub-verticals. No partner context — for partner-specific diagnostics, use Relay Health."
        links={[
          { href: '/admin/relay/health', label: 'Relay Health →' },
          { href: '/admin/relay/blocks', label: 'Block Registry →' },
        ]}
      />
      <EngineShell />
    </div>
  );
}
