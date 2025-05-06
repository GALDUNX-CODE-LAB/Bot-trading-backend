import { JsonRpcProvider } from "ethers";
import secret from "../config/secret-config";

export const provider = new JsonRpcProvider(secret.RPC_URL);
