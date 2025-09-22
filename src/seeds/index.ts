import { NODE_ENV } from "../utils/env.js";
import { Dump } from "./dump.js";
import { Essential } from "./essential.js";

const seeds = [Essential];

if (["testing", "development"].includes(NODE_ENV)) seeds.push(Dump);

export default seeds;
