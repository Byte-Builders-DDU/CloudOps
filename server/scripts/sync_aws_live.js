import dotenv from 'dotenv';
import prisma from '../src/models/prisma.js';
import { AWSCloudProvider } from '../src/providers/AWSCloudProvider.js';

dotenv.config();

async function runLiveSync() {
  console.log('🔄 Starting Live AWS Resource & Telemetry Synchronization...');
  
  const aws = new AWSCloudProvider();
  if (!aws.hasCredentials()) {
    console.error('❌ AWS Credentials not found in server/.env');
    process.exit(1);
  }

  const diag = await aws.diagnoseAwsConnection();
  if (!diag.success) {
    console.error('❌ AWS Diagnosis failed:', diag.error);
    process.exit(1);
  }

  console.log(`✅ Authenticated with AWS Account: ${diag.accountId} (${diag.region})`);
  console.log(`📡 Discovered ${diag.metricStreamsCount} CloudWatch metric streams`);

  const result = await aws.syncLiveResources();
  console.log('🎉 Live AWS Sync Complete!');
  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();
  process.exit(0);
}

runLiveSync().catch(async (err) => {
  console.error('❌ Sync failed with error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
