import { createHelia } from "helia";
import { strings } from "@helia/strings";
import { dagJson } from "@helia/dag-json";
import { FsBlockstore } from "blockstore-fs";
import { base64 } from "multiformats/bases/base64";
import * as fs from "fs";

import { unixfs } from "@helia/unixfs";
// import { MemoryBlockstore } from 'blockstore-core'
import { CID } from "multiformats/cid";

const blockstore = new FsBlockstore("my_store");

const heliaWrite = await createHelia({
  blockstore,
});

const heliaRead = await createHelia({
  blockstore,
});

const sW = strings(heliaWrite);
const dW = dagJson(heliaWrite);

const sR = strings(heliaRead);
const dR = dagJson(heliaRead);

console.log("\n#string");

console.log("add");
const cid = await sW.add("hello world multi CID");
console.log(cid);

fs.writeFileSync("cid", cid.toString());
let read_cid = fs.readFileSync("cid", "utf8");
let parsed = CID.parse(read_cid);

console.log("get with read");
let text = await sR.get(parsed);
console.log("with parsed ", text);
// hello world

console.log("\n#dag-json");

const object1 = { hello: "world" };

let cid1 = await dW.add(object1);
console.log("add 1", cid1);
const object2 = { link: cid1 };

let cid2 = await dW.add(object2);
console.log("add2", cid2);

const retrievedObject = await dR.get(cid2);
console.log("get cid2", retrievedObject);
// { link: CID(baguqeerasor...) }

console.log("get cid2 link", await dR.get(retrievedObject.link));

///
console.log("\n\n####blockstore");

//const blockstoreMem = new MemoryBlockstore()

// create a Helia node
const helia1 = await createHelia({
  blockstore,
});
// create a filesystem on top of Helia, in this case it's UnixFS
const ufs1 = unixfs(helia1);

// we will use this TextEncoder to turn strings into Uint8Arrays
const encoder = new TextEncoder();

// add the bytes to your node and receive a unique content identifier
const cidB = await ufs1.addBytes(encoder.encode("Hello World 201"));

console.log("Added file:", cidB.toString());

// create a second Helia node using the same blockstore
const helia2 = await createHelia({
  blockstore,
});

// create a second filesystem
const ufs2 = unixfs(helia2);

// this decoder will turn Uint8Arrays into strings
const decoder = new TextDecoder();
let textB = "";

// read the file from the blockstore using the second Helia node
for await (const chunk of ufs2.cat(cidB)) {
  textB += decoder.decode(chunk, {
    stream: true,
  });
}

console.log("Added file contents:", textB);
