# Profile Page Refactoring - Address Management

## Overview
Refactored the Profile page (`frontend/src/pages/shop/Profile.tsx`) to provide comprehensive address management for the **currently logged-in user**. The page now has four distinct tabs:

1. **Thông tin cá nhân** (Personal Info) - Name, Email, Phone
2. **Địa chỉ của tôi** (My Addresses) - Create, Edit, Delete, Set Default
3. **Đơn hàng của tôi** (My Orders) - View order history
4. **Đổi mật khẩu** (Change Password) - Update password

## Key Changes

### State Management
- **Personal Info State:**
  - `formData`: Contains `full_name`, `phone`, `address`
  
- **Address Management State:**
  - `addresses`: Array of all user's addresses
  - `isAddingAddress`: Boolean to show/hide address form
  - `editingAddressId`: Track which address is being edited (null for new)
  - `addressForm`: Form data with fields:
    - `receiver_name`, `receiver_phone` (recipient info)
    - `city_code`, `city_name` (province)
    - `district_code`, `district_name` (district)
    - `ward_code`, `ward_name` (ward/commune)
    - `street` (street address / house number)

### Features

#### 1. **View Addresses**
- Displays all addresses in a scrollable list
- Each address card shows:
  - Recipient name and phone
  - Full address (street, ward, district, city)
  - "Mặc định" (Default) badge for default address
- Cards are styled differently for default address (amber background with brown border)

#### 2. **Create New Address**
- "+ Thêm địa chỉ" button opens a green-bordered form
- Form includes:
  - Recipient name input
  - Recipient phone input
  - City dropdown (populated from Vietnam address data)
  - District dropdown (cascades from city selection)
  - Ward dropdown (cascades from district selection)
  - Street address input
- Form validates that all fields are filled before submission
- POSTs to `/api/v1/addresses` via `AddressesService.createAddressApiV1AddressesPost()`
- Success/error alerts shown to user
- Form resets after successful creation

#### 3. **Edit Existing Address**
- "Sửa" button on each address card opens the same form with pre-populated data
- Updates via `AddressesService.updateAddressApiV1AddressesAddressIdPut(id, payload)`
- Form behaves identically to create, but sends PUT request instead of POST

#### 4. **Delete Address**
- "Xóa" button on each address card
- Confirmation dialog before deletion
- Calls `AddressesService.deleteAddressApiV1AddressesAddressIdDelete(id)`
- Address list reloads after deletion

#### 5. **Set Default Address**
- "Đặt làm mặc định" button appears on non-default addresses
- Updates the address with `is_default: true`
- Only one address can be default at a time
- Button hidden for already-default address

### Backend Integration

**API Endpoints Used:**
- `GET /api/v1/addresses` - Fetch all addresses for current user (via `getMyAddressesApiV1AddressesGet()`)
- `POST /api/v1/addresses` - Create new address (via `createAddressApiV1AddressesPost(payload)`)
- `PUT /api/v1/addresses/{id}` - Update address (via `updateAddressApiV1AddressesAddressIdPut(id, payload)`)
- `DELETE /api/v1/addresses/{id}` - Delete address (via `deleteAddressApiV1AddressesAddressIdDelete(id)`)

**Payload Structure:**
```typescript
{
  name?: string;
  receiver_name: string;
  receiver_phone: string;
  address_line: string;
  city: string;
  district: string;
  ward: string;
  postal_code?: string;
  notes?: string;
  is_default?: boolean;
}
```

### Frontend Service Updates

**Added to `AddressesService.ts`:**
```typescript
public static async deleteAddressApiV1AddressesAddressIdDelete(addressId: number): Promise<void>
```

This method sends a DELETE request to `/api/v1/addresses/{addressId}` for removing addresses.

## UI/UX Design

### Sidebar Navigation
- Four tab buttons with active state highlighting
- Color: Active tabs show `[rgb(var(--color-wood))]` background
- Clean, organized vertical menu

### Address Cards
- **Default Address:**
  - 2px brown border with amber background
  - Shows "Mặc định" badge in top-right
  
- **Non-Default Address:**
  - 2px gray border, hovers to darker gray
  - Shows action buttons: "Đặt làm mặc định", "Sửa", "Xóa"
  
- **Action Buttons:**
  - "Đặt làm mặc định": Brown border/text, amber hover
  - "Sửa": Blue border/text, blue hover
  - "Xóa": Red border/text, red hover

