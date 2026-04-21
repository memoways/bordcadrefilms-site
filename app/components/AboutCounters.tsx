import { readBCFNumbers } from "../lib/home";
import AboutCountersClient from "./AboutCountersClient";

export default async function AboutCounters() {
  const { numbers } = await readBCFNumbers();
  if (numbers.length === 0) return null;
  return <AboutCountersClient numbers={numbers} />;
}
