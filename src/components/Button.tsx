import {ReactNode} from "react";

const colors = {
  "default": "bg-zinc-700 text-white hover:bg-zinc-200 hover:text-black active:bg-zinc-400",
  "primary": "bg-green-500 text-white hover:bg-green-400 active:bg-green-600",
  "disabled": "bg-zinc-700/50 text-zinc-400 cursor-default"
};

interface Props {
  children: ReactNode;
  className?: string;
  color?: keyof typeof colors;
  disabled?: boolean;
  onClick?: () => any;
}

export default function Button(props: Props) {
  return (
    <button
      className={"m-1 px-4 py-2 rounded-md font-bold " + colors[props.disabled ? "disabled" : (props.color ?? "default")] + " " + props.className}
      onClick={!props.disabled ? props.onClick : undefined}>
      {props.children}
    </button>
  );
}
