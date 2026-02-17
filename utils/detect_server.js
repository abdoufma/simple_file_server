//@ts-check

import { networkInterfaces } from "os";

const SERVER_PORT = 3000;
const SERVER_RESPONSE = "OK";

const subnet_range = () => {
  const interfaces = Object.values(networkInterfaces()).flat();
  for (const iface of interfaces) {
    if (iface === undefined) continue;
    if (iface.internal) continue;
    if (iface.family !== "IPv4") continue;
    return iface.address.replace(/\.\d+$/, ".0/24");
  }
  throw new Error("No IPv4 interface found");
};

const args = process.argv.slice(2);
const subnet_arg = args.find((arg) => arg.startsWith("--subnet-range="));
const subnet_range = subnet_arg ? subnet_arg?.split("=")[1] : subnet_range();

console.log(subnet_range());
