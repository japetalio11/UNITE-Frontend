# Permission-Based UI Architecture

## Overview

The UNITE frontend campaign components use a **permission-based approach** for action visibility. Action buttons (Accept, Reject, Edit, Delete, etc.) are shown/hidden based on the `allowedActions` array returned by the backend API.

## Key Principles

### 1. Backend Authority
- **Backend validates permissions** - Frontend action visibility is advisory only
- Backend checks:
  - User permissions (e.g., `request.review`, `request.approve`)
  - Authority hierarchy (reviewer authority ≥ requester authority)
  - State transition validity
- Frontend **never** makes authorization decisions

### 2. Permission-Driven UI
- Action buttons show/hide based on `allowedActions` from backend
- No hardcoded role checks in action visibility logic
- Role names used ONLY for:
  - API endpoint routing (e.g., `/admin-action` vs `/coordinator-action`)
  - Display/logging context
  - NOT for determining what actions are available

### 3. Dynamic Action Computation
- Backend computes `allowedActions` per request based on:
  - Current user's permissions
  - User's authority level
  - Request state
  - Location scoping
- Frontend receives this array and shows matching UI elements

## How It Works

### Backend API Response
When fetching a request, backend includes `allowedActions`:

```json
{
  "success": true,
  "data": {
    "Request_ID": "REQ_123",
    "Status": "pending-review",
    "allowedActions": ["view", "accept", "reject", "reschedule"],
    "event": { ... },
    "reviewer": { ... }
  }
}
```

### Frontend Action Checking

```typescript
// Extract allowedActions from API response
const allowedActionSet = useAllowedActionSet({
  request,
  fullRequest,
  resolvedRequest
});

// Create checker function
const hasAllowedAction = hasAllowedActionFactory(allowedActionSet);

// Use in component
{hasAllowedAction('accept') && (
  <Button onClick={handleAccept}>Accept</Button>
)}

{hasAllowedAction(['edit', 'update']) && (
  <Button onClick={handleEdit}>Edit</Button>
)}
```

## Components

### EventCard (`event-card.tsx`)
Main card component displaying request/event details with action buttons.

**Permission-based features**:
- Extracts `allowedActions` from request data
- Shows action menu items only if action is in `allowedActions`
- Uses `hasAllowedAction()` to check permission for each button

**Role usage** (routing only):
- `resolveActorEndpoint()` - Maps role to API endpoint path
- Backend validates actual permissions regardless of endpoint used

### EventActionMenu (`event-action-menu.tsx`)
Dropdown menu with contextual actions.

**Permission-based behavior**:
- Menu items conditionally rendered based on `allowedActions`
- No hardcoded "if role === coordinator" checks

### Event Utilities (`event-card.utils.tsx`)
Helper functions for permission checking.

**Key functions**:
- `useAllowedActionSet(payload)` - Extracts allowedActions from API response
- `hasAllowedActionFactory(set)` - Creates function to check if action is allowed
- `getViewer()` - Gets user info (role for display only, NOT authorization)

## Migration from Role-Based to Permission-Based

### ❌ Old Approach (Deprecated)
```typescript
// DON'T DO THIS - hardcoded role checks
const viewer = getViewer();
if (viewer.role === 'coordinator') {
  return <Button>Accept</Button>;
}
```

### ✅ New Approach (Current)
```typescript
// DO THIS - permission-based from backend
const allowedActionSet = useAllowedActionSet({ request });
const hasAllowedAction = hasAllowedActionFactory(allowedActionSet);

{hasAllowedAction('accept') && (
  <Button>Accept</Button>
)}
```

## Common Actions

| Action Name | Permission | Authority Check | Description |
|-------------|-----------|-----------------|-------------|
| `view` | `request.read` | None | View request details |
| `edit` / `update` | `event.update` | None | Edit event details |
| `accept` | `request.review` | reviewer ≥ requester | Accept request |
| `reject` | `request.reject` | reviewer ≥ requester | Reject request |
| `reschedule` | `request.reschedule` | reviewer ≥ requester | Propose new date |
| `confirm` | `request.confirm` | Self (requester) | Confirm decision |
| `approve` | `request.approve` | reviewer ≥ requester | Final approval |
| `delete` | `request.delete` | Owner or admin | Delete request |
| `manage-staff` | `event.update` | Coordinator/admin | Manage event staff |

## Action Synonyms

Backend may return different action names. Frontend normalizes these:

- `accept` = `accepted` = `approve` = `approved`
- `reject` = `rejected` = `deny` = `denied`
- `reschedule` = `rescheduled` = `propose-reschedule`
- `edit` = `update` = `modify`
- `delete` = `remove` = `cancel` (context-dependent)

See `event-card.constants.ts` for full synonym mappings.

## Debugging Permission Issues

### Check Backend Response
```javascript
console.debug('[EventCard] Permission-based allowed actions', {
  allowedActions: Array.from(allowedActionSet),
  backendAllowedActions: request?.allowedActions,
  status: request?.Status
});
```

### Common Issues

**Issue**: Button doesn't show even though user should have permission

**Diagnosis**:
1. Check backend response: Does `allowedActions` array include the action?
2. Check user permissions: Query `/api/users/me` and verify user has required permission
3. Check authority levels: User authority ≥ requester authority?
4. Check state: Is action valid for current request state?

**Solution**:
- Grant missing permission via `seedRoles.js`
- Verify authority hierarchy configuration
- Check state machine transition rules

**Issue**: Action shows but backend returns 403 Forbidden

**Diagnosis**: Frontend and backend out of sync (cached data?)

**Solution**:
- Refetch request details: `GET /api/requests/:id`
- Check backend logs for permission denial reason
- Verify user session is current

## Testing

### Test Permission-Based Visibility

1. **Create custom role** with specific permissions:
```javascript
// In seedRoles.js
{
  code: 'test-reviewer',
  name: 'Test Reviewer',
  authority: 50,
  permissions: [
    { resource: 'request', actions: ['review', 'reject'] }
    // Note: NO approve permission
  ]
}
```

2. **Assign user to role**, login

3. **Verify UI**:
   - ✅ Should see: Accept, Reject buttons (has `request.review`, `request.reject`)
   - ❌ Should NOT see: Approve button (lacks `request.approve`)

### Test Authority Hierarchy

1. **Stakeholder (authority 30)** creates request
2. **Coordinator (authority 60)** reviews:
   - ✅ Should see action buttons (60 ≥ 30)
3. **Another Stakeholder (authority 30)** views:
   - ❌ Should NOT see review buttons (30 < 30 violated, but also lacks permission)

## Related Documentation

- **Backend Permission System**: `backend-docs/BACKEND_DOCUMENTATION.md`
- **State Machine**: `src/services/request_services/STATE_MACHINE_README.md`
- **Permission Seeding**: `src/utils/seedRoles.js`
- **API Docs**: `frontend-instruction/API_REQUESTS.md`

---

**Architecture Version**: Permission-Based v2.0  
**Last Updated**: December 2025  
**Status**: Phase 3 Complete (Frontend Implementation)
