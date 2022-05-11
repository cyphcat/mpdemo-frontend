import {useEffect, useState} from "react";
import {useEthereum} from "./wallet/EthereumContext";
import {useContracts} from "./contracts/ContractsContext";
import Button from "./Button";
import {Link} from "react-router-dom";

export default function MyWallet() {
  const eth = useEthereum();
  const {TheNFT} = useContracts();

  const [tokenIds, setTokenIds] = useState<string[]>([]);

  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      const ownedTokenIds = new Set<string>();
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](null, wallet.address);
      TheNFT.connect(wallet.signer).queryFilter(filter, -20) // paginate?
        .then(async events => {
          for (const event of events) {
            const [, , tokenId] = event.args;
            const owner = await TheNFT.connect(wallet.signer).ownerOf(tokenId)
            if (owner.toLowerCase() === wallet.address) {
              ownedTokenIds.add(tokenId.toString());
            }
          }
          setTokenIds(Array.from(ownedTokenIds));
        })
        .catch(e => {
          console.warn(e);
        });
    }
  }, [eth.wallet, TheNFT]);

  return (
    <div>
      <h1>My Wallet</h1>

      <div className="grid grid-cols-3 gap-4">
        {tokenIds.map(tokenId => (
          <div className="p-4 rounded-md bg-zinc-700" key={tokenId}>
            <span>NFT #{tokenId}</span>

            <Link to={`/sell/${TheNFT.address}/${tokenId}`}>
              <Button>Sell</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
