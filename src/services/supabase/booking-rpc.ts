import { invokeRpc } from './rpc';

export * from './rpc';

// Backward compatibility for other files that use invokeBookingRpc
export const invokeBookingRpc = invokeRpc;
