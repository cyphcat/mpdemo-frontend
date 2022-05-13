import Button from "../components/Button";
import {useNavigate} from "react-router-dom";
import {useCallback} from "react";

export default function Home() {
  const navigate = useNavigate();

  const browse = useCallback(() => {
    navigate("marketplace");
  }, []);

  return (
    <div className="mx-auto text-center">

      <div className="my-16">
        <h2 className="text-4xl">welcome to</h2>
        <h1 className="text-6xl text-green-500">the marketplace</h1>
      </div>

      <Button onClick={browse}>browse</Button>
    </div>
  );
}
