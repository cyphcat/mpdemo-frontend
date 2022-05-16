import React, {useCallback, useContext, useEffect, useState} from "react";
import {ethers, Signer} from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

interface Wallet {
  address: string;
  signer: Signer;
}

interface IEthereumContext {
  provider?: ethers.providers.Web3Provider;
  wallet?: Wallet;
  connect: () => Promise<boolean>;
  disconnect: () => any;
}

const EthereumContext = React.createContext<IEthereumContext>(undefined!);

export function useEthereum() {
  return useContext(EthereumContext);
}

export function EthereumProvider(props: { children: React.ReactNode }) {

  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [wallet, setWallet] = useState<Wallet | undefined>();

  const onAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length >= 1) {
      const address = accounts[0].toLowerCase();
      const signer = provider!.getSigner(address);
      if (signer) {
        setWallet({signer, address});
        return true;
      }
    }
    setWallet(undefined);
    return false;
  }, [provider]);

  const connect = useCallback((): Promise<boolean> => {
    return (async () => {
      if (!provider) {
        return false;
      }

      const chainId = parseInt(process.env.REACT_APP_CHAIN_ID || "31337");
      await provider.send("wallet_switchEthereumChain", [{chainId: "0x" + chainId.toString(16)}]);

      const accounts = await provider.send("eth_requestAccounts", []);
      return onAccountsChanged(accounts);
    })().catch(e => {
      setWallet(undefined);
      console.warn(e);
      return false;
    });

  }, [provider, onAccountsChanged]);

  const disconnect = useCallback(() => {
    setWallet(undefined);
  }, []);

  useEffect(() => {
    let active = true;
    const fn = (accounts: string[]) => {
      if (active) {
        onAccountsChanged(accounts);
      }
    };
    window.ethereum?.on("accountsChanged", fn);
    return () => {
      active = false;
    };
  }, [provider, onAccountsChanged]);

  useEffect(() => {
    let active = true;
    const fn = () => {
      if (active) {
        window.location.reload();
      }
    };
    window.ethereum?.on("chainChanged", fn);
    return () => {
      active = false;
    };
  }, [provider]);

  useEffect(() => {
    detectEthereumProvider()
      .then((ethereum: any) => {
        if (ethereum) {
          setProvider(new ethers.providers.Web3Provider(ethereum, "any"));
        }
        return false;
      })
      .catch(e => {
        console.warn(e);
        return false;
      });
  }, []);

  return (
    <EthereumContext.Provider value={{
      provider,
      wallet,
      connect,
      disconnect,
    }}>
      {props.children}
    </EthereumContext.Provider>
  );
}
