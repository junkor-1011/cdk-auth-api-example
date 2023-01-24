import {
  Stack,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_cognito as cognito,
  Duration,
} from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool');
    const appClient = userPool.addClient('app-client', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID],
      },
      authFlows: { adminUserPassword: true }, // use in server
      generateSecret: true,
      refreshTokenValidity: Duration.hours(2),
    });

    const preTokenGenerationLambda = new NodejsFunction(this, 'preTokenGenerationLambda', {
      entry: '../lambda/functions/cognito/preTokenGeneration.ts',
      handler: 'lambdaHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        sourceMap: true,
      },
    });

    userPool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION, preTokenGenerationLambda);

    const backend = new NodejsFunction(this, 'FastifyAppLambda', {
      entry: '../fastify-app/lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        sourceMap: true,
        minify: true,
      },
      environment: {
        USERPOOL_CLIENT_ID: appClient.userPoolClientId,
        USERPOOL_CLIENT_SECRET: appClient.userPoolClientSecret.toString(), // TMP TODO: handling secret value
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const api = new apigateway.LambdaRestApi(this, 'webapi', {
      handler: backend,
      proxy: true,
    });
  }
}
