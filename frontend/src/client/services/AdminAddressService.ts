import { OpenAPI } from "@/client/core/OpenAPI";
import { request } from "@/client/core/request";
import type { AddressCreate } from "@/client/models/AddressCreate";
import type { AddressResponse } from "@/client/models/AddressResponse";

export class AdminAddressService {
  static getUserAddresses(userId: number): Promise<AddressResponse[]> {
    return request(OpenAPI, {
      method: "GET",
      url: `/api/v1/admin/users/${userId}/addresses`,
    });
  }

  static create(userId: number, data: AddressCreate): Promise<AddressResponse> {
    return request(OpenAPI, {
      method: "POST",
      url: `/api/v1/admin/users/${userId}/addresses`,
      body: data,
      mediaType: "application/json",
    });
  }

  static delete(userId: number, addressId: number): Promise<any> {
    return request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/admin/users/${userId}/addresses/${addressId}`,
    });
  }
}
