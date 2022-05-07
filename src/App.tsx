import React from "react";
import {Link, Outlet} from "react-router-dom";
import {useEthereum} from "./wallet/EthereumContext";
import {shortWalletAddress} from "./wallet/util";

export default function App() {
  const eth = useEthereum();

  const connect = () => {
    eth.connect()
      .catch(() => {
        console.warn("unable to connect to wallet");
      });
  };

  const disconnect = () => {
    eth.disconnect();
  };

  return (
    <div className="container mx-auto">
      <h1>Marketplace</h1>
      <div className="">
        {eth.wallet ? (
          <button
            className="px-4 py-2 rounded-full border-2 border-green-500 text-white font-bold hover:bg-green-500 active:bg-green-600 active:border-green-600"
            onClick={disconnect}>
            Connected: {shortWalletAddress(eth.wallet.address)}
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-full bg-green-500 border-2 border-green-500 text-white font-bold hover:bg-green-400 hover:border-green-400 active:bg-green-600 active:bg-green-600 active:border-green-600"
            onClick={connect}>
            Connect
          </button>
        )}
      </div>
      <Link to="/">Home</Link>
      <Link to="/faucet">Faucet</Link>
      <Link to="/mint">Mint</Link>
      <Outlet />
    </div>
  );
}
