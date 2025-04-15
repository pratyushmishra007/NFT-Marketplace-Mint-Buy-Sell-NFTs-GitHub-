import React, { useEffect, useState } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIDlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PriceLable from "./PriceLable";
import { canisterId } from "../../../declarations/nft/index";
function Item(props) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [sellStatus, setSellStatus] = useState("");
  const [blur, setBlur] = useState();
  const [priceLable, setPriceLable] = useState();
  const [shouldDisplay, setDisplay] = useState(true);
  const id = props.id;
  let NFTActor;

  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({ host: localHost });
  // If deploying online(if i became rich enough) then i have to remove this line of code:
  agent.fetchRootKey();

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();

    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(
      new Blob([imageContent.buffer], { type: "image/png" })
    );
    setOwner(owner.toText());
    setName(name);
    setImage(image);
    if(props.role == "collection"){
    const nftIsListed = await opend.isListed(props.id);
    if(nftIsListed){
      setOwner("OpenD");
      setBlur({filter: "blur(4px)"});
      setSellStatus("Listed");
    } else {
      setButton(<Button handleClick={handelSell} text={"Sell"} />);
    }
  } else if(props.role == "discover") {
    const originalOwner = await opend.getOriginalOwner(props.id); // Already Principal
    console.log("original: ", originalOwner);
    console.log("original: ", CURRENT_USER_ID);
    if(originalOwner.toText() != CURRENT_USER_ID.toText()){
      setButton(<Button handleClick={handelBuy} text={"Buy"} />);
    }
    const price = await opend.getListedNFTPrice(props.id);
    setPriceLable(<PriceLable sellPrice={price.toString()}/>);
  }
  }

  useEffect(() => {
    loadNFT();
  }, []);
  let price;
  function handelSell() {
    setPriceInput(
      <input
        placeholder="Price in DPRAT"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => (price = e.target.value)}
      />
    );
    setButton(<Button handleClick={sellItem} text={"Confirm"} />);
  }
  async function sellItem() {
    setBlur({filter: "blur(4px)"})
    setLoaderHidden(false);
    const ListingResult = await opend.listItem(props.id, Number(price));
    console.log(ListingResult);
    if (ListingResult == "Success") {
      const openDId = await NFTActor.getOpenDCanisterID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log(transferResult);
      if(transferResult == "Success"){
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");
        setSellStatus("Listed");
      }
      else{
        setLoaderHidden(true);
      }
    }
  }
  async function handelBuy() {
    console.log("Buy Triggered");
    setLoaderHidden(false);
    const tokenActor = await Actor.createActor(tokenIDlFactory, {
      agent,
      canisterId: Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"),
    });
    
    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);
    
    const result = await tokenActor.transfer(sellerId, itemPrice);
    if(result == "Success") {
      const transferResult = await opend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log("ok", transferResult);

      setLoaderHidden(true);
      setDisplay(false);
    }
    console.log(result);
  }
  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden = {loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLable}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}
            <span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
