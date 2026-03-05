import "fast-text-encoding";
import "react-native-get-random-values";
import { Buffer } from "buffer";

if (!global.Buffer) {
  global.Buffer = Buffer;
}

require("@ethersproject/shims");
require("expo-router/entry");
