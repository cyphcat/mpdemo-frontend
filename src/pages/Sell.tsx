import {useParams} from "react-router-dom";
import {useCallback, useEffect, useState} from "react";
import {useContracts} from "../contracts/ContractsContext";
import {useEthereum} from "../wallet/EthereumContext";
import {currentTime, encodeOrderTypedData, generateSalt, hashOrderArgs} from "../wyvern/wyvern";
import {Order} from "../wyvern/Order";
import {Interface, parseUnits} from "ethers/lib/utils";
import Button from "../components/Button";
import {ethers} from "ethers";
import {OrderListing} from "../wyvern/OrderListing";
import {api} from "../api/api";
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import {toast} from "react-toastify";
import {unlessCancelledByUser} from "../wallet/util";

const abi = Interface.getAbiCoder();

export default function Sell() {
  const {token, tokenId} = useParams();

  const {provider, wallet} = useEthereum();
  const {TheMarketplace, TheMarketplaceRegistry, TheCoin, StaticMarket, IERC721} = useContracts();

  const [proxy, setProxy] = useState<"registering" | string | null>(null);
  const [approved, setApproved] = useState<"approving" | boolean>(false);
  const [listed, setListed] = useState(false);

  const [loading, setLoading] = useState<"registerProxy" | "approve" | "signAndList" | false>(false);

  useEffect(() => {
    if (wallet && token && tokenId) {
      (async () => {

        // check proxy
        const _proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        setProxy(_proxy !== ethers.constants.AddressZero ? _proxy : null);

        // check approval
        if (_proxy !== ethers.constants.AddressZero) {
          const approved = await IERC721(token).connect(wallet.signer).isApprovedForAll(wallet.address, _proxy);
          setApproved(approved);
        }

        // todo: check listed?

      })().catch(e => {
        toast.warn("something went wrong");
        console.warn(e);
      });
    }
  }, [wallet, token, tokenId, IERC721, TheMarketplaceRegistry]);

  const registerProxy = useCallback(() => {
    if (wallet) {
      setLoading("registerProxy");
      (async () => {
        await TheMarketplaceRegistry.connect(wallet.signer).registerProxy();
        setProxy("registering");
        toast.success("registering proxy")
      })().catch(e => {
        unlessCancelledByUser(e, () => toast.error("failed to register proxy"));
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [wallet, TheMarketplaceRegistry]);

  useEffect(() => {
    if (wallet && token && proxy === "registering") {
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
  }, [wallet, token, proxy, TheMarketplaceRegistry]);

  const approve = useCallback(() => {
    if (wallet && token) {
      setLoading("approve");
      (async () => {
        const proxy = await TheMarketplaceRegistry.connect(wallet.signer).proxies(wallet.address);
        if (proxy === ethers.constants.AddressZero) {
          toast.error("proxy not registered");
          return;
        }
        await IERC721(token).connect(wallet.signer).setApprovalForAll(proxy, true);
        setApproved("approving");
        toast.success("waiting for approval");
      })().catch(e => {
        unlessCancelledByUser(e, () => toast.error("failed to approve"));
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [wallet, IERC721, TheMarketplaceRegistry, token]);

  useEffect(() => {
    if (wallet && token && proxy && proxy !== "registering") {
      const erc721 = IERC721(token);
      const filter = erc721.filters["ApprovalForAll(address,address,bool)"](wallet.address, proxy);
      const listener = () => erc721.connect(wallet.signer).isApprovedForAll(wallet.address, proxy)
        .then(setApproved);
      erc721.connect(wallet.signer).on(filter, listener);
      return () => {
        erc721.off(filter, listener);
      };
    }
  }, [wallet, token, proxy, IERC721]);

  const signAndList = useCallback(() => {
    if (provider && wallet && token && tokenId && proxy && proxy !== "registering" && approved === true) {
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

      setLoading("signAndList");
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
        setListed(true);

        toast.success("sell order placed!");

      })().catch(e => {
        unlessCancelledByUser(e, () => toast.error("failed to list token"));
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [provider, wallet, token, tokenId, TheMarketplaceRegistry, TheMarketplace, StaticMarket, TheCoin, proxy, approved]);

  return (
    <div className="mx-auto text-center">

      {wallet ? (
        <>
          <div className="my-16">
            <h1 className="text-6xl">sell</h1>
          </div>

          <div>
            <img alt="" className="inline-block bg-white/10 p-2 rounded-md"
                 src={process.env.PUBLIC_URL + "/images/a0.png"} />
          </div>
          <h2 className="font-bold my-4">The NFT #{tokenId}</h2>

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
          <Button disabled={!!loading || approved === "approving" || approved || proxy === "registering" || proxy == null}
                  onClick={approve}>
            {
              loading === "approve" ? (<i className="animate-spin fa fa-circle-notch" />)
                : approved === "approving" ? (<><i className="animate-spin fa fa-circle-notch" /> Approving</>)
                  : approved ? "Approved"
                    : "Approve"
            }
          </Button>

          <i className="fa fa-arrow-right mx-4"></i>
          <Button disabled={!!loading || proxy === "registering" || proxy == null || approved === "approving" || !approved || listed}
                  onClick={signAndList}
                  color="primary">
            {
              loading === "signAndList" ? (<i className="animate-spin fa fa-circle-notch" />)
                : listed ? "Listed"
                  : "List"
            }
          </Button>
        </>
      ) : (
        <ConnectWalletMessage />
      )}

    </div>
  );
}
