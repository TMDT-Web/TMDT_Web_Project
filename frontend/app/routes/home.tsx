import type { Route } from "./+types/home";
import { Link } from "react-router";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "HiHi Store" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
     <div>hehe</div>
  );
}
