import 'source-map-support/register';
import type {
  PreTokenGenerationTriggerHandler,
  PreTokenGenerationTriggerEvent,
  Context,
  // Callback,
} from 'aws-lambda';
import { prisma } from '$api/lib/prisma-client.js';

// eslint-disable-next-line @typescript-eslint/require-await
const genCustomClaim = async (): Promise<Record<string, string>> => {
  return {
    customKey1: 'custom-string',
    customKey2: 'red green blue',
    customKey3: 'apple orange grape',
  };
};
const customClaims = await genCustomClaim();

// eslint-disable-next-line @typescript-eslint/require-await
export const lambdaHandler: PreTokenGenerationTriggerHandler = async (
  event: PreTokenGenerationTriggerEvent,
  context: Context,
  // callback: Callback,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  const user = await prisma.user
    .findUniqueOrThrow({
      select: {
        role: true,
        message: true,
      },
      where: {
        userid: event.userName,
      },
    })
    .catch((err) => {
      console.log(err);
      return {
        role: 'XXXX',
        message: 'FAILED TO ACCESS DB.',
      };
    });

  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        ...customClaims,
        'custom:role': user.role,
        'custom:message': user.message ?? '',
      },
      groupOverrideDetails: {
        groupsToOverride: ['group-A', 'group-B', 'group-C'],
      },
    },
  };

  return event;
};
