import {useContracts} from "./contracts/ContractsContext";
import {useEthereum} from "./wallet/EthereumContext";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {useCallback, useEffect, useState} from "react";

export default function Faucet() {
  const eth = useEthereum();
  const {TheCoin} = useContracts();

  const [busy, setBusy] = useState(false);
  const [coinBalance, setCoinBalance] = useState("");

  const mint = useCallback(() => {
    if (eth.wallet) {
      setBusy(true);
      TheCoin.connect(eth.wallet.signer).mint(parseUnits("100.0"))
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
  }, [eth.wallet, TheCoin]);

  // outgoing transfer events
  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      const filter = TheCoin.filters["Transfer(address,address,uint256)"](wallet.address);
      const listener = () => TheCoin.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setCoinBalance(formatUnits(it)));
      TheCoin.connect(wallet.signer).on(filter, listener);
      return () => {
        TheCoin.off(filter, listener);
      };
    }
  }, [eth.wallet, TheCoin])

  // incoming transfer events
  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      const filter = TheCoin.filters["Transfer(address,address,uint256)"](null, wallet.address);
      const listener = () => TheCoin.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setCoinBalance(formatUnits(it)));
      TheCoin.connect(wallet.signer).on(filter, listener);
      return () => {
        TheCoin.off(filter, listener);
      };
    }
  }, [eth.wallet, TheCoin])

  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      TheCoin.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setCoinBalance(formatUnits(it)));
    }
  }, [eth.wallet, TheCoin])

  return (
    <div>
      <h1>COIN Faucet</h1>
      {eth.wallet ? (
        <div>
          <div>
            {busy ? (
              <span>Waiting...</span>
            ) : (
              <div>
                <button
                  className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-100 active:bg-gray-200"
                  onClick={mint}>
                  Get COIN
                </button>
              </div>
            )}
          </div>
          <div>
            <span>Current balance: {coinBalance} COIN</span>
          </div>
        </div>
      ) : (
        <div>
          Please connect your wallet.
        </div>
      )}
    </div>
  );
}
