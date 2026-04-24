import EngineShell from './components/EngineShell';
import RelayPageIntro from '../components/RelayPageIntro';
import RelaySubNav from '../components/RelaySubNav';

export default function BlockEnginePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <RelaySubNav />
      <RelayPageIntro
        title="Block Engine"
        description="Engine-scoped view of the block catalog. Pick an engine (Booking, Commerce, Lead, Engagement, Info) and see every block that engine can run, bucketed by canonical stage across all sub-verticals. No partner context — for partner-specific diagnostics, use Relay Health."
      />
      <EngineShell />
    </div>
  );
}
