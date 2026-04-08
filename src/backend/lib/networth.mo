import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/networth";

module {
  public type NetWorthItem = Types.NetWorthItem;

  public func saveItems(
    store : Map.Map<Text, Map.Map<Text, NetWorthItem>>,
    caller : Principal,
    items : [NetWorthItem],
  ) : () {
    Runtime.trap("not implemented");
  };

  public func getItems(
    store : Map.Map<Text, Map.Map<Text, NetWorthItem>>,
    caller : Principal,
  ) : [NetWorthItem] {
    Runtime.trap("not implemented");
  };
};
