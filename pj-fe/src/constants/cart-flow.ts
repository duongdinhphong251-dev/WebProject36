/**
 * Cart Flow Types
 *
 * Defines the type of checkout flow for cart items.
 * Each cart session has ONE active flow.
 */

export enum CartFlowType {
  NORMAL = 'NORMAL',
}

/**
 * Flow Status Types
 *
 * Defines the lifecycle state of the cart flow.
 * - IDLE: No flow active, cart is empty or in initial state
 * - INITIALIZING: Flow is being set up (e.g., during special flow initialization)
 * - READY: Flow is active and cart is ready for checkout
 */
export const FlowStatus = {
  IDLE: 'IDLE',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
} as const;

export type FlowStatusType = typeof FlowStatus[keyof typeof FlowStatus];

/**
 * Flow compatibility matrix
 * Defines which flows can coexist in the same cart
 */
export const FLOW_COMPATIBILITY: Record<CartFlowType, CartFlowType[]> = {
  [CartFlowType.NORMAL]: [CartFlowType.NORMAL],
};
