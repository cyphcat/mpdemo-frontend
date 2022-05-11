import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./Home";
import Faucet from "./Faucet";
import {EthereumProvider} from "./wallet/EthereumContext";
import {ContractsProvider} from "./contracts/ContractsContext";
import Mint from "./Mint";
import MyWallet from "./MyWallet";
import Sell from "./Sell";
import Buy from "./Buy";
import Marketplace from "./Marketplace";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <EthereumProvider>
      <ContractsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
              <Route path="faucet" element={<Faucet />} />
              <Route path="mint" element={<Mint />} />
              <Route path="mywallet" element={<MyWallet />} />
              <Route path="sell/:token/:tokenId" element={<Sell />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="buy/:hash" element={<Buy />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ContractsProvider>
    </EthereumProvider>
  </React.StrictMode>
);
