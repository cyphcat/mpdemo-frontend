import {useEffect, useState} from "react";
import {OrderListing} from "../wyvern/OrderListing";
import Button from "../components/Button";
import {Link} from "react-router-dom";
import {api} from "../api/api";

export default function Marketplace() {
  const [listings, setListings] = useState<OrderListing[]>([]);

  useEffect(() => {
    (async () => {
      const listings = await api.fetchOrders();
      setListings(listings);

    })().catch(e => {
      console.warn(e);
    })
  }, []);

  return (
    <div>
      <h1>Marketplace</h1>

      {listings.map(it => (
        <div key={it.hash}>
          <Link to={`/buy/${it.hash}`}>
            <Button>Buy</Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
