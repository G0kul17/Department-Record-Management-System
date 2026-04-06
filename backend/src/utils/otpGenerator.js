import { randomInt } from "crypto";

export function generateOTP() {
  return randomInt(100000, 1000000).toString();
}

export function getExpiryDate(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
