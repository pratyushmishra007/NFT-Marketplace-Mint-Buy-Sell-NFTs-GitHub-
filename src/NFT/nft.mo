import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat8 "mo:base/Nat8";
actor class NFT(name: Text, owner: Principal, content: [Nat8]) = this {
    private let itemName = name;
    private var nftOwner = owner;
    private let imageBytes = content;

    public query func getName(): async Text{
        return itemName;
    };

    public query func getOwner(): async Principal{
        return nftOwner;
    };

    public query func getAsset(): async [Nat8]{
        return imageBytes;
    };

    public query func getCanisterId(): async Principal {
        return Principal.fromActor(this);
    };

    public shared(msg) func transferOwnership(newOwner: Principal): async Text{
        if(msg.caller == nftOwner){
            nftOwner := newOwner;
            return "Success";
        } else {
            return "Only the owner can transfer ownership";
        }
    };

    public query func getOpenDCanisterID() : async Principal{
        return Principal.fromActor(this);
    }
};