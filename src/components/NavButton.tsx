import {NavLink} from "react-router-dom";

interface Props {
  children: string;
  to: string;
}

export default function NavButton(props: Props) {
  return (
    <NavLink
      to={props.to}
      className={({isActive}) =>
        (isActive ? "bg-white/40" : "")
        + " inline-block m-1 px-4 py-2 rounded-md font-bold hover:bg-white/20 active:bg-black/5"
      }>
        <span className="drop-shadow">
          {props.children}
        </span>
    </NavLink>
  );
}
