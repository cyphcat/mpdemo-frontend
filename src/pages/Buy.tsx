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
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import Loading from "../components/Loading";

const abi = Interface.getAbiCoder();

export default function Buy() {
  const {hash} = useParams();

  const {provider, wallet} = useEthereum();
  const {TheMarketplace, TheMarketplaceRegistry, StaticMarket, IERC20, IERC721} = useContracts();

  const [listing, setListing] = useState<OrderListing>();

  const [proxy, setProxy] = useState<"registering" | string | null>(null);
  const [approved, setApproved] = useState<"approving" | boolean>(false);
  const [matched, setMatched] = useState(false);

  const [loading, setLoading] = useState<"registerProxy" | "approve" | "signAndMatch" | false>(false);

  useEffect(() => {
    if (wallet && hash) {
      (async () => {

        const _listing = await api.fetchOrder(hash);
        setListing(_listing);

        // check proxy
        const _proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        setProxy(_proxy !== ethers.constants.AddressZero ? _proxy : null);

        // check approval
        if (_proxy !== ethers.constants.AddressZero && _listing) {
          const price = BigNumber.from(_listing.price);
          const allowance = await IERC20(_listing.paymentToken).connect(wallet.signer).allowance(wallet.address, _proxy);
          setApproved(allowance.gte(price));
        }

      })().catch(e => {
        console.warn(e);
      });
    }
  }, [wallet, hash, IERC721, TheMarketplaceRegistry]);

  const registerProxy = useCallback(() => {
    if (wallet) {
      setLoading("registerProxy");
      (async () => {
        await TheMarketplaceRegistry.connect(wallet.signer).registerProxy();
        setProxy("registering");
      })().catch(e => {
        console.warn(e);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [wallet, TheMarketplaceRegistry]);

  useEffect(() => {
    if (wallet && listing && proxy === "registering") {
      const handle = setInterval(async () => {
        const p = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        if (p !== ethers.constants.AddressZero) {
          setProxy(p);
        }
      }, 4000);
      return () => {
        clearInterval(handle);
      };
    }
  }, [wallet, listing, proxy, TheMarketplaceRegistry]);

  const approve = useCallback(() => {
    if (wallet && listing) {
      setLoading("approve");
      (async () => {
        const proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        if (proxy === ethers.constants.AddressZero) {
          throw new Error("proxy not found");
        }
        const erc20 = IERC20(listing.paymentToken);
        const price = BigNumber.from(listing.price);
        await erc20.connect(wallet.signer).approve(proxy, price);
        setApproved("approving");
      })().catch(e => {
        console.warn(e);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [wallet, IERC20, TheMarketplaceRegistry, listing]);

  useEffect(() => {
    if (wallet && listing && proxy && proxy !== "registering") {
      const erc20 = IERC20(listing.paymentToken);
      const filter = erc20.filters["Approval(address,address,uint256)"](wallet.address, proxy);
      const price = BigNumber.from(listing.price);
      const listener = () => erc20.connect(wallet.signer).allowance(wallet.address, proxy)
        .then(allowance => setApproved(allowance.gte(price)));
      erc20.connect(wallet.signer).on(filter, listener);
      return () => {
        erc20.off(filter, listener);
      };
    }
  }, [wallet, listing, proxy, IERC20]);

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

      setLoading("signAndMatch");
      (async () => {
        const sig = await provider.send("eth_signTypedData_v4", [wallet.address, buyOrderData]);

        const buySig = splitSignature(sig);
        const sellSig = splitSignature(listing.signature);

        await TheMarketplace.connect(wallet.signer).atomicMatch_.apply(null,
          atomicMatchArgs(sellOrder, sellCall, sellSig, buyOrder, buyCall, buySig, metadata));

        await api.fillOrder(listing.hash);
        setMatched(true);

      })().catch(e => {
        console.warn(e);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [provider, wallet, listing, TheMarketplaceRegistry, TheMarketplace, StaticMarket, IERC20, IERC721]);

  return (
    <div className="mx-auto text-center">

      {wallet ? (
        <>
          <div className="my-16">
            <h1 className="text-6xl">buy</h1>
          </div>

          {listing ? (
            <>
              <div>
                <img alt="" className="inline-block bg-white/10 p-2 rounded-md"
                     src={process.env.PUBLIC_URL + "/images/a0.png"} />
              </div>
              <h2 className="font-bold my-4">The NFT #{listing.tokenId}</h2>

              <Button disabled={!!loading || proxy === "registering" || proxy != null}
                      onClick={registerProxy}>
                {
                  loading === "registerProxy" ? (<i className="animate-spin fa fa-circle-notch" />)
                    : proxy === "registering" ? (<><i className="animate-spin fa fa-circle-notch" /> Registering</>)
                      : proxy ? "Registered"
                        : "Register Proxy"
                }
              </Button>

              <i className="fa fa-arrow-right mx-4"></i>
              <Button
                disabled={!!loading || approved === "approving" || approved || proxy === "registering" || proxy == null}
                onClick={approve}>
                {
                  loading === "approve" ? (<i className="animate-spin fa fa-circle-notch" />)
                    : approved === "approving" ? (<><i className="animate-spin fa fa-circle-notch" /> Approving</>)
                      : approved ? "Approved"
                        : "Approve"
                }
              </Button>

              <i className="fa fa-arrow-right mx-4"></i>
              <Button
                disabled={!!loading || proxy === "registering" || proxy == null || approved === "approving" || !approved || matched}
                onClick={signAndMatch}
                color="primary">
                {
                  loading === "signAndMatch" ? (<i className="animate-spin fa fa-circle-notch" />)
                    : matched ? "Bought"
                      : "Buy"
                }
              </Button>
            </>
          ) : (
            <Loading />
          )}
        </>
      ) : (
        <ConnectWalletMessage />
      )}
    </div>
  );
}
