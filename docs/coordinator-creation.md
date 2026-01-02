# Coordinator Creation Documentation

## Overview

This document describes the frontend implementation for creating coordinators in the UNITE system. The coordinator creation flow uses dynamic data loading, authority-based filtering, and proper validation to ensure coordinators are created with the correct roles, organizations, and coverage areas.

## Component Structure

### Main Component: AddStaffModal

**File**: `components/coordinator-management/add-staff-modal.tsx`

The main modal component for creating coordinators. It handles:
- Personal information input (name, email, password)
- Dynamic organization selection (multiple organizations)
- Municipality selection with optional barangays
- Role assignment (filtered by authority)
- Coverage area assignment

### Supporting Components

#### OrganizationSelector

**File**: `components/coordinator-management/organization-selector.tsx`

Multi-select component for selecting organizations with:
- Search/filter functionality
- Visual selection indicators
- Chip display for selected organizations
- Validation support

#### MunicipalityTreeSelector

**File**: `components/coordinator-management/municipality-tree-selector.tsx`

Tree view component for selecting municipalities with:
- Nested barangay display (optional)
- Expand/collapse functionality
- Search/filter support
- Hierarchical selection (selecting municipality selects all barangays)

#### RoleAssignmentSection

**File**: `components/coordinator-management/role-assignment-section.tsx`

Role selection component that:
- Filters roles based on creator authority
- Only shows roles with operational permissions
- Uses `getAssignableRoles` API with `coordinator-management` context

## Data Flow

### 1. Modal Opens

When the modal opens, it automatically fetches:
1. **Creation Context** (`GET /api/users/create-context?pageContext=coordinator-management`)
   - Returns: organizations, municipalities, roles
2. **Municipalities with Barangays** (`GET /api/users/creation-context/municipalities`)
   - Returns: municipalities with nested barangays

### 2. User Interaction

1. User fills in personal information
2. User selects one or more organizations from the available list
3. User selects municipalities (and optionally barangays)
4. User selects a role (filtered by authority)
5. User optionally assigns coverage areas via the coverage assignment modal

### 3. Form Submission

When the form is submitted:
1. Frontend validates:
   - At least one organization selected
   - At least one municipality or coverage area selected
   - Role selected
   - Password matches confirmation
   - Password length ≥ 6 characters

2. Data is sent to `POST /api/users` with:
   ```typescript
   {
     email: string,
     password: string,
     firstName: string,
     lastName: string,
     organizationIds: string[], // Multiple organizations
     roles: string[],
     coverageAreaIds?: string[],
     municipalityIds?: string[],
     pageContext: 'coordinator-management'
   }
   ```

3. Backend validates and creates the coordinator

## API Integration

### Fetching Creation Context

```typescript
const fetchCreationContext = async () => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6700";
  const token = localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Fetch creation context
  const contextRes = await fetch(
    `${base}/api/users/create-context?pageContext=coordinator-management`,
    { headers }
  );
  
  const contextData = await contextRes.json();
  
  if (contextData.success) {
    setAvailableOrganizations(contextData.data.allowedOrganizations || []);
    setAvailableMunicipalities(contextData.data.allowedMunicipalities || []);
  }

  // Fetch municipalities with barangays
  const municipalitiesRes = await fetch(
    `${base}/api/users/creation-context/municipalities`,
    { headers }
  );
  
  if (municipalitiesRes.ok) {
    const municipalitiesData = await municipalitiesRes.json();
    if (municipalitiesData.success) {
      // Merge barangays into municipalities
      const municipalitiesWithBarangays = contextData.data.allowedMunicipalities.map((muni) => {
        const muniWithBarangays = municipalitiesData.data.municipalities.find(
          (m) => m._id === muni._id
        );
        return muniWithBarangays || muni;
      });
      setAvailableMunicipalities(municipalitiesWithBarangays);
    }
  }
};
```

### Creating Coordinator

```typescript
const handleSubmit = async (data: CreateStaffData) => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6700";
  const token = localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "x-page-context": "coordinator-management",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${base}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || "Failed to create coordinator");
  }
  
  return result.data;
};
```

## Validation Logic

### Frontend Validation

1. **Organization Validation**:
   - At least one organization must be selected
   - Organizations are filtered based on creator's jurisdiction

2. **Municipality Validation**:
   - At least one municipality or coverage area must be selected
   - Municipalities are filtered based on creator's coverage areas

3. **Role Validation**:
   - Exactly one role must be selected
   - Role must have operational permissions
   - Role authority must be < creator authority

4. **Password Validation**:
   - Minimum 6 characters
   - Must match confirmation

### Backend Validation

The backend enforces:
- Creator authority ≥ 60
- At least one organization
- At least one coverage area
- Role authority < creator authority
- Organizations within creator's jurisdiction
- Coverage areas within creator's jurisdiction
- Email uniqueness (idempotent check)

## Error Handling

### Loading States

- `isLoadingContext`: Shows loading indicator while fetching creation context
- `isSubmittingLocal`: Prevents double submissions

### Error Display

- `contextError`: Displays API errors when fetching context
- `submitError`: Displays form submission errors
- Field-specific errors: `organizationError`, `municipalityError`, `roleError`

### Error Recovery

- Retry button for context loading errors
- Clear error messages on field changes
- Prevent form submission when errors exist

## State Management

### Component State

```typescript
// Organizations
const [availableOrganizations, setAvailableOrganizations] = useState<any[]>([]);
const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);

// Municipalities
const [availableMunicipalities, setAvailableMunicipalities] = useState<any[]>([]);
const [selectedMunicipalityIds, setSelectedMunicipalityIds] = useState<string[]>([]);
const [selectedBarangayIds, setSelectedBarangayIds] = useState<string[]>([]);

// Roles
const [selectedRoleId, setSelectedRoleId] = useState<string>("");

// Loading & Errors
const [isLoadingContext, setIsLoadingContext] = useState(false);
const [contextError, setContextError] = useState<string | null>(null);
const [submitError, setSubmitError] = useState<string | null>(null);
```

## Type Definitions

### CreateStaffData

```typescript
export interface CreateStaffData {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  organizationIds?: string[]; // Multiple organizations
  organizationId?: string; // Backward compatibility
  roles: string[]; // Role IDs or codes
  coverageAreaIds?: string[]; // Coverage area IDs
  locationIds?: string[]; // Location IDs for creating coverage areas
  municipalityIds?: string[]; // Municipality IDs
  pageContext?: string; // 'coordinator-management'
}
```

## Best Practices

1. **Always fetch context on modal open**: Ensures data is fresh
2. **Handle loading states**: Show loading indicators during API calls
3. **Validate on both frontend and backend**: Frontend for UX, backend for security
4. **Clear errors on field changes**: Improve user experience
5. **Prevent double submissions**: Use local submission state
6. **Show helpful error messages**: Guide users to fix issues

## Future Enhancements

- Real-time validation as user types
- Auto-save draft functionality
- Bulk coordinator creation
- Import from CSV/Excel
- Advanced filtering for organizations and municipalities

