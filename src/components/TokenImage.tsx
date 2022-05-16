import {useContracts} from "../contracts/ContractsContext";
import {useEthereum} from "../wallet/EthereumContext";
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import Loading from "./Loading";
import axios from "axios";

interface Props {
  token: string;
  tokenId: string;
  className?: string;
}

function resolveUri(uri: string) {
  return uri.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + uri.substring(7) : uri;
}

export default function TokenImage(props: Props) {
  const {provider, wallet} = useEthereum();
  const {IERC721Metadata} = useContracts();

  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    (async () => {
      if (provider && provider.network.chainId === 31337) {
        setImageUrl(process.env.PUBLIC_URL + "/images/0.png");
      } else {
        if (wallet) {
          const uri = await IERC721Metadata(props.token).connect(wallet.signer).tokenURI(props.tokenId);
          const metadata = await axios.get(resolveUri(uri)).then(r => r.data);
          console.log(metadata);
          const imageUri = metadata["image"];
          if (imageUri) {
            setImageUrl(resolveUri(imageUri));
          }
        }
      }
    })().catch(e => {
      console.warn(e);
      toast.error("can't load token image");
    });
  }, [wallet, props.token, props.tokenId, IERC721Metadata, provider]);

  return (
    <>
      {imageUrl ? (
        <img className={props.className} src={imageUrl} alt="Token" />
      ) : (
        <span className={props.className}>
          <Loading />
        </span>
      )}
    </>
  );
}
