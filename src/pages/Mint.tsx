import {useEthereum} from "../wallet/EthereumContext";
import {useContracts} from "../contracts/ContractsContext";
import {useCallback, useEffect, useMemo, useState} from "react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import {toast} from "react-toastify";
import {unlessCancelledByUser} from "../wallet/util";

export default function Mint() {
  const {wallet} = useEthereum();
  const {TheNFT} = useContracts();

  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState("");

  const [quantityInput, setQuantityInput] = useState("1");

  const updateQuantity = useCallback(() => {
    setQuantityInput(v => {
      const q = Number.parseFloat(v);
      return Number.isFinite(q) && q >= 0 ? String(q) : "0";
    });
  }, []);

  const quantity = useMemo(() => {
    const v = Number.parseFloat(quantityInput);
    return (Number.isFinite(v) && v >= 0) ? v : 0;
  }, [quantityInput]);

  const mint = useCallback(() => {
    if (wallet && quantity > 0) {
      setBusy(true);
      TheNFT.connect(wallet.signer).mint(quantity)
        .then(() => {
          setQuantityInput("1");
          toast.success("minting in progress");
        })
        .catch(e => {
          unlessCancelledByUser(e, () => toast.error("failed to mint"));
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [wallet, TheNFT, quantity]);

  useEffect(() => {
    if (wallet) {
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](wallet.address);
      const listener = () => TheNFT.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setBalance(it.toString()));
      TheNFT.connect(wallet.signer).on(filter, listener);
      return () => {
        TheNFT.off(filter, listener);
      };
    }
  }, [wallet, TheNFT]);

  useEffect(() => {
    if (wallet) {
      const filter = TheNFT.filters["Transfer(address,address,uint256)"](null, wallet.address);
      const listener = () => TheNFT.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setBalance(it.toString()));
      TheNFT.connect(wallet.signer).on(filter, listener);
      return () => {
        TheNFT.off(filter, listener);
      };
    }
  }, [wallet, TheNFT]);

  useEffect(() => {
    if (wallet) {
      TheNFT.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setBalance(it.toString()));
    }
  }, [wallet, TheNFT]);

  return (
    <div className="mx-auto text-center">

      <div className="my-16">
        <h1 className="text-6xl text-cyan-500">the mint</h1>
        <h2 className="text-3xl">get your NFTs here</h2>
      </div>

      {wallet ? (
        <div>
          <div>
            {busy ? (
              <Loading />
            ) : (
              <div>
                <div>
                  <input type="text" className="m-1 p-2 rounded-md bg-white/10 text-center"
                         value={quantityInput} onChange={e => setQuantityInput(e.target.value)}
                         onBlur={updateQuantity} />
                </div>
                <Button onClick={mint} color="primary">mint {quantity} NFTs</Button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="opacity-60">you currently have</div>
            <div className="text-2xl">{balance} NFTs</div>
          </div>
        </div>
      ) : (
        <ConnectWalletMessage />
      )}
    </div>
  );
}
