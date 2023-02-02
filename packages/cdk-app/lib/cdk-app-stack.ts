import {
  Stack,
  aws_iam as iam,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_cognito as cognito,
  Duration,
} from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import {
  NodejsFunction,
  OutputFormat,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const esmBanner =
  'import { createRequire as topLevelCreateRequire } from "module"; import url from "url"; const require = topLevelCreateRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));';

const lambdaBundlingOption: NodejsFunctionProps['bundling'] = {
  sourceMap: true,
  minify: true,
  format: OutputFormat.ESM,
  tsconfig: path.join(__dirname, '../../lambda/tsconfig.json'),
  banner: esmBanner,
  externalModules: ['@aws-sdk/*'],
};

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const roleBackendLambda = new iam.Role(this, 'BackendLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    // roleBackendLambda.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    // );
    roleBackendLambda.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
    );
    // roleBackendLambda.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser'),
    // );

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
      bundling: lambdaBundlingOption,
    });

    userPool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION, preTokenGenerationLambda);

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'cognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const backendLambdaOptions: NodejsFunctionProps = {
      entry: '../fastify-app/lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        sourceMap: true,
        minify: true,
        format: OutputFormat.ESM,
        externalModules: ['@aws-sdk/*'],
        tsconfig: path.join(__dirname, '../../fastify-app/tsconfig-prod.json'),
        banner:
          'import { createRequire as topLevelCreateRequire } from "module"; import url from "url"; const require = topLevelCreateRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));',
      },
      environment: {
        USERPOOL_ID: userPool.userPoolId,
        USERPOOL_CLIENT_ID: appClient.userPoolClientId,
        USERPOOL_CLIENT_SECRET: appClient.userPoolClientSecret.unsafeUnwrap(), // TMP TODO: handling secret value
      },
      role: roleBackendLambda,
    };

    const backend = new NodejsFunction(this, 'FastifyAppLambda', {
      ...backendLambdaOptions,
    });

    const helloLambda = new NodejsFunction(this, 'hello', {
      entry: '../lambda/functions/hello/get.ts',
      handler: 'lambdaHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: lambdaBundlingOption,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const api = new apigateway.LambdaRestApi(this, 'webapi', {
    //   handler: backend,
    //   proxy: true,
    // });

    const api = new apigateway.RestApi(this, 'webapi', {
      restApiName: 'test-webapi',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiMain = api.root
      .addResource('{proxy+}')
      .addMethod('ANY', new apigateway.LambdaIntegration(backend), {
        authorizer: cognitoAuthorizer,
      });

    api.root
      .addResource('auth')
      .addResource('authenticate')
      .addMethod('POST', new apigateway.LambdaIntegration(backend));

    api.root.addResource('hello').addMethod('GET', new apigateway.LambdaIntegration(helloLambda));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const policyCognitoActionForBackend = new iam.Policy(this, 'CognitoActionForBackend', {
      statements: [
        new iam.PolicyStatement({
          actions: ['cognito-idp:*'],
          resources: [userPool.userPoolArn],
        }),
      ],
      roles: [roleBackendLambda],
    });
  }
}
