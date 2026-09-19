import { CloudProvider } from './CloudProvider.js';

/**
 * AWSCloudProvider - AWS SDK Integration Stub
 * 
 * Ready for integration with AWS SDK v3 (@aws-sdk/client-ec2, @aws-sdk/client-cloudwatch, @aws-sdk/client-cost-explorer)
 */
export class AWSCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super('AWS');
    this.region = config.region || 'us-east-1';
    this.credentials = config.credentials || null;
  }

  async getResources(filter = {}) {
    // Future AWS SDK hook:
    // const ec2 = new EC2Client({ region: this.region });
    // const command = new DescribeInstancesCommand({});
    // const response = await ec2.send(command);
    throw new Error("AWS live provider not configured. Please use MockCloudProvider or supply AWS IAM credentials.");
  }

  async getResourceById(id) {
    throw new Error("AWS live provider not configured.");
  }

  async getMetrics(resourceId, options = {}) {
    // Future CloudWatch hook:
    // const cw = new CloudWatchClient({ region: this.region });
    // const command = new GetMetricDataCommand({...});
    throw new Error("AWS live provider not configured.");
  }

  async getCosts(filter = {}) {
    // Future AWS Cost Explorer hook:
    // const ce = new CostExplorerClient({ region: 'us-east-1' });
    throw new Error("AWS live provider not configured.");
  }

  async scaleResource(resourceId, targetCapacity, user = null) {
    // Future Auto Scaling / EC2 instance count adjustment hook
    throw new Error("AWS live provider not configured.");
  }

  async getServiceHealth() {
    throw new Error("AWS live provider not configured.");
  }
}
