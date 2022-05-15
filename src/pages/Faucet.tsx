import {useContracts} from "../contracts/ContractsContext";
import {useEthereum} from "../wallet/EthereumContext";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {ChangeEvent, useCallback, useEffect, useMemo, useState} from "react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ConnectWalletMessage from "../components/ConnectWalletMessage";
import {toast} from "react-toastify";
import {unlessCancelledByUser} from "../wallet/util";

export default function Faucet() {
  const eth = useEthereum();
  const {TheCoin} = useContracts();

  const [busy, setBusy] = useState(false);
  const [coinBalance, setCoinBalance] = useState("");

  const [amountInput, setAmountInput] = useState("100");

  const updateAmount = useCallback(() => {
    setAmountInput(v => {
      const amount = Number.parseFloat(v);
      return Number.isFinite(amount) && amount >= 0 ? String(amount) : "0";
    });
  }, []);

  const amount = useMemo(() => {
    const v = Number.parseFloat(amountInput);
    return (Number.isFinite(v) && v >= 0) ? v : 0;
  }, [amountInput]);

  const mint = useCallback(() => {
    if (eth.wallet && amount > 0) {
      setBusy(true);
      TheCoin.connect(eth.wallet.signer).mint(parseUnits(amount.toString()))
        .then(() => {
          setAmountInput("100");
          toast.success("minting in progress");
        })
        .catch(e => {
          unlessCancelledByUser(e, () => toast.error("failed to mint"));
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [eth.wallet, TheCoin, amount]);

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
  }, [eth.wallet, TheCoin]);

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
  }, [eth.wallet, TheCoin]);

  useEffect(() => {
    const {wallet} = eth;
    if (wallet) {
      TheCoin.connect(wallet.signer).balanceOf(wallet.address)
        .then(it => setCoinBalance(formatUnits(it)));
    }
  }, [eth.wallet, TheCoin]);

  return (
    <div className="mx-auto text-center">

      <div className="my-16">
        <h1 className="text-6xl text-blue-500">the faucet</h1>
        <h2 className="text-3xl">unlimited supply of COINs</h2>
      </div>

      {eth.wallet ? (
        <div>
          <div>
            {busy ? (
              <Loading />
            ) : (
              <div>
                <div>
                  <input type="text" className="m-1 p-2 rounded-md bg-white/10 text-center"
                         value={amountInput} onChange={e => setAmountInput(e.target.value)}
                         onBlur={updateAmount} />
                </div>
                <Button onClick={mint} color="primary">get {amount} COINs</Button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="opacity-60">current balance</div>
            <div className="text-2xl">{coinBalance} COIN</div>
          </div>
        </div>
      ) : (
        <ConnectWalletMessage />
      )}
    </div>
  );
}
