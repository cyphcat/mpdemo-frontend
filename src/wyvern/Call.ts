import {BytesLike} from "ethers";

export interface Call {
  /* Target */
  target: string;
  /* How to call */
  howToCall: HowToCall;
  /* Calldata */
  data: BytesLike;
}

export enum HowToCall {
  Call, DelegateCall
}
