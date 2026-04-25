import EngineShell from './components/EngineShell';
import RelayPageIntro from '../components/RelayPageIntro';
import RelaySubNav from '../components/RelaySubNav';

export default function BlockEnginePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <RelaySubNav />
      <RelayPageIntro
        title="Transaction Flows"
        description="What happens when a user buys, books, requests a lead, engages, or asks a question. Each tab is one journey — narrative, happy-path block sequence, and a sample conversation. The full per-flow catalog lives in the collapsed 'All blocks' section. For partner-specific diagnostics, use Relay Health."
      />
      <EngineShell />
    </div>
  );
}
