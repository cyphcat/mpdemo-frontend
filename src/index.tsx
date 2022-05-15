import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home";
import Faucet from "./pages/Faucet";
import {EthereumProvider} from "./wallet/EthereumContext";
import {ContractsProvider} from "./contracts/ContractsContext";
import Mint from "./pages/Mint";
import MyWallet from "./pages/MyWallet";
import Sell from "./pages/Sell";
import Buy from "./pages/Buy";
import Marketplace from "./pages/Marketplace";
import "react-toastify/dist/ReactToastify.css";

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
