import { runVerticalPipelineAction } from '@/actions/vertical-pipeline-actions';

async function main() {
  console.log('🚀 Starting Software & IT Services vertical pipeline...\n');

  const result = await runVerticalPipelineAction(
    'business_professional',
    'Business & Professional Services',
    'software_it',
    'Software & IT Services',
    'US',
    'system_seed'
  );

  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE RESULT');
  console.log('='.repeat(60));
  console.log(JSON.stringify(result.summary, null, 2));

  if (!result.success) {
    console.error('\n❌ Pipeline failed:', result.error);
    process.exit(1);
  }

  console.log('\n✅ Pipeline complete!');
  console.log(`   Modules created: ${result.summary.modulesCreated}`);
  console.log(`   Modules skipped: ${result.summary.modulesSkipped}`);
  console.log(`   Relay blocks: ${result.summary.relayBlocksCreated}`);
  console.log(`   Flow template: ${result.summary.flowTemplateId || 'none'}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
