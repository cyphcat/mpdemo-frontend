import {OrderListing} from "../wyvern/OrderListing";
import axios from "axios";

const apiBaseUrl = "http://localhost:8080/api";

async function fetchOrders(): Promise<OrderListing[]> {
  return axios.get(`${apiBaseUrl}/orders`)
    .then(r => r.data as OrderListing[]);
}

async function fetchOrder(hash: string): Promise<OrderListing | undefined> {
  return axios.get(`${apiBaseUrl}/orders/${hash}`)
    .then(r => r.data as OrderListing);
}

async function listOrder(listing: OrderListing) {
  return axios.post(`${apiBaseUrl}/orders`, listing);
}

async function fillOrder(hash: string) {
  return axios.delete(`${apiBaseUrl}/orders/${hash}`);
}

export const api = {
  fetchOrders,
  fetchOrder,
  listOrder,
  fillOrder,
};
