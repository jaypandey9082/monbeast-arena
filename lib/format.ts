import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string) {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenId(id: number | string) {
  return `#${id}`;
}

export function formatPower(value: number) {
  return value.toLocaleString("en-US");
}
