import {Order} from "./Order";
import {TheMarketplace} from "../../../mp-contracts/typechain";
import {BigNumber, BytesLike, ethers, Signature} from "ethers";
import {_TypedDataEncoder, Interface} from "ethers/lib/utils";
import {Call} from "./Call";

export function encodeOrderTypedData(order: Order, chainId: number, marketplace: TheMarketplace) {
  const domain = {
    name: "The Marketplace",
    version: "1.0",
    chainId: chainId,
    verifyingContract: marketplace.address,
  };
  const types = {
    Order: [
      {name: "registry", type: "address"},
      {name: "maker", type: "address"},
      {name: "staticTarget", type: "address"},
      {name: "staticSelector", type: "bytes4"},
      {name: "staticExtradata", type: "bytes"},
      {name: "maximumFill", type: "uint256"},
      {name: "listingTime", type: "uint256"},
      {name: "expirationTime", type: "uint256"},
      {name: "salt", type: "uint256"},
    ]
  };
  const payload = _TypedDataEncoder.getPayload(domain, types, order);
  return JSON.stringify(payload);
}

export function generateSalt(): BigNumber {
  return BigNumber.from(ethers.utils.randomBytes(32));
}

export function hashOrderArgs(order: Order): any {
  return [
    order.registry, order.maker, order.staticTarget, order.staticSelector, order.staticExtradata, order.maximumFill,
    order.listingTime, order.expirationTime, order.salt
  ];
}

export function atomicMatchArgs(firstOrder: Order, firstCall: Call, firstSig: Signature,
                                secondOrder: Order, secondCall: Call, secondSig: Signature,
                                metadata: BytesLike): any {
  const abi = Interface.getAbiCoder();
  const uints = [
    BigNumber.from(firstOrder.registry), BigNumber.from(firstOrder.maker), BigNumber.from(firstOrder.staticTarget),
    firstOrder.maximumFill, firstOrder.listingTime, firstOrder.expirationTime, firstOrder.salt,
    BigNumber.from(firstCall.target),
    BigNumber.from(secondOrder.registry), BigNumber.from(secondOrder.maker), BigNumber.from(secondOrder.staticTarget),
    secondOrder.maximumFill, secondOrder.listingTime, secondOrder.expirationTime, secondOrder.salt,
    BigNumber.from(secondCall.target),
  ];
  const staticSelectors = [firstOrder.staticSelector, secondOrder.staticSelector];
  const howToCalls = [firstCall.howToCall, secondCall.howToCall];
  const signatures = abi.encode(["bytes", "bytes"], [
    abi.encode(["uint8", "bytes32", "bytes32"], [firstSig.v, firstSig.r, firstSig.s]),
    abi.encode(["uint8", "bytes32", "bytes32"], [secondSig.v, secondSig.r, secondSig.s]),
  ]);
  return [
    uints, staticSelectors,
    firstOrder.staticExtradata, firstCall.data, secondOrder.staticExtradata, secondCall.data,
    howToCalls, metadata, signatures
  ];
}

export function currentTime(): number {
  return Math.floor(Date.now() / 1000);
}
