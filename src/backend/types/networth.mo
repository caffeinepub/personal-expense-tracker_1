module {
  public type NetWorthItem = {
    id : Text;
    name : Text;
    amount : Float;
    itemType : Text; // "asset" | "liability"
    createdAt : Int;
  };
};
