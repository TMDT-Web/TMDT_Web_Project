/* eslint-disable */
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { AddressResponse } from "../models/AddressResponse";

export class AddressesService {
  /** ADMIN: get all addresses for a user */
  public static async adminGet(userId: number): Promise<AddressResponse[]> {
    return __request(OpenAPI, {
      method: "GET",
      url: `/api/v1/addresses/admin/${userId}`,
    }) as Promise<AddressResponse[]>;
  }

  /** Get current user's addresses */
  public static async getMyAddressesApiV1AddressesGet(): Promise<AddressResponse[]> {
    return __request(OpenAPI, {
      method: "GET",
      url: `/api/v1/addresses`,
    }) as Promise<AddressResponse[]>;
  }

  /** Create a new address for current user */
  public static async createAddressApiV1AddressesPost(payload: any): Promise<AddressResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: `/api/v1/addresses`,
      body: payload,
      mediaType: "application/json",
    }) as Promise<AddressResponse>;
  }

  /** Update address by id for current user */
  public static async updateAddressApiV1AddressesAddressIdPut(addressId: number, payload: any): Promise<AddressResponse> {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/addresses/${addressId}`,
      body: payload,
      mediaType: "application/json",
    }) as Promise<AddressResponse>;
  }

  /** Delete address by id for current user */
  public static async deleteAddressApiV1AddressesAddressIdDelete(addressId: number): Promise<void> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: `/api/v1/addresses/${addressId}`,
    }) as Promise<void>;
  }
}