### Address Form
- Green-bordered box (`border-[rgb(var(--color-moss))]`) for visual distinction
- Light green background (`bg-green-50`)
- Form title shows "Thêm" (Add) or "Cập nhật" (Update)
- Cascading dropdowns provide intuitive city→district→ward selection
- Disabled state for dropdowns until parent is selected
- Cancel and Save buttons with appropriate styling

## Build Status

✅ **Frontend Build:** Successful
- No TypeScript errors
- Vite compilation successful
- 1575 modules transformed
- Production dist: 443.22 KB (124.35 KB gzipped)

## User Workflow

### Adding a New Address
1. User clicks on "Địa chỉ của tôi" tab in sidebar
2. Clicks "+ Thêm địa chỉ" button
3. Green form appears with empty fields
4. Form pre-fills with current user's name and phone
5. User fills in:
   - City (auto-populates district options)
   - District (auto-populates ward options)
   - Ward (no further cascade)
   - Street address
6. Clicks "Thêm địa chỉ" button
7. Form validates
8. POST request sent to backend
9. New address appears in the list
10. Form closes and resets

### Setting Default Address
1. User clicks "Đặt làm mặc định" on non-default address
2. PUT request sent with `is_default: true`
3. List refreshes
4. Selected address now shows "Mặc định" badge and amber styling
5. Old default address reverts to normal styling

### Editing an Address
1. User clicks "Sửa" button on an address card
2. Form opens with address data pre-populated
3. City/District/Ward dropdowns auto-select based on DB values
4. User can modify any field
5. Clicks "Cập nhật địa chỉ" button
6. PUT request sent with updated data
7. List refreshes and form closes

### Deleting an Address
1. User clicks "Xóa" button on an address card
2. Confirmation dialog appears: "Bạn chắc chắn muốn xóa địa chỉ này?"
3. If confirmed, DELETE request sent
4. Address removed from list
5. Success message shown

## Notes & Considerations

1. **Vietnam Address Data:** Uses hierarchical address data from `@/utils/vietnam-address.json`
   - Supports cascading selection: City → District → Ward
   - Properly handles edge cases (no districts in some cities, no wards in some districts)

2. **Form Validation:**
   - Required fields: `street`, `city_code`, `district_code`, `ward_code`
   - Receiver name and phone default to current user values (can be changed)
   - Shows alert if validation fails

3. **Error Handling:**
   - API errors display as browser alerts
   - Could be upgraded to toast notifications in future
   - Network errors logged to console

4. **Address Defaults:**
   - `postal_code` and `notes` sent as empty strings (not required)
   - New addresses default to `is_default: false`
   - Explicit button click required to set as default

5. **Re-export from AddressesService:**
   - The delete method was added to `AddressesService.ts`
   - Follows existing pattern for GET/POST/PUT methods
   - Uses OpenAPI `__request` utility for HTTP call

## Testing Checklist

- [ ] Login as a regular user (not admin)
- [ ] Navigate to Profile page
- [ ] Verify "Địa chỉ của tôi" tab appears in sidebar
- [ ] Click "+ Thêm địa chỉ" button
- [ ] Form appears with user's name/phone pre-filled
- [ ] Select city → verify districts auto-populate
- [ ] Select district → verify wards auto-populate
- [ ] Fill street address
- [ ] Click "Thêm địa chỉ"
- [ ] New address appears in list
- [ ] Click "Sửa" on an address → form opens with data
- [ ] Modify address → click "Cập nhật" → verify update
- [ ] Click "Đặt làm mặc định" → verify badge appears
- [ ] Click "Xóa" → confirm dialog → verify deletion
- [ ] Verify all error scenarios show appropriate alerts

## File Changes

- **Created/Modified:** `frontend/src/pages/shop/Profile.tsx`
- **Modified:** `frontend/src/client/services/AddressesService.ts` (added delete method)
- **Backup:** `frontend/src/pages/shop/Profile_old.tsx` (original version retained)

## Next Steps (Optional Enhancements)

1. Upgrade browser alerts to toast notifications (Toastify, Sonner, etc.)
2. Add loading states for async operations
3. Add form validation with error messages below fields (not just alerts)
4. Add address search/filter functionality
5. Add address types (home, work, other) as optional field
6. Implement debouncing for address form changes
7. Add success toast notifications instead of alerts
