import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/networth";

mixin (userNetWorthItems : Map.Map<Principal, Map.Map<Text, Types.NetWorthItem>>) {
  public shared ({ caller }) func saveNetWorthItems(items : [Types.NetWorthItem]) : async Result<(), Text> {
    Runtime.trap("not implemented");
  };

  public query ({ caller }) func getNetWorthItems() : async [Types.NetWorthItem] {
    Runtime.trap("not implemented");
  };
};
