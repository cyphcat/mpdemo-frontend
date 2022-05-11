interface Props {
  children: string;
  onClick?: () => any;
}

export default function Button(props: Props) {
  return (
    <button
      className={
        "px-4 py-2 rounded-full bg-green-500 border-2 border-green-500 text-white font-bold"
        + " hover:bg-green-400 hover:border-green-400 active:bg-green-600 active:bg-green-600 active:border-green-600"
      }
      onClick={props.onClick}>
      {props.children}
    </button>
  );
}
