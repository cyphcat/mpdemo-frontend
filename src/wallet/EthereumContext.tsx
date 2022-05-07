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
      const address = accounts[0];
      const signer = provider!.getSigner(address);
      if (signer) {
        setWallet({signer, address});
        return true;
      }
    }
    setWallet(undefined);
    return false;
  }, [provider]);

  const connect = useCallback(() => {
    return provider?.send("eth_requestAccounts", [])
      .then((accounts: string[]) => {
        return onAccountsChanged(accounts);
      })
      .catch(e => {
        console.warn(e);
        setWallet(undefined);
        return false;
      }) ?? Promise.resolve(false);
  }, [provider, onAccountsChanged]);

  const disconnect = useCallback(() => {
    setWallet(undefined);
  }, []);

  useEffect(() => {
    const fn = (accounts: string[]) => onAccountsChanged(accounts);
    provider?.on("accountsChanged", fn);
    return () => {
      provider?.off("accountsChanged", fn);
    };
  }, [provider, onAccountsChanged]);

  useEffect(() => {
    const fn = () => window.location.reload();
    provider?.on("chainChanged", fn);
    return () => {
      provider?.off("chainChanged", fn);
    };
  }, [provider]);

  useEffect(() => {
    detectEthereumProvider()
      .then((ethereum: any) => {
        if (ethereum) {
          setProvider(new ethers.providers.Web3Provider(ethereum));
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
