import React, {useContext} from "react";
import {
  IERC20,
  IERC721,
  StaticMarket,
  TheCoin,
  TheMarketplace,
  TheMarketplaceRegistry,
  TheNFT
} from "../../../mp-contracts/typechain";
import {ethers} from "ethers";

export interface IContractsContext {
  TheCoin: TheCoin;
  TheNFT: TheNFT;
  TheMarketplaceRegistry: TheMarketplaceRegistry;
  TheMarketplace: TheMarketplace;
  StaticMarket: StaticMarket;
  IERC20: (address: string) => IERC20;
  IERC721: (address: string) => IERC721;
}

const ContractsContext = React.createContext<IContractsContext>(undefined!);

export function useContracts() {
  return useContext(ContractsContext);
}

const CHAIN_ID = process.env.REACT_APP_CHAIN_ID || "31337";

export function ContractsProvider(props: { children: React.ReactNode }) {

  const addresses = (() => {
    switch (CHAIN_ID) {
      case "ropsten":
      case "3":
        return require("./deployments/3.json");
      case "localhost":
      case "31337":
      default:
        return require("./deployments/31337.json");
    }
  })();

  const contracts = {
    TheCoin: new ethers.Contract(addresses.TheCoin, require("./artifacts/TheCoin.json").abi) as TheCoin,
    TheNFT: new ethers.Contract(addresses.TheNFT, require("./artifacts/TheNFT.json").abi) as TheNFT,
    TheMarketplaceRegistry: new ethers.Contract(addresses.TheMarketplaceRegistry, require("./artifacts/TheMarketplaceRegistry.json").abi) as TheMarketplaceRegistry,
    TheMarketplace: new ethers.Contract(addresses.TheMarketplace, require("./artifacts/TheMarketplace.json").abi) as TheMarketplace,
    StaticMarket: new ethers.Contract(addresses.StaticMarket, require("./artifacts/StaticMarket.json").abi) as StaticMarket,
    IERC20: (address: string) => new ethers.Contract(address, require("./artifacts/IERC20.json").abi) as IERC20,
    IERC721: (address: string) => new ethers.Contract(address, require("./artifacts/IERC721.json").abi) as IERC721,
  };

  return (
    <ContractsContext.Provider value={contracts}>
      {props.children}
    </ContractsContext.Provider>
  );
}
