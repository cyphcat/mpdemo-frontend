import {useEffect, useState} from "react";
import {OrderListing} from "../wyvern/OrderListing";
import Button from "../components/Button";
import {Link} from "react-router-dom";
import {api} from "../api/api";
import Loading from "../components/Loading";
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import {useEthereum} from "../wallet/EthereumContext";

export default function Marketplace() {
  const {wallet} = useEthereum();

  const [listings, setListings] = useState<OrderListing[]>([]);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    (async () => {
      const listings = await api.fetchOrders();
      setListings(listings);

    })().catch(e => {
      console.warn(e);
    }).finally(() => {
      setBusy(false);
    })
  }, []);

  return (
    <div className="mx-auto text-center">

      <div className="my-16">
        <h2 className="text-4xl">good stuff in</h2>
        <h1 className="text-6xl text-emerald-500">the marketplace</h1>
      </div>

      {wallet ? (
        <>
          {busy ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map(it => (
                <div className="p-4 rounded-md bg-white/5 " key={it.hash}>
                  <div className="flex flex-row justify-center">
                    <img alt="Image" src={process.env.PUBLIC_URL + "/images/a0.png"} />
                  </div>
                  <div className="mt-4 flex flex-row items-center text-left">
                    <span className="flex-1 font-bold">The NFT #{it.tokenId}</span>
                    <Link to={`/buy/${it.hash}`}>
                      <Button>Buy</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <ConnectWalletMessage />
      )}
    </div>
  );
}
