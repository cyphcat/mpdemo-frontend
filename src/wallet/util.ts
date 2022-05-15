export function shortWalletAddress(address: string) {
  return address.substring(0, 6) + "..." + address.substring(38);
}

export function unlessCancelledByUser(error: any, callback: () => any) {
  if (error?.code === 4001) {
    console.warn("cancelled by user");
  } else {
    callback();
  }
}
