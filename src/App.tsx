import React from "react";
import {Outlet} from "react-router-dom";
import {useEthereum} from "./wallet/EthereumContext";
import {shortWalletAddress, unlessCancelledByUser} from "./wallet/util";
import Button from "./components/Button";
import NavButton from "./components/NavButton";
import {toast, ToastContainer} from "react-toastify";

export default function App() {
  const eth = useEthereum();

  const connect = () => {
    eth.connect()
      .then((ok) => {
        if (ok) {
          toast.success("wallet connected!");
        } else {
          toast.error("can't connect wallet");
        }
      })
      .catch(e => {
        unlessCancelledByUser(e, () => toast.error("can't connect wallet"));
      });
  };

  const disconnect = () => {
    eth.disconnect();
  };

  return (
    <div className="container mx-auto p-8">

      <div className="flex flex-row items-end">
        <h1 className="p-2 text-5xl text-green-500">the marketplace</h1>

        <div className="flex-1"></div>

        <div className="">
          {eth.wallet ? (
            <div className="-mx-1">
              <span className="font-bold mx-4">connected: {shortWalletAddress(eth.wallet.address)}</span>
              <Button onClick={disconnect}>disconnect</Button>
            </div>
          ) : (
            <Button onClick={connect}>connect</Button>
          )}
        </div>
      </div>

      <div className="p-1 my-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-md">
        <NavButton to="/">home</NavButton>
        <NavButton to="/faucet">faucet</NavButton>
        <NavButton to="/mint">mint</NavButton>
        <NavButton to="/mywallet">my wallet</NavButton>
        <NavButton to="/marketplace">browse</NavButton>
      </div>

      <Outlet />

      <ToastContainer position="bottom-right"
                      theme="dark"
                      bodyClassName="block font-bold text-sm"
                      hideProgressBar
                      closeButton={false}
                      closeOnClick />
    </div>
  );
}
