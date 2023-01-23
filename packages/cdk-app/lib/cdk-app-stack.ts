import { Stack, StackProps, aws_apigateway as apigateway, aws_lambda as lambda } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const backend = new NodejsFunction(this, 'FastifyAppLambda', {
      entry: '../fastify-app/lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        sourceMap: true,
        minify: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const api = new apigateway.LambdaRestApi(this, 'webapi', {
      handler: backend,
      proxy: true,
    });
  }
}
