import {OrderListing} from "../wyvern/OrderListing";
import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080/api";

async function fetchOrders(): Promise<OrderListing[]> {
  return axios.get(`${API_BASE_URL}/orders`)
    .then(r => r.data as OrderListing[]);
}

async function fetchOrder(hash: string): Promise<OrderListing | undefined> {
  return axios.get(`${API_BASE_URL}/orders/${hash}`)
    .then(r => r.data as OrderListing);
}

async function listOrder(listing: OrderListing) {
  return axios.post(`${API_BASE_URL}/orders`, listing);
}

async function fillOrder(hash: string) {
  return axios.delete(`${API_BASE_URL}/orders/${hash}`);
}

export const api = {
  fetchOrders,
  fetchOrder,
  listOrder,
  fillOrder,
};
