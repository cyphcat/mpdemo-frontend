import {useEffect, useState} from "react";
import {useEthereum} from "../wallet/EthereumContext";
import {useContracts} from "../contracts/ContractsContext";
import Button from "../components/Button";
import {Link} from "react-router-dom";
import Loading from "../components/Loading";
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import TokenImage from "../components/TokenImage";

export default function MyWallet() {
  const {wallet} = useEthereum();
  const {TheNFT} = useContracts();

  const [busy, setBusy] = useState(true);
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  // probably not a good way to query nfts in wallet
  useEffect(() => {
    if (wallet) {
      setBusy(true);
      const ownedTokenIds = new Set<string>();
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](null, wallet.address);
      TheNFT.connect(wallet.signer).queryFilter(filter)
        .then(async events => {
          for (const event of events) {
            const [, , tokenId] = event.args;
            try {
              const owner = await TheNFT.connect(wallet.signer).ownerOf(tokenId);
              if (owner.toLowerCase() === wallet.address) {
                ownedTokenIds.add(tokenId.toString());
              }
            } catch (e: any) {
              console.warn(e);
            }
          }
          setTokenIds(Array.from(ownedTokenIds));
        })
        .catch(e => {
          console.warn(e);
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [wallet, TheNFT]);

  return (
    <div className="mx-auto text-center">

      <div className="my-16">
        <h2 className="text-3xl">what's inside</h2>
        <h1 className="text-6xl text-purple-500">my wallet</h1>
      </div>

      {wallet ? (
        <>
          {busy ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokenIds.map(tokenId => (
                <div className="p-4 rounded-md bg-white/5 " key={tokenId}>
                  <div className="flex flex-row justify-center">
                    <TokenImage token={TheNFT.address} tokenId={tokenId} />
                  </div>
                  <div className="mt-4 flex flex-row items-center text-left">
                    <span className="flex-1 font-bold">The NFT #{tokenId}</span>
                    <Link to={`/sell/${TheNFT.address}/${tokenId}`}>
                      <Button>Sell</Button>
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
