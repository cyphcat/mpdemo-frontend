import {BigNumberish, BytesLike} from "ethers";

export interface Order {
  /* Order registry address. */
  registry: string;
  /* Order maker address. */
  maker: string;
  /* Order static target. */
  staticTarget: string;
  /* Order static selector. */
  staticSelector: string;
  /* Order static extradata. */
  staticExtradata: BytesLike;
  /* Order maximum fill factor. */
  maximumFill: BigNumberish;
  /* Order listing timestamp. */
  listingTime: BigNumberish;
  /* Order expiration timestamp - 0 for no expiry. */
  expirationTime: BigNumberish;
  /* Order salt to prevent duplicate hashes. */
  salt: BigNumberish;
}
