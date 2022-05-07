import React from "react";
import {Link, Outlet} from "react-router-dom";
import {useEthereum} from "./wallet/EthereumContext";
import {shortWalletAddress} from "./wallet/util";
import Button from "./Button";

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
          <div>
            Connected: {shortWalletAddress(eth.wallet.address)}
            <Button onClick={disconnect}>Disconnect</Button>
          </div>
        ) : (
          <Button onClick={connect}>Connect</Button>
        )}
      </div>
      <Link to="/">Home</Link>
      <Link to="/faucet">Faucet</Link>
      <Link to="/mint">Mint</Link>
      <Outlet />
    </div>
  );
}
