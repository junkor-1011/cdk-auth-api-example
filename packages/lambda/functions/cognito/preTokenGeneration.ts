import 'source-map-support';
import type {
  PreTokenGenerationTriggerHandler,
  PreTokenGenerationTriggerEvent,
  Context,
  // Callback,
} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
const genCustomClaim = async (): Promise<{
  customKey1: string;
  customKey2: string;
  customKey3: string;
}> => {
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
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        ...customClaims,
      },
      groupOverrideDetails: {
        groupsToOverride: ['group-A', 'group-B', 'group-C'],
      },
    },
  };

  return event;
};
