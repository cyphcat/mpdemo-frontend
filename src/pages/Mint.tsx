import {useEthereum} from "../wallet/EthereumContext";
import {useContracts} from "../contracts/ContractsContext";
import {useCallback, useEffect, useState} from "react";
import Button from "../components/Button";

export default function Mint() {
  const eth = useEthereum();
  const {TheNFT} = useContracts();

  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState("");

  const mint = useCallback(() => {
    if (eth.wallet) {
      setBusy(true);
      TheNFT.connect(eth.wallet.signer).mint(5)
        .then(() => {
          console.log("ok");
        })
        .catch(e => {
          console.warn(e);
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [eth.wallet, TheNFT]);

  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](wallet.address);
      const listener = () => TheNFT.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setBalance(it.toString()));
      TheNFT.connect(wallet.signer).on(filter, listener);
      return () => {
        TheNFT.off(filter, listener);
      };
    }
  }, [eth.wallet, TheNFT]);

  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](null, wallet.address);
      const listener = () => TheNFT.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setBalance(it.toString()));
      TheNFT.connect(wallet.signer).on(filter, listener);
      return () => {
        TheNFT.off(filter, listener);
      };
    }
  }, [eth.wallet, TheNFT]);

  useEffect(() => {
    if (eth.wallet) {
      TheNFT.connect(eth.wallet.signer).balanceOf(eth.wallet.address)
        .then(it => setBalance(it.toString()));
    }
  }, [eth.wallet, TheNFT]);

  return (
    <div>
      <h1>Mint</h1>

      {eth.wallet ? (
        <div>
          {busy ? (
            <div>Waiting...</div>
          ) : (
            <div>
              <Button onClick={mint}>Mint NFT</Button>

              <div>
                You have {balance} NFT(s).
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>Please connect your wallet.</div>
      )}
    </div>
  );
}
