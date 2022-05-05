import React from "react";
import {Link, Outlet} from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Marketplace</h1>
      <Link to="/">Home</Link>
      <Link to="mint">Mint</Link>
      <Outlet />
    </div>
  );
}
