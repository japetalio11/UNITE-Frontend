/**
 * Event Card Utility Functions
 * 
 * PERMISSION-BASED ARCHITECTURE:
 * These utilities help extract and check allowedActions from backend responses.
 * Action visibility is determined by backend permission validation, not role names.
 * 
 * Backend validates:
 * - User permissions (e.g., request.review, request.approve, event.publish)
 * - Authority hierarchy (reviewer.authority >= requester.authority)
 * - State transition validity
 * 
 * Frontend uses allowedActions array to show/hide UI elements.
 * Backend always validates permissions independently - never trust frontend.
 */

import { useMemo } from "react";
import { ACTION_SYNONYMS, BOOLEAN_FLAG_TO_ACTION } from "./event-card.constants";

export const normalizeActionName = (name?: string | null) =>
  typeof name === "string" ? name.trim().toLowerCase() : "";

/**
 * Get current viewer info from localStorage/sessionStorage
 * NOTE: Role is for routing/display only. Authorization is permission-based on backend.
 */
export const getViewer = () => {
  try {
    if (typeof window === "undefined")
      return { id: null, role: null, isAdmin: false };
    const raw =
      localStorage.getItem("unite_user") || sessionStorage.getItem("unite_user");

    if (!raw) return { id: null, role: null, isAdmin: false };
    const parsed = JSON.parse(raw);
    const id =
      parsed?.id ||
      parsed?.ID ||
      parsed?._id ||
      parsed?.Stakeholder_ID ||
      parsed?.StakeholderId ||
      parsed?.stakeholder_id ||
      parsed?.user_id ||
      null;
    const role = parsed?.role || parsed?.staff_type || null;
    const roleString = String(role || "").toLowerCase();
    const isAdmin =
      !!parsed?.isAdmin ||
      roleString.includes("admin") ||
      roleString.includes("sysad") ||
      roleString.includes("systemadmin");

    return { id, role, isAdmin };
  } catch (e) {
    return { id: null, role: null, isAdmin: false };
  }
};

export const getViewerId = (): string | null => {
  const v = getViewer();
  return v.id ? String(v.id) : null;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return dateStr; // Return original if invalid

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr || "—";
  }
};

/**
 * Extract allowedActions from backend API response
 * 
 * Backend returns allowedActions array computed from:
 * - User's permissions (request.review, request.approve, etc.)
 * - Authority hierarchy validation
 * - Current request state
 * 
 * This hook walks the request/event structure to find and normalize
 * all allowedActions arrays and permission flags.
 * 
 * @returns Set of normalized action names that user is allowed to perform
 */
