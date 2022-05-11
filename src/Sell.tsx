import {useParams} from "react-router-dom";
import {useCallback, useEffect} from "react";
import {useContracts} from "./contracts/ContractsContext";
import {useEthereum} from "./wallet/EthereumContext";
import {currentTime, encodeOrderTypedData, generateSalt, hashOrderArgs} from "./wyvern/wyvern";
import {Order} from "./wyvern/Order";
import {Interface, parseUnits} from "ethers/lib/utils";
import Button from "./Button";
import {ethers} from "ethers";
import {OrderListing} from "./wyvern/OrderListing";
import {api} from "./api/api";

const abi = Interface.getAbiCoder();

export default function Sell() {
  const {token, tokenId} = useParams();

  const {provider, wallet} = useEthereum();
  const {TheMarketplace, TheMarketplaceRegistry, TheCoin, StaticMarket, IERC721} = useContracts();

  useEffect(() => {
    if (wallet && token && tokenId) {
      (async () => {
        const owner = await IERC721(token).connect(wallet.signer).ownerOf(tokenId);
        if (owner.toLowerCase() === wallet.address) {
          // ok
        }
      })().catch(e => {
        console.warn(e);
      });
    }
  }, [wallet, token, tokenId, IERC721]);

  const registerProxy = useCallback(() => {
    if (wallet) {
      TheMarketplaceRegistry.connect(wallet.signer).registerProxy()
        .then(() => {

        });
    }
  }, [wallet, TheMarketplaceRegistry]);

  const approve = useCallback(() => {
    if (wallet && token) {
      (async () => {
        const proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        if (proxy === ethers.constants.AddressZero) {
          throw new Error("proxy not found");
        }
        await IERC721(token).connect(wallet.signer).setApprovalForAll(proxy, true);
      })().catch(e => {
        console.warn(e);
      });
    }
  }, [wallet, IERC721, TheMarketplaceRegistry, token]);

  const sign = useCallback(() => {
    if (provider && wallet && token && tokenId) {
      const now = currentTime();
      const price = parseUnits("10.0");
      const sellOrder: Order = {
        registry: TheMarketplaceRegistry.address,
        maker: wallet.address,
        staticTarget: StaticMarket.address,
        staticSelector: Interface.getSighash(StaticMarket.interface.functions["ERC721ForERC20(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"]),
        staticExtradata: abi.encode(
          ["address[2]", "uint256[2]"],
          [[token, TheCoin.address], [tokenId, price]]),
        maximumFill: 1,
        listingTime: now,
        expirationTime: now + 7 * 24 * 60 * 60,
        salt: generateSalt(),
      };
      const sellOrderData = encodeOrderTypedData(sellOrder, 31337, TheMarketplace);

      (async () => {
        const hash = await TheMarketplace.connect(wallet.signer).hashOrder_.apply(null, hashOrderArgs(sellOrder));
        const sig = await provider.send("eth_signTypedData_v4", [wallet.address, sellOrderData]);

        const listing: OrderListing = {
          hash: hash,
          data: sellOrderData,
          signature: sig,
          maker: wallet.address,
          token: token,
          tokenId: tokenId,
          price: price.toString(),
          paymentToken: TheCoin.address,
        };

        await api.listOrder(listing);

      })().catch(e => {
        console.warn(e);
      });
    }
  }, [provider, wallet, token, tokenId, TheMarketplaceRegistry, TheMarketplace, StaticMarket, TheCoin]);

  return (
    <div>
      <h1>Sell</h1>

      <Button onClick={registerProxy}>Register Proxy</Button>
      <Button onClick={approve}>Approve</Button>
      <Button onClick={sign}>List</Button>
    </div>
  );
}
