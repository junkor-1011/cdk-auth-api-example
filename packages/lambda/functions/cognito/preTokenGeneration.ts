import 'source-map-support';
import type { CognitoUserPoolTriggerEvent, Context, Callback } from 'aws-lambda';

// TODO: rewrite to async function
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const lambdaHandler = (
  event: CognitoUserPoolTriggerEvent,
  context: Context,
  callback: Callback,
) => {
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        customKey1: 'custom-string',
        customKey2: 'red green blue',
        customKey3: 'apple orange grape',
      },
      groupOverrideDetails: {
        groupsToOverride: ['group-A', 'group-B', 'group-C'],
      },
    },
  };

  callback(null, event);
};
