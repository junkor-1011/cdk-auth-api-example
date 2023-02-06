import {
  Stack,
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_iam as iam,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_cognito as cognito,
  Duration,
} from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import {
  type ICommandHooks,
  NodejsFunction,
  OutputFormat,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const esmBanner =
  'import { createRequire as topLevelCreateRequire } from "module"; import url from "url"; const require = topLevelCreateRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));';

const commandHooksForPrisma = {
  beforeInstall(inputDir: string, outputDir: string): string[] {
    return [``];
  },
  beforeBundling(inputDir: string, outputDir: string): string[] {
    return [``];
  },
  afterBundling(inputDir: string, outputDir: string): string[] {
    return [
      `cp ${inputDir}/node_modules/.pnpm/prisma@*/node_modules/prisma/libquery_engine-rhel-openssl-1.0.x.so.node ${outputDir}`,
      `cp ${inputDir}/packages/fastify-app/prisma/schema.prisma ${outputDir}`,
    ];
  },
} as const satisfies ICommandHooks;

const lambdaBundlingOption: NodejsFunctionProps['bundling'] = {
  sourceMap: true,
  minify: true,
  format: OutputFormat.ESM,
  tsconfig: path.join(__dirname, '../../lambda/tsconfig.json'),
  banner: esmBanner,
  externalModules: ['@aws-sdk/*'],
  commandHooks: commandHooksForPrisma,
};

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Network
    const vpc = new ec2.Vpc(this, 'AppVpc');

    // EC2
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO,
      ),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(12, {
            encrypted: true,
          }),
        },
      ],
    });

    // RDS
    const sgForRds = new ec2.SecurityGroup(this, 'SG-for-DBClustor', {
      vpc,
    });
    sgForRds.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(5432));
    const dbCluster = new rds.DatabaseCluster(this, 'AppPostgre', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_5,
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE4_GRAVITON,
          ec2.InstanceSize.MEDIUM,
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        vpc,
        securityGroups: [sgForRds],
      },
    });
    const envForDBAccess = {
      DB_CLUSTER_HOSTNAME: dbCluster.clusterEndpoint.hostname,
      DB_CLUSTER_PORT: String(dbCluster.clusterEndpoint.port),
      DB_CLUSTER_SOCKETADDRESS: dbCluster.clusterEndpoint.socketAddress,
      SECRETS_ARN: dbCluster.secret?.secretArn ?? '',
      SECRETS_FULLARN: dbCluster.secret?.secretFullArn ?? '',
      SECRETS_NAME: dbCluster.secret?.secretName ?? '',
    } as const;

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
      environment: {
        ...envForDBAccess,
        STAGE: '',
      },
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
        commandHooks: commandHooksForPrisma,
      },
      environment: {
        ...envForDBAccess,
        USERPOOL_ID: userPool.userPoolId,
        USERPOOL_CLIENT_ID: appClient.userPoolClientId,
        USERPOOL_CLIENT_SECRET: appClient.userPoolClientSecret.unsafeUnwrap(), // TMP TODO: handling secret value
        STAGE: '',
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
