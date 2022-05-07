import React, {useContext} from "react";
import {StaticMarket, TheCoin, TheMarketplace, TheMarketplaceRegistry, TheNFT} from "../../../mp-contracts/typechain";
import {ethers} from "ethers";

export interface IContractsContext {
  TheCoin: TheCoin;
  TheNFT: TheNFT;
  TheMarketplaceRegistry: TheMarketplaceRegistry;
  TheMarketplace: TheMarketplace;
  StaticMarket: StaticMarket;
}

const ContractsContext = React.createContext<IContractsContext>(undefined!);

export function useContracts() {
  return useContext(ContractsContext);
}

export function ContractsProvider(props: { children: React.ReactNode }) {

  const addresses = require("./deployments/31337.json");
  const contracts = {
    TheCoin: new ethers.Contract(addresses.TheCoin, require("./artifacts/TheCoin.json").abi) as TheCoin,
    TheNFT: new ethers.Contract(addresses.TheNFT, require("./artifacts/TheNFT.json").abi) as TheNFT,
    TheMarketplaceRegistry: new ethers.Contract(addresses.TheMarketplaceRegistry, require("./artifacts/TheMarketplaceRegistry.json").abi) as TheMarketplaceRegistry,
    TheMarketplace: new ethers.Contract(addresses.TheMarketplace, require("./artifacts/TheMarketplace.json").abi) as TheMarketplace,
    StaticMarket: new ethers.Contract(addresses.StaticMarket, require("./artifacts/StaticMarket.json").abi) as StaticMarket,
  };

  return (
    <ContractsContext.Provider value={contracts}>
      {props.children}
    </ContractsContext.Provider>
  );
}
