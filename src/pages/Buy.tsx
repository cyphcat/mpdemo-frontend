import Button from "../components/Button";
import {useContracts} from "../contracts/ContractsContext";
import {useCallback, useEffect, useState} from "react";
import {BigNumber, ethers} from "ethers";
import {useEthereum} from "../wallet/EthereumContext";
import {useParams} from "react-router-dom";
import {formatBytes32String, Interface, splitSignature} from "ethers/lib/utils";
import {Order} from "../wyvern/Order";
import {atomicMatchArgs, currentTime, encodeOrderTypedData, generateSalt} from "../wyvern/wyvern";
import {OrderListing} from "../wyvern/OrderListing";
import {Call, HowToCall} from "../wyvern/Call";
import {api} from "../api/api";

const abi = Interface.getAbiCoder();

export default function Buy() {
  const {hash} = useParams();

  const [listing, setListing] = useState<OrderListing>();

  const {provider, wallet} = useEthereum();
  const {TheMarketplace, TheMarketplaceRegistry, StaticMarket, IERC20, IERC721} = useContracts();

  useEffect(() => {
    (async () => {
      if (hash) {
        const listing = await api.fetchOrder(hash);
        setListing(listing);
      }
    })().catch(e => {
      console.warn(e);
    });
  }, [hash]);

  const registerProxy = useCallback(() => {
    if (wallet) {
      TheMarketplaceRegistry.connect(wallet.signer).registerProxy()
        .catch(e => {
          console.warn(e);
        });
    }
  }, [wallet, TheMarketplaceRegistry]);

  const approve = useCallback(() => {
    if (wallet && listing) {
      (async () => {
        const proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        if (proxy === ethers.constants.AddressZero) {
          throw new Error("proxy not registered");
        }
        const erc20 = IERC20(listing.paymentToken);
        const balance = await erc20.connect(wallet.signer).balanceOf(wallet.address);

        await erc20.connect(wallet.signer).approve(proxy, balance);
      })().catch(e => {
        console.warn(e);
      });
    }
  }, [wallet, IERC20, TheMarketplaceRegistry, listing]);

  const signAndMatch = useCallback(() => {
    if (provider && wallet && listing) {

      const typedData: Record<"message", Record<keyof Order, any>> = JSON.parse(listing.data);
      const order = typedData.message;
      const sellOrder: Order = {
        registry: order.registry,
        maker: order.maker,
        staticTarget: order.staticTarget,
        staticSelector: order.staticSelector,
        staticExtradata: order.staticExtradata,
        maximumFill: Number.parseInt(order.maximumFill),
        listingTime: Number.parseInt(order.listingTime),
        expirationTime: Number.parseInt(order.expirationTime),
        salt: order.salt,
      };
      console.log(order);

      const now = currentTime();
      const price = BigNumber.from(listing.price);
      const buyOrder: Order = {
        registry: TheMarketplaceRegistry.address,
        maker: wallet.address,
        staticTarget: StaticMarket.address,
        staticSelector: Interface.getSighash(StaticMarket.interface.functions["ERC20ForERC721(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"]),
        staticExtradata: abi.encode(
          ["address[2]", "uint256[2]"],
          [[listing.paymentToken, listing.token], [listing.tokenId, price]]),
        maximumFill: 1,
        listingTime: now,
        expirationTime: now + 7 * 24 * 60 * 60,
        salt: generateSalt(),
      };

      const buyOrderData = encodeOrderTypedData(buyOrder, 31337, TheMarketplace);

      const sellCall: Call = {
        target: listing.token,
        howToCall: HowToCall.Call,
        data: IERC721(listing.token).interface.encodeFunctionData(
          "transferFrom", [sellOrder.maker, buyOrder.maker, listing.tokenId])
      };
      const buyCall: Call = {
        target: listing.paymentToken,
        howToCall: HowToCall.Call,
        data: IERC20(listing.paymentToken).interface.encodeFunctionData(
          "transferFrom", [buyOrder.maker, sellOrder.maker, price])
      };
      const metadata = formatBytes32String("");

      (async () => {
        const sig = await provider.send("eth_signTypedData_v4", [wallet.address, buyOrderData]);

        const buySig = splitSignature(sig);
        const sellSig = splitSignature(listing.signature);

        await TheMarketplace.connect(wallet.signer).atomicMatch_.apply(null,
          atomicMatchArgs(sellOrder, sellCall, sellSig, buyOrder, buyCall, buySig, metadata));

        await api.fillOrder(listing.hash);

      })().catch(e => {
        console.warn(e);
      });
    }
  }, [provider, wallet, listing, TheMarketplaceRegistry, TheMarketplace, StaticMarket, IERC20, IERC721]);

  return (
    <div>
      <h1>Buy</h1>

      <Button onClick={registerProxy}>Register Proxy</Button>
      <Button onClick={approve}>Approve</Button>
      <Button onClick={signAndMatch}>Buy</Button>
    </div>
  );
}
