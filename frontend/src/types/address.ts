export interface AddressResponse {
  id: number;
  user_id?: number;
  address_text: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