export const useAllowedActionSet = (payload: {
  request?: any;
  fullRequest?: any;
  resolvedRequest?: any;
}) => {
  const { request, fullRequest, resolvedRequest } = payload || {};

  return useMemo(() => {
    const set = new Set<string>();
    const foundPaths: string[] = []; // Track where allowedActions were found
    const requestId = request?.Request_ID || request?.RequestId || request?._id || request?.requestId || 'unknown';

    // Safe recursive walker to discover allowedActions and boolean flags
    const visit = (node: any, depth = 0, maxDepth = 4, path = 'root') => {
      if (!node || depth > maxDepth) return;

      // If this node directly carries allowed actions arrays, ingest them
      const candidates = [
        { value: node.allowedActions, path: `${path}.allowedActions` },
        { value: node.allowed_actions, path: `${path}.allowed_actions` },
        { value: node.allowed_actions_list, path: `${path}.allowed_actions_list` },
        { value: node.data?.allowedActions, path: `${path}.data.allowedActions` },
        { value: node.request?.allowedActions, path: `${path}.request.allowedActions` },
      ];
      candidates.forEach((candidate) => {
        if (Array.isArray(candidate.value)) {
          foundPaths.push(candidate.path);
          candidate.value.forEach((action) => {
            const normalized = normalizeActionName(action);
            if (normalized) set.add(normalized);
          });
        }
      });

      // Boolean flags mapped to actions
      Object.entries(BOOLEAN_FLAG_TO_ACTION).forEach(
        ([flag, actionName]: [string, string]) => {
          try {
            if (node && node[flag]) set.add(actionName);
          } catch (e) {}
        },
      );

      // If node is array, traverse elements
      if (Array.isArray(node)) {
        node.forEach((el, idx) => visit(el, depth + 1, maxDepth, `${path}[${idx}]`));
        return;
      }

      // Traverse common nested places quickly
      try {
        if (node.event && node.event !== node) visit(node.event, depth + 1, maxDepth, `${path}.event`);
        if (node.reviewer && node.reviewer !== node) visit(node.reviewer, depth + 1, maxDepth, `${path}.reviewer`);
        if (node.rescheduleProposal && node.rescheduleProposal.proposedBy) visit(node.rescheduleProposal.proposedBy, depth + 1, maxDepth, `${path}.rescheduleProposal.proposedBy`);
        if (Array.isArray(node.decisionHistory)) node.decisionHistory.forEach((dh: any, idx: number) => visit(dh, depth + 1, maxDepth, `${path}.decisionHistory[${idx}]`));
      } catch (e) {}

      // Generic small-object traversal to catch unexpected placements (only shallow)
      if (typeof node === 'object') {
        for (const key of Object.keys(node)) {
          const val = (node as any)[key];
          if (!val) continue;
          // avoid traversing very large structures like full text fields
          if (typeof val === 'object') {
            visit(val, depth + 1, maxDepth, `${path}.${key}`);
          }
        }
      }
    };

    visit(request, 0, 4, 'request');
    visit(fullRequest, 0, 4, 'fullRequest');
    visit(resolvedRequest, 0, 4, 'resolvedRequest');

    const extractedActions = Array.from(set);
    const hasReschedule = extractedActions.includes('reschedule') || extractedActions.includes('resched');
    
    if (foundPaths.length > 0) {
      // Debug logging removed
    } else {
      console.warn(`[EventCard Utils] ⚠️ No allowedActions found for request ${requestId}:`, {
        requestId,
        hasRequest: !!request,
        hasFullRequest: !!fullRequest,
        hasResolvedRequest: !!resolvedRequest,
        requestKeys: request ? Object.keys(request) : [],
        fullRequestKeys: fullRequest ? Object.keys(fullRequest) : [],
        resolvedRequestKeys: resolvedRequest ? Object.keys(resolvedRequest) : [],
        // Debug: show if allowedActions exists but wasn't found
        requestHasAllowedActions: !!request?.allowedActions,
        fullRequestHasAllowedActions: !!fullRequest?.allowedActions,
        resolvedRequestHasAllowedActions: !!resolvedRequest?.allowedActions,
        requestAllowedActionsValue: request?.allowedActions,
        fullRequestAllowedActionsValue: fullRequest?.allowedActions,
        resolvedRequestAllowedActionsValue: resolvedRequest?.allowedActions,
      });
    }

    return set;
  }, [request, fullRequest, resolvedRequest]);
};

/**
 * Factory function to create permission checker
 * 
 * Returns a function that checks if an action (or its synonyms) exists in the
 * allowedActions set from the backend.
 * 
 * Usage:
 *   const hasAllowedAction = hasAllowedActionFactory(allowedActionSet);
 *   if (hasAllowedAction('accept')) { ... }
 * 
 * @param allowedActionSet - Set of permitted action names from backend
 * @returns Function to check if action is allowed
 */
export const hasAllowedActionFactory = (allowedActionSet: Set<string>) => (
  actionName?: string | string[] | null,
) => {
  if (!actionName) return false;
  const names = Array.isArray(actionName) ? actionName : [actionName];

  return names.some((name) => {
    const normalized = normalizeActionName(name);
    if (!normalized) return false;
    
    // Direct match first (most common case)
    if (allowedActionSet.has(normalized)) return true;
    
    // Forward synonym lookup: if normalized action has synonyms defined, check if any synonym is in allowedActionSet
    // Example: checking "resched" -> finds synonyms ["resched", "reschedule"] -> checks if "reschedule" is in set
    const synonyms = ACTION_SYNONYMS[normalized];
    if (synonyms && synonyms.some((alias) => allowedActionSet.has(alias))) {
      return true;
    }
    
    // Reverse synonym lookup: check if normalized action is a synonym of any key in ACTION_SYNONYMS
    // Example: checking "reschedule" -> finds it's a synonym of "resched" -> checks if "reschedule" is in set
    // This handles cases where backend returns "reschedule" but we check for "resched"
    for (const [key, synonymList] of Object.entries(ACTION_SYNONYMS)) {
      if (synonymList.includes(normalized) && allowedActionSet.has(normalized)) {
        return true;
      }
      // Also check if the key itself is in the set (e.g., "resched" is in set, we're checking "reschedule")
      if (synonymList.includes(normalized) && allowedActionSet.has(key)) {
        return true;
      }
    }
    
    return false;
  });
};

export default {};
