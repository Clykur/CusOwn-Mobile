export * from './rpc';

import { invokeRpc } from './rpc';

// Backward compatibility for other files that use invokeBookingRpc
export const invokeBookingRpc = invokeRpc;
